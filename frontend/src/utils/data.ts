function preencher(valor: number) {
  return String(valor).padStart(2, '0');
}

// Converte ISO 8601 da API para o valor aceito por <input type="datetime-local">
// no fuso local do navegador: "2026-11-24T14:30"
export function paraValorDataHora(iso: string): string {
  const data = new Date(iso);

  if (Number.isNaN(data.getTime())) return '';

  return (
    `${String(data.getFullYear()).padStart(4, '0')}-${preencher(data.getMonth() + 1)}-${preencher(data.getDate())}` +
    `T${preencher(data.getHours())}:${preencher(data.getMinutes())}`
  );
}

// Converte o valor de datetime-local (fuso local) para ISO 8601 com timezone.
// Retorna null quando a data é inválida.
export function paraIsoDataHora(valorDataHora: string): string | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(valorDataHora);
  if (!partes) return null;
  const [, ano, mes, dia, hora, minuto, segundo = '00', fracao = ''] = partes;
  const data = new Date(valorDataHora);
  // Rejeita normalizações de calendário e horários locais inexistentes.
  if (data.getFullYear() !== Number(ano) || data.getMonth() + 1 !== Number(mes) ||
      data.getDate() !== Number(dia) || data.getHours() !== Number(hora) ||
      data.getMinutes() !== Number(minuto) || data.getSeconds() !== Number(segundo) ||
      data.getMilliseconds() !== Number(fracao.padEnd(3, '0'))) return null;

  if (Number.isNaN(data.getTime())) return null;

  return data.toISOString();
}

export function dataHoraParaSalvar(valorLocal: string, original?: string): string | null {
  if (original && valorLocal && valorLocal === paraValorDataHora(original)) return original;
  return paraIsoDataHora(valorLocal);
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
