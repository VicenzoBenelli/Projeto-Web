import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config';
import { idSchema } from '../contracts';

declare global {
  namespace Express {
    interface Request { auth?: { usuarioId: number }; }
  }
}

export const autenticar: RequestHandler = (req, res, next) => {
  const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization ?? '');
  if (!match) { res.status(401).json({ message: 'Token ausente ou inválido' }); return; }
  const secret = getJwtSecret();
  try {
    const payload = jwt.verify(match[1], secret, { algorithms: ['HS256'], issuer: 'petshop-api' });
    if (typeof payload === 'string' || !payload.sub || !/^[1-9]\d*$/.test(payload.sub)) {
      res.status(401).json({ message: 'Token inválido ou expirado' }); return;
    }
    const id = idSchema.safeParse(Number(payload.sub));
    if (!id.success) { res.status(401).json({ message: 'Token inválido ou expirado' }); return; }
    req.auth = { usuarioId: id.data };
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido ou expirado' });
  }
};
