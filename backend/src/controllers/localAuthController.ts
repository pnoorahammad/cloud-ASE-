import { Request, Response } from 'express';
import { createUser, findUserByEmail, findUserById, comparePassword, updateUser, hashPassword } from '../models/User';
import { setSessionCookie } from '../utils/session';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/types';

export const signUp = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      fullName,
      firstName,
      lastName,
      emailAddress,
      jobRole,
      company,
      country,
      postalCode
    } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email (Username), password, and full name are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address (e.g. Gmail) for Username.' });
    }

    const user = await createUser({
      email,
      password,
      fullName,
      firstName,
      lastName,
      emailAddress,
      jobRole,
      company,
      country,
      postalCode
    });

    setSessionCookie(res, {
      authType: 'local',
      userId: user._id,
      email: user.email,
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddress: user.emailAddress,
      jobRole: user.jobRole,
      company: user.company,
      country: user.country,
      postalCode: user.postalCode,
      salesforceConnected: false
    });

    logger.info(`New user registered: ${user.email}`);
    return res.status(201).json({
      authType: 'local',
      userId: user._id,
      email: user.email,
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddress: user.emailAddress,
      jobRole: user.jobRole,
      company: user.company,
      country: user.country,
      postalCode: user.postalCode,
      salesforceConnected: false
    });
  } catch (err: any) {
    logger.error('Sign up failed', err);
    return res.status(400).json({ error: err.message || 'Sign up failed' });
  }
};

export const signIn = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await findUserByEmail(email);
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    setSessionCookie(res, {
      authType: 'local',
      userId: user._id,
      email: user.email,
      fullName: user.fullName,
      salesforceConnected: false
    });

    return res.json({
      authType: 'local',
      userId: user._id,
      email: user.email,
      fullName: user.fullName,
      salesforceConnected: false
    });
  } catch (err: any) {
    logger.error('Sign in failed', err);
    return res.status(500).json({ error: 'Sign in failed' });
  }
};

const getLocalAccountId = (user: AuthenticatedRequest['user']) =>
  user?.localUserId || (user?.authType === 'local' ? user?.userId : undefined);

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  const localId = getLocalAccountId(req.user);
  if (!req.user || !localId) {
    return res.status(403).json({ error: 'Profile update is only available for email sign-in accounts.' });
  }

  try {
    const {
      email,
      fullName,
      firstName,
      lastName,
      emailAddress,
      jobRole,
      company,
      country,
      postalCode
    } = req.body;

    const updates: Record<string, string> = {};
    if (email) updates.email = email;
    if (fullName) updates.fullName = fullName;
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (emailAddress !== undefined) updates.emailAddress = emailAddress;
    if (jobRole !== undefined) updates.jobRole = jobRole;
    if (company !== undefined) updates.company = company;
    if (country !== undefined) updates.country = country;
    if (postalCode !== undefined) updates.postalCode = postalCode;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nothing to update.' });
    }

    const user = await updateUser(localId, updates);
    setSessionCookie(res, {
      authType: req.user.authType || 'local',
      userId: req.user.userId,
      localUserId: localId,
      email: user.email,
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddress: user.emailAddress,
      jobRole: user.jobRole,
      company: user.company,
      country: user.country,
      postalCode: user.postalCode,
      salesforceConnected: !!req.user.accessToken,
      ...(req.user.accessToken ? {
        accessToken: req.user.accessToken,
        refreshToken: req.user.refreshToken,
        instanceUrl: req.user.instanceUrl,
        organizationId: req.user.organizationId,
        username: req.user.username,
        sfUserId: req.user.sfUserId
      } : {})
    });

    return res.json({
      authType: req.user.authType || 'local',
      userId: req.user.userId,
      email: user.email,
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddress: user.emailAddress,
      jobRole: user.jobRole,
      company: user.company,
      country: user.country,
      postalCode: user.postalCode,
      salesforceConnected: !!req.user.accessToken
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update profile' });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  const localId = getLocalAccountId(req.user);
  if (!req.user || !localId) {
    return res.status(403).json({ error: 'Password change is only available for email sign-in accounts.' });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = await findUserById(localId);
    if (!user || !(await comparePassword(currentPassword, user.passwordHash))) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    await updateUser(localId, { passwordHash: await hashPassword(newPassword) });
    logger.info(`Password updated for user: ${user.email}`);
    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to change password' });
  }
};
