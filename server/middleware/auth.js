import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nuve-secret-key-change-in-prod';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

export function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso restrito' });
    }
    next();
  });
}

export function planLimits(plan) {
  const limits = { free: 1, simples: 2, pro: 5, unlimited: 999 };
  return limits[plan] ?? 1;
}
