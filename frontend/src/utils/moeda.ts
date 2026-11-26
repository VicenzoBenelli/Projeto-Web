import { idSchema } from '@petshop/shared';

const formatoBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatarBRL(centavos: number): string {
  return formatoBRL.format(centavos / 100);
}

// Formata centavos para exibição no campo de edição.
export function formatarEntradaMoeda(centavos: string): string {
  if (!/^\d+$/.test(centavos)) return '';
  const digitos = centavos.padStart(3, '0');
  return digitos.slice(0, -2) + ',' + digitos.slice(-2);
}

export function paraCentavos(valor: string): number | null {
  const limpo = valor.trim().replace(/^R\$[ \u00a0]*/, '');
  // Com ponto de milhar, exija a vírgula para evitar ambiguidade.
  if (!/^(?:\d+(?:,\d{1,2})?|[1-9]\d{0,2}(?:\.\d{3})+,\d{1,2})$/.test(limpo)) return null;
  const [reais, fracao = ''] = limpo.replaceAll('.', '').split(',');
  const resultado = idSchema.safeParse(Number(reais + fracao.padEnd(2, '0')));
  return resultado.success ? resultado.data : null;
}
