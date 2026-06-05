import { Request, Response } from 'express';
import { getAuthUrl, exchangeCodeForTokens, getUserInfo, getOrgInfo } from '../services/salesforceService';
import { findUserById } from '../models/User';
import jwt from 'jsonwebtoken';
import { setSessionCookie, clearSessionCookie, getJwtSecret } from '../utils/session';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/types';

export const login = (req: Request, res: Response) => {
  try {
    if (process.env.SF_SIMULATION_MODE !== 'true') {
      const clientId = process.env.SF_CLIENT_ID;
      const clientSecret = process.env.SF_CLIENT_SECRET;
      if (!clientId || !clientSecret || clientId.includes('your_salesforce')) {
        logger.error('Salesforce OAuth is not configured (SF_CLIENT_ID / SF_CLIENT_SECRET)');
        return res.status(500).json({
          error: 'Salesforce OAuth is not configured. Copy backend/.env.example to backend/.env and set SF_CLIENT_ID and SF_CLIENT_SECRET, or enable SF_SIMULATION_MODE=true.'
        });
      }
    }

    const state = req.query.state as string || 'default';
    const authUrl = getAuthUrl(state);
    logger.info(`Generated Salesforce Auth URL redirecting with state: ${state}`);
    
    // Support either direct redirect or returning JSON URL
    if (req.query.redirect === 'true') {
      return res.redirect(authUrl);
    }
    return res.json({ authUrl });
  } catch (error: any) {
    logger.error('Failed to initiate login flow', error);
    return res.status(500).json({ error: 'Failed to initiate Salesforce login' });
  }
};

const getFrontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:3000';

export const callback = async (req: Request, res: Response) => {
  const frontendUrl = getFrontendUrl();

  if (req.query.error) {
    const sfError = req.query.error_description || req.query.error;
    logger.warn('Salesforce OAuth error in callback', { error: sfError });
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(String(sfError))}`);
  }

  const code = req.query.code as string;

  if (!code) {
    logger.warn('Callback execution failed: Authorization code missing in request query');
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Authorization code is missing')}`);
  }

  try {
    logger.info('Exchanging authorization code for Salesforce tokens');
    const tokens = await exchangeCodeForTokens(code);

    let localEmail: string | undefined;
    let localFullName: string | undefined;
    let localUserId: string | undefined;
    const existingToken = req.cookies?.session;
    if (existingToken) {
      try {
        const decoded = jwt.verify(existingToken, getJwtSecret()) as Record<string, unknown>;
        if (decoded.authType === 'local') {
          localUserId = decoded.userId as string;
          localEmail = decoded.email as string;
          localFullName = decoded.fullName as string;
        }
      } catch { /* ignore invalid prior session */ }
    }

    const sessionPayload: Record<string, unknown> = {
      authType: 'salesforce',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      instanceUrl: tokens.instanceUrl,
      userId: localUserId || tokens.userId,
      localUserId: localUserId,
      sfUserId: tokens.userId,
      organizationId: tokens.organizationId,
      username: tokens.username,
      salesforceConnected: true,
      email: localEmail,
      fullName: localFullName
    };

    setSessionCookie(res, sessionPayload);

    logger.info(`User authenticated successfully: ${tokens.username}`);
    return res.redirect(`${frontendUrl}/dashboard`);
  } catch (error: any) {
    logger.error('Authentication callback error', error);
    const message = error.message || 'Salesforce authentication failed';
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(message)}`);
  }
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const localId = req.user.localUserId || (req.user.authType === 'local' ? req.user.userId : undefined);
  if (localId) {
    try {
      const dbUser = await findUserById(localId);
      return res.json({
        authType: req.user.authType || 'local',
        userId: req.user.userId,
        email: dbUser?.email || req.user.email,
        fullName: dbUser?.fullName || req.user.fullName,
        firstName: dbUser?.firstName || req.user.firstName,
        lastName: dbUser?.lastName || req.user.lastName,
        emailAddress: dbUser?.emailAddress || req.user.emailAddress,
        jobRole: dbUser?.jobRole || req.user.jobRole,
        company: dbUser?.company || req.user.company,
        country: dbUser?.country || req.user.country,
        postalCode: dbUser?.postalCode || req.user.postalCode,
        salesforceConnected: !!req.user.accessToken,
        username: req.user.username,
        hasLocalAccount: true
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to load profile' });
    }
  }

  if (!req.user.accessToken || !req.user.instanceUrl) {
    return res.json({
      authType: 'local',
      userId: req.user.userId,
      email: req.user.email,
      fullName: req.user.fullName,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      emailAddress: req.user.emailAddress,
      jobRole: req.user.jobRole,
      company: req.user.company,
      country: req.user.country,
      postalCode: req.user.postalCode,
      salesforceConnected: false
    });
  }

  try {
    const profile = await getUserInfo(req.user.accessToken, req.user.instanceUrl);
    return res.json({ ...profile, authType: 'salesforce', salesforceConnected: true, hasLocalAccount: !!localId });
  } catch (error: any) {
    logger.error('Failed to retrieve user profile', error);
    return res.status(500).json({ error: 'Failed to fetch user profile details from Salesforce' });
  }
};

export const getCurrentOrg = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!req.user.accessToken || !req.user.instanceUrl) {
    return res.status(403).json({ error: 'Connect Salesforce to view organization details.', code: 'SALESFORCE_NOT_CONNECTED' });
  }

  try {
    const org = await getOrgInfo(req.user.accessToken, req.user.instanceUrl);
    return res.json(org);
  } catch (error: any) {
    logger.error('Failed to retrieve organization details', error);
    return res.status(500).json({ error: 'Failed to fetch organization details from Salesforce' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    clearSessionCookie(res)
    return res.json({ success: true })
  } catch (err: any) {
    logger.error('Logout failed', err)
    return res.status(500).json({ error: 'Logout failed' })
  }
}
