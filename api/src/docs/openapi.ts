const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const jsonResponse = (description: string, schema: unknown) => ({
  description,
  content: { 'application/json': { schema } },
});
const noContentResponse = (description: string) => ({ description });

const errors = {
  '400': jsonResponse('Requisição inválida: corpo rejeitado pelo Zod ou id malformado.', ref('BadRequest')),
  '401': jsonResponse('Token Bearer ausente, inválido ou expirado.', ref('ApiError')),
  '404': jsonResponse('Registro solicitado não encontrado.', ref('ApiError')),
  '409': jsonResponse('Conflito de unicidade ou relacionamento inválido/vinculado.', ref('ApiError')),
  '500': jsonResponse('Erro interno do servidor.', ref('ApiError')),
};

const idParameter = {
  name: 'id',
  in: 'path',
  required: true,
  description: 'Identificador inteiro positivo do registro.',
  schema: { type: 'integer', format: 'int32', minimum: 1, maximum: 2147483647 },
};

type Resource = {
  path: string;
  tag: string;
  plural: string;
  singular: string;
  input: string;
  response: string;
  conflict: string;
};

const resources: Resource[] = [
  {
    path: '/tutores', tag: 'Tutores', plural: 'Tutores', singular: 'Tutor',
    input: 'TutorInput', response: 'TutorResponse',
    conflict: 'CPF duplicado ou tutor ainda relacionado a animais.',
  },
  {
    path: '/animais', tag: 'Animais', plural: 'Animais', singular: 'Animal',
    input: 'AnimalInput', response: 'AnimalResponse',
    conflict: 'Tutor inexistente ou animal ainda relacionado a agendamentos.',
  },
  {
    path: '/servicos', tag: 'Serviços', plural: 'Serviços', singular: 'Serviço',
    input: 'ServicoInput', response: 'ServicoResponse',
    conflict: 'Nome duplicado ou serviço com agendamentos vinculados.',
  },
  {
    path: '/agendamentos', tag: 'Agendamentos', plural: 'Agendamentos', singular: 'Agendamento',
    input: 'AgendamentoInput', response: 'AgendamentoResponse',
    conflict: 'Animal ou serviço informado não existe.',
  },
];

function makeResourcePaths(resource: Resource): [string, Record<string, unknown>][] {
  const itemRef = ref(resource.response);
  const bodyRef = ref(resource.input);
  const secured = { security: [{ BearerAuth: [] }] };
  const requestBody = {
    required: true,
    content: { 'application/json': { schema: bodyRef } },
  };

  return [
    [resource.path, {
      get: {
        ...secured,
        tags: [resource.tag],
        operationId: `listar${resource.plural}`,
        summary: `Lista ${resource.plural.toLowerCase()}`,
        responses: {
          '200': jsonResponse(`Lista de ${resource.plural.toLowerCase()} em ordem de id.`, {
            type: 'array', items: itemRef,
          }),
          '401': errors['401'],
          '500': errors['500'],
        },
      },
      post: {
        ...secured,
        tags: [resource.tag],
        operationId: `criar${resource.singular}`,
        summary: `Cria ${resource.singular.toLowerCase()}`,
        requestBody,
        responses: {
          '201': jsonResponse(`${resource.singular} criado.`, itemRef),
          '400': errors['400'],
          '401': errors['401'],
          '409': jsonResponse(resource.conflict, ref('ApiError')),
          '500': errors['500'],
        },
      },
    }],
    [`${resource.path}/{id}`, {
      parameters: [idParameter],
      get: {
        ...secured,
        tags: [resource.tag],
        operationId: `buscar${resource.singular}`,
        summary: `Busca ${resource.singular.toLowerCase()} por id`,
        responses: {
          '200': jsonResponse(`${resource.singular} encontrado.`, itemRef),
          '400': errors['400'],
          '401': errors['401'],
          '404': errors['404'],
          '500': errors['500'],
        },
      },
      put: {
        ...secured,
        tags: [resource.tag],
        operationId: `editar${resource.singular}`,
        summary: `Substitui ${resource.singular.toLowerCase()} por id`,
        requestBody,
        responses: {
          '200': jsonResponse(`${resource.singular} atualizado.`, itemRef),
          '400': errors['400'],
          '401': errors['401'],
          '404': errors['404'],
          '409': jsonResponse(resource.conflict, ref('ApiError')),
          '500': errors['500'],
        },
      },
      delete: {
        ...secured,
        tags: [resource.tag],
        operationId: `excluir${resource.singular}`,
        summary: `Exclui ${resource.singular.toLowerCase()} por id`,
        responses: {
          '204': noContentResponse(`${resource.singular} excluído; resposta sem corpo.`),
          '400': errors['400'],
          '401': errors['401'],
          '404': errors['404'],
          '409': jsonResponse(resource.conflict, ref('ApiError')),
          '500': errors['500'],
        },
      },
    }],
  ];
}

const resourcePaths = Object.fromEntries(resources.flatMap(makeResourcePaths));

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Pet Shop API',
    version: '1.0.0',
    description: [
      'API do sistema Pet Shop. Cadastre-se ou faça login para obter um JWT.',
      'Em Authorize, cole somente o token; o Swagger UI envia o esquema Bearer.',
      'Valores monetários são inteiros em centavos. Data e hora devem incluir fuso ISO 8601.',
    ].join(' '),
  },
  servers: [{ url: '/', description: 'Origem atual da API' }],
  tags: [
    { name: 'Autenticação' }, { name: 'Tutores' }, { name: 'Animais' },
    { name: 'Serviços' }, { name: 'Agendamentos' },
  ],
  paths: {
    ...resourcePaths,
    '/auth/cadastro': {
      post: {
        tags: ['Autenticação'],
        operationId: 'cadastrarUsuario',
        summary: 'Cadastra um usuário',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: ref('CadastroInput') } },
        },
        responses: {
          '201': jsonResponse('Usuário criado. Retorna somente id, nome e e-mail.', ref('UsuarioPublico')),
          '400': errors['400'],
          '409': jsonResponse('E-mail já cadastrado.', ref('ApiError')),
          '500': errors['500'],
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Autenticação'],
        operationId: 'login',
        summary: 'Autentica e retorna JWT',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: ref('LoginInput') } },
        },
        responses: {
          '200': jsonResponse('Login concluído; token HS256 válido por uma hora.', ref('LoginResponse')),
          '400': errors['400'],
          '401': jsonResponse('Credenciais inválidas.', ref('ApiError')),
          '500': errors['500'],
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Cole o JWT retornado por POST /auth/login, sem escrever "Bearer ".',
      },
    },
    schemas: {
      ApiError: {
        type: 'object',
        required: ['message'],
        properties: { message: { type: 'string', example: 'Registro não encontrado' } },
      },
      BadRequest: {
        anyOf: [
          ref('ApiError'),
          {
            type: 'object',
            required: ['message', 'errors'],
            properties: {
              message: { type: 'string', example: 'Dados inválidos' },
              errors: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['field', 'message'],
                  properties: { field: { type: 'string' }, message: { type: 'string' } },
                },
              },
            },
          },
        ],
      },
      Id: { type: 'integer', format: 'int32', minimum: 1, maximum: 2147483647 },
      TutorInput: {
        type: 'object', required: ['nome', 'cpf', 'telefone'],
        properties: {
          nome: { type: 'string', minLength: 1, pattern: '\\S', example: 'Ana Souza' },
          cpf: { type: 'string', pattern: '^\\d{11}$', example: '12345678901', description: 'Exatamente 11 dígitos; não valida dígitos verificadores.' },
          telefone: { type: 'string', pattern: '^\\d{10,11}$', example: '11999999999' },
        },
      },
      TutorResponse: {
        type: 'object', required: ['id', 'nome', 'cpf', 'telefone', 'criadoEm'],
        properties: {
          id: ref('Id'), nome: { type: 'string' }, cpf: { type: 'string' }, telefone: { type: 'string' },
          criadoEm: { type: 'string', format: 'date-time' },
        },
      },
      AnimalInput: {
        type: 'object', required: ['nome', 'especie', 'tutorId'],
        properties: {
          nome: { type: 'string', minLength: 1, pattern: '\\S', example: 'Rex' },
          especie: { type: 'string', enum: ['CACHORRO', 'GATO', 'OUTRO'] },
          raca: { type: 'string', nullable: true, minLength: 1, pattern: '\\S', description: 'Opcional; pode ser null. Texto é aparado; vazio é rejeitado. Omissão no PUT limpa o campo.' },
          tutorId: ref('Id'),
        },
      },
      AnimalResponse: {
        type: 'object', required: ['id', 'nome', 'especie', 'raca', 'tutorId', 'tutor'],
        properties: {
          id: ref('Id'), nome: { type: 'string' }, especie: { type: 'string', enum: ['CACHORRO', 'GATO', 'OUTRO'] },
          raca: { type: 'string', nullable: true }, tutorId: ref('Id'),
          tutor: {
            type: 'object', required: ['id', 'nome'],
            properties: { id: ref('Id'), nome: { type: 'string' } },
          },
        },
      },
      ServicoInput: {
        type: 'object', required: ['nome', 'precoCentavos', 'duracaoMinutos'],
        properties: {
          nome: { type: 'string', minLength: 1, pattern: '\\S', example: 'Banho' },
          descricao: { type: 'string', nullable: true, minLength: 1, pattern: '\\S', description: 'Opcional; pode ser null. Texto é aparado; vazio é rejeitado. Omissão no PUT limpa o campo.' },
          precoCentavos: { allOf: [ref('Id')], description: 'Inteiro positivo em centavos; não use ponto flutuante.' },
          duracaoMinutos: { allOf: [ref('Id')], description: 'Inteiro positivo.' },
        },
      },
      ServicoResponse: {
        type: 'object', required: ['id', 'nome', 'descricao', 'precoCentavos', 'duracaoMinutos'],
        properties: {
          id: ref('Id'), nome: { type: 'string' }, descricao: { type: 'string', nullable: true },
          precoCentavos: { type: 'integer', format: 'int32', minimum: 1, maximum: 2147483647 },
          duracaoMinutos: { type: 'integer', format: 'int32', minimum: 1, maximum: 2147483647 },
        },
      },
      AgendamentoInput: {
        type: 'object', required: ['animalId', 'servicoId', 'dataHora'],
        properties: {
          animalId: ref('Id'),
          servicoId: ref('Id'),
          dataHora: {
            type: 'string', format: 'date-time', example: '2026-12-01T10:00:00-03:00',
            description: 'ISO 8601 com fuso obrigatório; a API normaliza para UTC.',
          },
          status: {
            type: 'string', enum: ['AGENDADO', 'CONCLUIDO', 'CANCELADO'],
            default: 'AGENDADO', description: 'Opcional; assume AGENDADO quando omitido.',
          },
          observacoes: { type: 'string', nullable: true, minLength: 1, pattern: '\\S', description: 'Opcional; pode ser null. Texto é aparado; vazio é rejeitado. Omissão no PUT limpa o campo.' },
        },
      },
      AgendamentoResponse: {
        type: 'object',
        required: ['id', 'animalId', 'servicoId', 'dataHora', 'status', 'observacoes', 'animal', 'servico'],
        properties: {
          id: ref('Id'), animalId: ref('Id'), servicoId: ref('Id'),
          dataHora: { type: 'string', format: 'date-time', example: '2026-12-01T13:00:00.000Z' },
          status: { type: 'string', enum: ['AGENDADO', 'CONCLUIDO', 'CANCELADO'] },
          observacoes: { type: 'string', nullable: true },
          animal: {
            type: 'object', required: ['nome', 'tutor'],
            properties: {
              nome: { type: 'string' },
              tutor: { type: 'object', required: ['nome'], properties: { nome: { type: 'string' } } },
            },
          },
          servico: { type: 'object', required: ['nome'], properties: { nome: { type: 'string' } } },
        },
      },
      CadastroInput: {
        type: 'object', required: ['nome', 'email', 'senha'],
        properties: {
          nome: { type: 'string', minLength: 1, pattern: '\\S', example: 'Maria Souza' },
          email: { type: 'string', format: 'email', example: 'maria@example.com', description: 'Normalizado para minúsculas.' },
          senha: { type: 'string', format: 'password', minLength: 8, description: 'Mínimo de 8 caracteres e máximo de 72 bytes para bcrypt.' },
        },
      },
      LoginInput: {
        type: 'object', required: ['email', 'senha'],
        properties: {
          email: { type: 'string', format: 'email', example: 'maria@example.com', description: 'Aparado e normalizado para minúsculas.' },
          senha: { type: 'string', format: 'password', minLength: 8, description: 'Mínimo de 8 caracteres e máximo de 72 bytes para bcrypt; não é aparada.' },
        },
      },
      UsuarioPublico: {
        type: 'object', required: ['id', 'nome', 'email'],
        properties: { id: ref('Id'), nome: { type: 'string' }, email: { type: 'string', format: 'email' } },
      },
      LoginResponse: {
        type: 'object', required: ['token', 'usuario'],
        properties: {
          token: { type: 'string', description: 'JWT HS256 com validade de uma hora.' },
          usuario: ref('UsuarioPublico'),
        },
      },
    },
  },
};
