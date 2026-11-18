import { idParametroSchema } from '../contracts';
import { AppError } from '../errors/AppError';

export function obterId(value: unknown): number {
  const result = idParametroSchema.safeParse(value);
  if (!result.success) throw new AppError(400, 'Id inválido');
  return result.data;
}
