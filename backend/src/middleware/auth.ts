import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from './types';

export interface AuthenticatedUser {
  authType?: 'local' | 'salesforce';
  accessToken?: string;
  refreshToken?: string;
  instanceUrl?: string;
  userId: string;
  organizationId?: string;
  username?: string;
  email?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  emailAddress?: string;
  jobRole?: string;
  company?: string;
  country?: string;
  postalCode?: string;
  salesforceConnected?: boolean;
  localUserId?: string;
  sfUserId?: string;
}

export const requireSalesforce = (req: any, res: Response, next: NextFunction) => {
  if (!req.user?.accessToken) {
    return res.status(403).json({
      error: 'Connect Salesforce first to use this feature.',
      code: 'SALESFORCE_NOT_CONNECTED'
    });
  }
  next();
};

export const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  // Prefer httpOnly cookie 'session' but support Authorization header
  const cookieToken = req.cookies?.session;
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.split(' ')[1];
  const token = cookieToken || headerToken;

  if (!token) {
    logger.warn('Access attempt blocked: Missing auth token');
    return res.status(401).json({ error: 'Access token is missing. Please log in.' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'super_secret_session_token_for_validation_rule_manager';

  jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
    if (err) {
      logger.error('Access attempt blocked: Invalid or expired token', err);
      return res.status(403).json({ error: 'Session expired or invalid. Please log in again.' });
    }

    req.user = decoded as AuthenticatedUser;
    next();
  });
};
