// Attend AI — Backend Admin Authorization Middleware (Phase 2)
import { getUserByUid } from '../../src/db/repository.ts';

export async function adminAuth(req, res, next) {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: 'Unauthorized: Missing session' });
    }
    const profile = await getUserByUid(req.user.uid);
    if (!profile || profile.role !== 'admin') {
      return res
        .status(403)
        .json({ error: 'Forbidden: Administrator role required' });
    }
    return next();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to verify admin privileges' });
  }
}
