import { Response } from 'express';
import { fetchValidationRules, fetchValidationRuleMetadata } from '../services/salesforceService';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/types';
import { getPendingChanges, setPendingChange, removePendingChange } from '../repositories/pendingChangesRepo';

export interface PendingChange {
  id: string;
  name: string;
  fullName: string;
  objectName: string;
  description: string;
  errorMessage: string;
  errorDisplayField: string;
  active: boolean;          // Proposed status
  originalActive: boolean;  // Current Salesforce status
  timestamp?: string;
}

export const getValidationRules = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const userId = req.user.userId;

  try {
    logger.info(`Fetching validation rules for user: ${req.user.username}`);
    const sfRules = await fetchValidationRules(req.user.accessToken!, req.user.instanceUrl!);
    const pending = await getPendingChanges(userId);

    // Convert to map for quick lookup
    const pendingMap = new Map<string, PendingChange>(pending.map((p: any) => [p.fullName, p]));

    const mergedRules = sfRules.map(rule => {
      const p = pendingMap.get(rule.fullName);
      if (p) {
        return {
          ...rule,
          isPending: true,
          stagedActive: p.active
        };
      }
      return {
        ...rule,
        isPending: false,
        stagedActive: rule.active
      };
    });

    // Server-side search, filter, sort, pagination
    const q = (req.query.q as string) || ''
    const filter = (req.query.filter as string) || 'all' // active|inactive|all
    const sortBy = (req.query.sortBy as string) || 'objectName'
    const sortDir = (req.query.sortDir as string) || 'asc'
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10))
    const pageSize = Math.max(1, parseInt((req.query.pageSize as string) || '25', 10))

    let list = mergedRules

    if (q) {
      const ql = q.toLowerCase()
      list = list.filter(r => r.name.toLowerCase().includes(ql) || r.objectName.toLowerCase().includes(ql) || r.fullName.toLowerCase().includes(ql))
    }

    if (filter === 'active') list = list.filter(r => r.stagedActive === true)
    else if (filter === 'inactive') list = list.filter(r => r.stagedActive === false)

    list = list.sort((a:any,b:any) => {
      const av = (a as any)[sortBy] ?? ''
      const bv = (b as any)[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    const total = list.length
    const start = (page - 1) * pageSize
    const paged = list.slice(start, start + pageSize)

    return res.json({ rules: paged, pendingCount: pending.length, total, page, pageSize, timestamp: new Date().toISOString() })
  } catch (error: any) {
    logger.error('Failed to retrieve validation rules', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve validation rules.', 
      details: error.message || String(error)
    });
  }
};

export const getValidationRuleDetail = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { id } = req.params;
  const userId = req.user.userId;

  try {
    logger.info(`Retrieving full metadata for validation rule ID: ${id}`);
    const metadata = await fetchValidationRuleMetadata(req.user.accessToken!, req.user.instanceUrl!, id);
    const pending = (await getPendingChanges(userId)).find((p: any) => p.fullName === metadata.fullName);
    const result = pending 
      ? { ...metadata, isPending: true, stagedActive: pending.active }
      : { ...metadata, isPending: false, stagedActive: metadata.active };

    return res.json(result);
  } catch (error: any) {
    logger.error(`Error loading validation rule metadata for ID: ${id}`, error);
    return res.status(500).json({ error: 'Failed to retrieve rule details' });
  }
};

export const toggleRule = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { id } = req.params;
  const { active, fullName, originalActive, name, objectName, description, errorMessage, errorDisplayField } = req.body;
  const userId = req.user.userId;

  if (active === undefined || !fullName) {
    return res.status(400).json({ error: 'Missing required parameters: active state and fullName' });
  }

  try {
    // If proposed active status is identical to original Salesforce status, delete the pending change
    if (active === originalActive) {
      await removePendingChange(userId, fullName)
      logger.info(`Removed pending stage status change for rule: ${fullName}`);
      return res.json({ id, fullName, isPending: false, stagedActive: originalActive });
    }

    const change = {
      id,
      name: name || fullName.split('.')[1],
      fullName,
      objectName: objectName || fullName.split('.')[0],
      description: description || '',
      errorMessage: errorMessage || '',
      errorDisplayField: errorDisplayField || 'Top of Page',
      active,
      originalActive,
      timestamp: new Date().toISOString()
    }

    await setPendingChange(userId, fullName, change)

    logger.info(`Staged pending rule change for ${fullName}: proposed active = ${active}`);
    return res.json({
      id,
      fullName,
      isPending: true,
      stagedActive: active,
      originalActive
    });
  } catch (error: any) {
    logger.error('Failed to toggle validation rule stage status', error);
    return res.status(500).json({ error: 'Failed to register validation rule change' });
  }
};

export const bulkToggleRules = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { rules } = req.body;
  const userId = req.user.userId;

  if (!rules || !Array.isArray(rules)) {
    return res.status(400).json({ error: 'Missing parameter rules as array' });
  }

  try {
    let stagedCount = 0;
    let revertedCount = 0;

    for (const rule of rules) {
      const { id, fullName, active, originalActive, name, objectName, description, errorMessage, errorDisplayField } = rule;
      if (active === originalActive) {
        await removePendingChange(userId, fullName)
        revertedCount++
      } else {
        const change = {
          id,
          name: name || fullName.split('.')[1],
          fullName,
          objectName: objectName || fullName.split('.')[0],
          description: description || '',
          errorMessage: errorMessage || '',
          errorDisplayField: errorDisplayField || 'Top of Page',
          active,
          originalActive,
          timestamp: new Date().toISOString()
        }
        await setPendingChange(userId, fullName, change)
        stagedCount++
      }
    }

    const pendingList = await getPendingChanges(userId)
    logger.info(`Bulk staged: ${stagedCount} rule(s) changed, ${revertedCount} rule(s) reverted.`);
    return res.json({
      success: true,
      stagedCount,
      revertedCount,
      totalStaged: pendingList.length
    });
  } catch (error: any) {
    logger.error('Failed in bulk rule stage modification', error);
    return res.status(500).json({ error: 'Failed to process bulk changes' });
  }
};

export const getPendingForUser = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' })
  try {
    const pending = await getPendingChanges(req.user.userId)
    return res.json({ pending })
  } catch (err: any) {
    logger.error('Failed to retrieve pending changes', err)
    return res.status(500).json({ error: 'Failed to retrieve pending changes' })
  }
}

export const deletePending = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' })
  const { id } = req.params
  if (!id) return res.status(400).json({ error: 'Missing pending change id (fullName)' })
  try {
    await removePendingChange(req.user.userId, id)
    return res.json({ success: true })
  } catch (err: any) {
    logger.error('Failed to delete pending change', err)
    return res.status(500).json({ error: 'Failed to delete pending change' })
  }
}
