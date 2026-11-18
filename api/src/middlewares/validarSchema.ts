import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

export function validarBody(schema: ZodType<unknown>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        message: 'Dados inválidos',
        errors: result.error.issues.map(issue => ({
          field: issue.path.join('.'), message: issue.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
