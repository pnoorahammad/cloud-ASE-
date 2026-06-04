import { Response } from 'express';
import { deployValidationRules, DeploymentLogEntry, DeploymentChange } from '../services/salesforceService';
import { getPendingChanges, clearPending } from '../repositories/pendingChangesRepo';
import { setDeployStatus, getDeployStatus, clearDeployStatus, enqueueDeployment } from '../repositories/deployRepo';
import { saveAuditLog, getAuditLogs } from '../models/AuditLog';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/types';

interface UserDeploymentStatus {
  progress: number;
  logs: DeploymentLogEntry[];
  isFinished: boolean;
  success: boolean;
  startTime: string;
  message?: string;
}

export const getDeploymentStatus = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const userId = req.user.userId;
  return getDeployStatus(userId).then(status => {
    if (!status) {
      return res.json({ progress: 0, logs: [], isFinished: true, success: true, message: 'No deployment running currently' });
    }
    return res.json(status);
  }).catch(err => {
    logger.error('Failed to read deploy status', err);
    return res.status(500).json({ error: 'Failed to read deployment status' });
  })
};

export const startDeployment = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const userId = req.user.userId;
  const username = req.user.username || req.user.email || 'user';
  const pendingList = await getPendingChanges(userId);
  if (!pendingList || pendingList.length === 0) {
    return res.status(400).json({ error: 'No pending changes to deploy. Toggle rule status first.' });
  }

  // Prevent concurrent deploys by checking status
  const existing = await getDeployStatus(userId);
  if (existing && !existing.isFinished) {
    return res.status(409).json({ error: 'A deployment is already running. Please wait for it to complete.' });
  }

  const changesToDeploy: DeploymentChange[] = pendingList.map((c: any) => ({ id: c.id, fullName: c.fullName, active: c.active }));
  const rulesList = pendingList.map((c: any) => c.fullName);

  const deploymentStatus: UserDeploymentStatus = { progress: 0, logs: [], isFinished: false, success: false, startTime: new Date().toISOString() };
  await setDeployStatus(userId, deploymentStatus);

  // Enqueue background job
  await enqueueDeployment({ userId, username, accessToken: req.user.accessToken, instanceUrl: req.user.instanceUrl, changes: changesToDeploy, affectedRules: rulesList });

  // Trigger a background worker runner (fire-and-forget)
  runDeployInBackground(req.user.accessToken!, req.user.instanceUrl!, userId, username, changesToDeploy, rulesList);

  return res.status(202).json({ message: 'Deployment queued and running in background.', totalStaged: changesToDeploy.length });
};

const runDeployInBackground = async (
  accessToken: string,
  instanceUrl: string,
  userId: string,
  username: string,
  changes: DeploymentChange[],
  affectedRules: string[]
) => {
  // Initialize status
  const statusTracker: UserDeploymentStatus = { progress: 0, logs: [], isFinished: false, success: false, startTime: new Date().toISOString() };
  await setDeployStatus(userId, statusTracker);

  try {
    const result = await deployValidationRules(accessToken, instanceUrl, changes, async (progress, logEntry) => {
      // update status in Redis
      statusTracker.progress = progress;
      statusTracker.logs.push(logEntry);
      await setDeployStatus(userId, statusTracker);
    });

    statusTracker.isFinished = true;
    statusTracker.success = result.success;
    await setDeployStatus(userId, statusTracker);

    const details = result.success ? `Successfully deployed active status change for rules: ${affectedRules.join(', ')}` : `Failed to deploy rule updates. Review logs for details.`;

    await saveAuditLog({ timestamp: new Date(), username, userId, action: 'Deploy Validation Rules', details, status: result.success ? 'SUCCESS' : 'FAILED', logs: result.logs, affectedRules });

    if (result.success) {
      await clearPending(userId);
      logger.info(`Successfully finished and logged deployment for ${username}`);
    } else {
      logger.warn(`Deployment for ${username} finished with errors`);
    }

  } catch (error: any) {
    logger.error(`Deployment crash in background thread for user ${username}:`, error);
    statusTracker.isFinished = true;
    statusTracker.success = false;
    statusTracker.logs.push({ timestamp: new Date().toISOString(), message: `Fatal Background Error: ${error.message || String(error)}`, status: 'error' });
    await setDeployStatus(userId, statusTracker);

    await saveAuditLog({ timestamp: new Date(), username, userId, action: 'Deploy Validation Rules', details: 'Fatal crash occurred during deployment.', status: 'FAILED', logs: statusTracker.logs.map(l => `[${l.status.toUpperCase()}] ${l.message}`).join('\n'), affectedRules });
  }
};

export const getHistoryLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await getAuditLogs(50);
    return res.json(logs);
  } catch (error: any) {
    logger.error('Failed to get history logs', error);
    return res.status(500).json({ error: 'Failed to retrieve deployment history logs' });
  }
};

export const downloadLogsFile = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const logsList = await getAuditLogs(100);
    // Find the log entry (supports local JSON id or MongoDB _id)
    const log = logsList.find((l: any) => l._id?.toString() === id || l.id === id);

    if (!log || !log.logs) {
      return res.status(404).json({ error: 'Deployment logs not found.' });
    }

    const filename = `deploy-log-${id}-${new Date(log.timestamp).getTime()}.txt`;
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(log.logs);
  } catch (error) {
    logger.error(`Error downloading deployment log: ${id}`, error);
    return res.status(500).json({ error: 'Failed to download deployment log file' });
  }
};
