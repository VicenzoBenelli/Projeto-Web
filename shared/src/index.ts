import { z } from 'zod';

const textoObrigatorio = () => z.string({
  required_error: 'Campo obrigatório', invalid_type_error: 'Informe um texto',
}).trim().min(1, 'Campo obrigatório');

export const idSchema = z.number({
  required_error: 'Campo obrigatório', invalid_type_error: 'Informe um número',
}).int('Informe um número inteiro').positive('Informe um número positivo')
  .max(2147483647, 'Número acima do limite permitido');

export const idParametroSchema = z.string().regex(/^\d+$/, 'Id inválido')
  .transform(Number).pipe(idSchema);

export const especies = ['CACHORRO', 'GATO', 'OUTRO'] as const;
export const statusAgendamentos = ['AGENDADO', 'CONCLUIDO', 'CANCELADO'] as const;
export const especieSchema = z.enum(especies, {
  errorMap: () => ({ message: 'Espécie inválida' }),
});
export const statusAgendamentoSchema = z.enum(statusAgendamentos, {
  errorMap: () => ({ message: 'Status de agendamento inválido' }),
});

// Omissão e null são aceitos nos campos opcionais; texto vazio é inválido.
const textoOpcional = () => textoObrigatorio().nullish();
const senhaSchema = z.string({
  required_error: 'Campo obrigatório', invalid_type_error: 'Informe um texto',
}).min(8, 'A senha deve ter pelo menos 8 caracteres').refine(
  value => new TextEncoder().encode(value).length <= 72,
  'A senha deve ter no máximo 72 bytes para uso com bcrypt',
);
const emailSchema = textoObrigatorio().email('E-mail inválido').toLowerCase();

export const tutorSchema = z.object({
  nome: textoObrigatorio(),
  // Somente formato: não valida os dígitos verificadores de CPF.
  cpf: textoObrigatorio().regex(/^\d{11}$/, 'O CPF deve conter exatamente 11 dígitos'),
  telefone: textoObrigatorio().regex(/^\d{10,11}$/, 'O telefone deve conter 10 ou 11 dígitos'),
});

export const animalSchema = z.object({
  nome: textoObrigatorio(), especie: especieSchema, raca: textoOpcional(), tutorId: idSchema,
});

export const servicoSchema = z.object({
  nome: textoObrigatorio(), descricao: textoOpcional(),
  precoCentavos: idSchema, duracaoMinutos: idSchema,
});

export const agendamentoSchema = z.object({
  animalId: idSchema,
  servicoId: idSchema,
  dataHora: textoObrigatorio().datetime({
    offset: true, message: 'Informe data e hora ISO 8601 com fuso horário',
  }).refine(value => Number.isFinite(Date.parse(value)), {
    message: 'Informe data e hora ISO 8601 com fuso horário',
  }).transform(value => new Date(value).toISOString()),
  status: statusAgendamentoSchema.default('AGENDADO'),
  observacoes: textoOpcional(),
});

export const cadastroSchema = z.object({ nome: textoObrigatorio(), email: emailSchema, senha: senhaSchema });
export const loginSchema = z.object({ email: emailSchema, senha: senhaSchema });

export type TutorInput = z.infer<typeof tutorSchema>;
export type AnimalInput = z.infer<typeof animalSchema>;
export type ServicoInput = z.infer<typeof servicoSchema>;
export type AgendamentoInput = z.infer<typeof agendamentoSchema>;
export type CadastroInput = z.infer<typeof cadastroSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type Especie = z.infer<typeof especieSchema>;
export type StatusAgendamento = z.infer<typeof statusAgendamentoSchema>;
