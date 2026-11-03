import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { adminAuth } from '../lib/firebase-admin.ts';

const TOKEN_SECRET = process.env.SESSION_SECRET || 'attend-ai-secure-hmac-secret-2026';

export interface AuthUserPayload {
  uid: string;
  email: string;
  role?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUserPayload;
}

export function signSessionToken(payload: AuthUserPayload): string {
  const data = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(data)
    .digest('base64url');
  return `att_${data}.${signature}`;
}

export function verifySessionToken(token: string): AuthUserPayload | null {
  try {
    if (!token.startsWith('att_')) return null;
    const raw = token.slice(4);
    const [data, signature] = raw.split('.');
    if (!data || !signature) return null;
    const expectedSig = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(data)
      .digest('base64url');
    if (signature !== expectedSig) return null;
    const decoded = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (decoded.exp && Date.now() > decoded.exp) return null;
    return { uid: decoded.uid, email: decoded.email, role: decoded.role };
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  const salt = 'attend_ai_salt_v1';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const token = authHeader.split('Bearer ')[1];

  const sessionUser = verifySessionToken(token);
  if (sessionUser) {
    req.user = sessionUser;
    return next();
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split('Bearer ')[1];
  const sessionUser = verifySessionToken(token);
  if (sessionUser) {
    req.user = sessionUser;
    return next();
  }
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
    };
  } catch {
    req.user = undefined;
  }
  return next();
};
