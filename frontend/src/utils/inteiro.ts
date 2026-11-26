import { idParametroSchema } from '@petshop/shared';

export function inteiroPositivo(valor: string): number | null {
  const resultado = idParametroSchema.safeParse(valor);
  return resultado.success ? resultado.data : null;
}
