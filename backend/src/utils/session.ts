import jwt from 'jsonwebtoken';
import { Response } from 'express';

export const getJwtSecret = () =>
  process.env.JWT_SECRET || 'super_secret_session_token_for_validation_rule_manager';

export const getSessionCookieOptions = (): Record<string, unknown> => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd
  };
};

export const signSession = (payload: object) =>
  jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });

export const setSessionCookie = (res: Response, payload: object) => {
  res.cookie('session', signSession(payload), getSessionCookieOptions());
};

export const clearSessionCookie = (res: Response) => {
  res.clearCookie('session', getSessionCookieOptions());
};
