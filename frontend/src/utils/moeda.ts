const formatoBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

// Exibe centavos inteiros como moeda: 5000 => "R$ 50,00"
export function formatarBRL(centavos: number): string {
  return formatoBRL.format(centavos / 100);
}

// Máscara progressiva para o campo de preço: "5000" => "50,00"
export function formatarEntradaMoeda(valor: string): string {
  const digitos = valor.replace(/\D/g, '');

  if (!digitos) return '';

  return `${(Number(digitos) / 100).toFixed(2).replace('.', ',')}`;
}

// Converte a entrada em reais para centavos inteiros: "50,00" => 5000.
// Retorna null quando o texto não representa um valor válido.
export function paraCentavos(valor: string): number | null {
  const limpo = valor.trim();

  if (!limpo) return null;

  const normalizado = limpo.replace(/\./g, '').replace(',', '.');

  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) return null;

  const centavos = Math.round(Number(normalizado) * 100);

  // O banco guarda precoCentavos como inteiro positivo (mesmo limite do idSchema).
  if (!Number.isSafeInteger(centavos) || centavos <= 0) return null;
  if (centavos > 2147483647) return null;

  return centavos;
}
