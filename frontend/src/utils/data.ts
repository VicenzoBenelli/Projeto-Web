function preencher(valor: number) {
  return String(valor).padStart(2, '0');
}

// Converte ISO 8601 da API para o valor aceito por <input type="datetime-local">
// no fuso local do navegador: "2026-11-24T14:30"
export function paraValorDataHora(iso: string): string {
  const data = new Date(iso);

  if (Number.isNaN(data.getTime())) return '';

  return (
    `${data.getFullYear()}-${preencher(data.getMonth() + 1)}-${preencher(data.getDate())}` +
    `T${preencher(data.getHours())}:${preencher(data.getMinutes())}`
  );
}

// Converte o valor de datetime-local (fuso local) para ISO 8601 com timezone.
// Retorna null quando a data é inválida.
export function paraIsoDataHora(valorDataHora: string): string | null {
  const data = new Date(valorDataHora);

  if (Number.isNaN(data.getTime())) return null;

  return data.toISOString();
}

// Exibe ISO 8601 no formato local brasileiro: "24/11/2026 14:30"
export function formatarDataHora(iso: string): string {
  const data = new Date(iso);

  if (Number.isNaN(data.getTime())) return '—';

  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
