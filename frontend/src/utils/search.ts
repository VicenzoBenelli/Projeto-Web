export function matchesTutor(tutor: { nome: string; cpf: string }, search: string): boolean {
  const term = search.trim().toLocaleLowerCase('pt-BR');
  const digits = term.replace(/\D/g, '');
  return !term || tutor.nome.toLocaleLowerCase('pt-BR').includes(term) ||
    (digits.length > 0 && tutor.cpf.includes(digits));
}
