**Vídeo de apresentação:** [Assista à demonstração do PetCare no YouTube](https://youtu.be/mVNKLpFf9B4)

# PetCare — Sistema de Gestão de Pet Shop

[![CI](https://github.com/VicenzoBenelli/Projeto-Web/actions/workflows/backend-ci.yml/badge.svg?branch=main)](https://github.com/VicenzoBenelli/Projeto-Web/actions/workflows/backend-ci.yml)

Projeto acadêmico de Programação Avançada Web — A2 (2026). O PetCare é uma aplicação web full-stack para gerenciar tutores, animais, serviços e agendamentos de um pet shop, com cadastro e autenticação de usuários, persistência em PostgreSQL, validação compartilhada e interface responsiva.

**Repositório:** [VicenzoBenelli/Projeto-Web](https://github.com/VicenzoBenelli/Projeto-Web)  
**Versão técnica homologada:** [`5f0a25a`](https://github.com/VicenzoBenelli/Projeto-Web/commit/5f0a25a7487e3a1c54762ee57e5dfd6e4fc3877d)

## 1. Integrantes e contribuições

| Integrante | RGM | Contribuições |
| --- | --- | --- |
| Vicenzo Benelli | 42686458 | Backend 1: monorepo, Docker/PostgreSQL, Prisma, migrations, seed, schemas Zod compartilhados, autenticação JWT/bcrypt, CRUDs de Tutor e Animal; integração contínua, correções e homologação global. |
| Bernardo da Silva Moura | 41964535 | Backend 2: CRUDs de Serviço e Agendamento, consultas relacionais, documentação Swagger/OpenAPI e testes de integração da API. |
| Gabriel Anthoni | 43035931 | Frontend 1: estrutura React, Axios, navegação, layout, tela de login, Home e CRUDs de Tutores e Animais. |
| Marcos Vinícius | 43482082 | Frontend 2: CRUDs de Serviços e Agendamentos, modais, conversões monetárias e de data/hora, buscas e integração dos módulos finais. |

As contribuições estão registradas no [histórico de commits](https://github.com/VicenzoBenelli/Projeto-Web/commits/main/). A revisão de integração posterior complementou a autenticação, o cadastro, os formulários e a cobertura automatizada, preservando os commits originais dos quatro integrantes.

## 2. Funcionalidades

- Cadastro de usuários, login, logout, expiração da sessão e rotas protegidas.
- CRUD de tutores: nome, CPF e telefone; pesquisa local por nome ou CPF.
- CRUD de animais: nome, espécie, raça opcional e seleção de tutor cadastrado.
- CRUD de serviços: nome, descrição opcional, preço em reais na interface e duração em minutos.
- CRUD de agendamentos: seleção de animal e serviço, data/hora, status e observações opcionais; listagem com nomes do animal, tutor e serviço.
- Pesquisa local com `.filter` nos quatro módulos, sem novas requisições a cada digitação.
- Validação de formulários por campo, modais de criação/edição, confirmação de exclusão e mensagens de sucesso ou erro.
- Proteção de relacionamentos: registros vinculados não podem ser excluídos indevidamente.
- Documentação interativa da API com Swagger e interface adaptada a notebook e mobile.

## 3. Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 19, TypeScript 5.9, Vite 7, Mantine 8, React Router 7, Axios, Lucide React |
| Backend | Node.js 22, Express 5, TypeScript, Prisma ORM 6.19.3 |
| Banco | PostgreSQL 16, Docker Compose |
| Validação | Zod 3.25, schemas e tipos compartilhados em `@petshop/shared` |
| Autenticação | bcrypt, JSON Web Token (JWT), CORS |
| API | REST, OpenAPI 3.0.3 e Swagger UI |
| Testes e CI | Node.js Test Runner, Playwright/Chromium, GitHub Actions |
| Organização | Git, GitHub e npm workspaces |

As versões exatas instaladas são determinadas pelo `package-lock.json`.

## 4. Arquitetura e estrutura

```text
Projeto-Web/
├── api/
│   ├── prisma/          # Schema, migration, seed e verificador
│   ├── src/             # API, rotas, controllers, services, repositories e middlewares
│   └── test/            # Testes locais e integração com PostgreSQL
├── frontend/
│   ├── src/             # Páginas, componentes, autenticação, serviços e utilitários
│   └── test/            # Testes unitários e jornadas Playwright
├── shared/
│   ├── src/             # Schemas Zod e tipos compartilhados
│   └── test/            # Testes dos contratos
├── docs/                # Evidências, handoffs e homologação
├── .github/workflows/   # Integração contínua
├── docker-compose.yml
├── package.json
└── package-lock.json
```

### Fluxo de uma operação de gravação

```mermaid
flowchart TD
    A[Componente React e formulário] --> B[Zod compartilhado]
    B --> C[Serviço Axios com JWT]
    C --> D[Rota Express]
    D --> E[Autenticação e validação do body]
    E --> F[Controller]
    F --> G[Service]
    G --> H[Repository]
    H --> I[Prisma Client]
    I --> J[(PostgreSQL)]
```

As rotas definem os endpoints; os controllers tratam a comunicação HTTP; os services concentram regras de negócio; os repositories encapsulam a persistência. O Prisma traduz as operações para o PostgreSQL. Os schemas Zod do workspace `shared` são utilizados no frontend e no backend, evitando divergências entre as validações. A API permanece responsável por validar as entradas das operações, independentemente do cliente.

## 5. Banco de dados

O schema Prisma define cinco tabelas: quatro entidades de negócio e uma entidade de autenticação.

| Tabela | Campos principais | Restrições e relações |
| --- | --- | --- |
| `Tutor` | `id`, `nome`, `cpf`, `telefone`, `criadoEm` | CPF único; possui animais |
| `Animal` | `id`, `nome`, `especie`, `raca`, `tutorId` | FK obrigatória para Tutor; possui agendamentos |
| `Servico` | `id`, `nome`, `descricao`, `precoCentavos`, `duracaoMinutos` | Nome único; possui agendamentos |
| `Agendamento` | `id`, `animalId`, `servicoId`, `dataHora`, `status`, `observacoes` | FKs obrigatórias para Animal e Serviço |
| `Usuario` | `id`, `nome`, `email`, `senhaHash`, `criadoEm` | E-mail único; autenticação independente das entidades de negócio |

```mermaid
erDiagram
    TUTOR ||--o{ ANIMAL : possui
    ANIMAL ||--o{ AGENDAMENTO : recebe
    SERVICO ||--o{ AGENDAMENTO : integra
    TUTOR {
        int id PK
        string nome
        string cpf UK
        string telefone
        datetime criadoEm
    }
    ANIMAL {
        int id PK
        string nome
        string especie
        string raca
        int tutorId FK
    }
    SERVICO {
        int id PK
        string nome UK
        string descricao
        int precoCentavos
        int duracaoMinutos
    }
    AGENDAMENTO {
        int id PK
        int animalId FK
        int servicoId FK
        datetime dataHora
        string status
        string observacoes
    }
    USUARIO {
        int id PK
        string nome
        string email UK
        string senhaHash
        datetime criadoEm
    }
```

As três chaves estrangeiras utilizam `onDelete: Restrict`. A API retorna HTTP 409 quando uma exclusão viola um relacionamento. Espécies: `CACHORRO`, `GATO`, `OUTRO`. Status de agendamento: `AGENDADO`, `CONCLUIDO`, `CANCELADO` (padrão: `AGENDADO`). Preços são armazenados em centavos inteiros positivos, evitando ambiguidades de ponto flutuante; datas são armazenadas como instantes (`timestamptz`) com precisão de milissegundos e retornadas em UTC pela API.

Fonte: [`api/prisma/schema.prisma`](api/prisma/schema.prisma).

## 6. Como executar do zero

### Pré-requisitos

- Git.
- Node.js **22.x** e npm compatível (homologação local: Node 22.23.5 e npm 10.9.9).
- Docker Desktop ou Docker Engine com Docker Compose (plugin `docker compose`), em execução, com contêineres Linux.
- Portas locais disponíveis: `55432` (PostgreSQL), `3001` (API), `5173` (frontend).

### 6.1. Clonar e preparar o ambiente

```bash
git clone https://github.com/VicenzoBenelli/Projeto-Web.git
cd Projeto-Web
node --version
npm --version
```

Na raiz, execute uma das alternativas abaixo. Os comandos preservam arquivos de ambiente existentes.

**Windows (PowerShell):**

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
if (!(Test-Path api/.env)) {
  Copy-Item api/.env.example api/.env
  node -e 'const fs=require("node:fs"),crypto=require("node:crypto"); const p="api/.env"; fs.writeFileSync(p,fs.readFileSync(p,"utf8").replace("substitua-por-segredo-longo-aleatorio-no-ambiente-local",crypto.randomBytes(48).toString("hex")));'
}
if (!(Test-Path frontend/.env)) { Copy-Item frontend/.env.example frontend/.env }
```

**Linux/macOS (Bash):** copie os exemplos sem sobrescrever configurações existentes e substitua o placeholder `JWT_SECRET` em `api/.env` por um segredo aleatório de no mínimo 32 caracteres. A configuração é equivalente à descrita no handoff; a homologação local completa registrada foi em Windows.

```bash
test -f .env || cp .env.example .env
if [ ! -f api/.env ]; then
  cp api/.env.example api/.env
  node -e 'const fs=require("node:fs"),crypto=require("node:crypto"); const p="api/.env"; fs.writeFileSync(p,fs.readFileSync(p,"utf8").replace("substitua-por-segredo-longo-aleatorio-no-ambiente-local",crypto.randomBytes(48).toString("hex")));'
fi
test -f frontend/.env || cp frontend/.env.example frontend/.env
```

Caso `api/.env` já exista, verifique localmente se o segredo é válido e não é o placeholder. Não compartilhe esse valor. Os arquivos `.env` reais são ignorados pelo Git.

| Arquivo | Variável | Configuração padrão de desenvolvimento |
| --- | --- | --- |
| `.env` | `POSTGRES_USER` | `petshop` |
| `.env` | `POSTGRES_PASSWORD` | `petshop_dev` |
| `.env` | `POSTGRES_DB` | `petshop` |
| `.env` | `POSTGRES_PORT` | `55432` |
| `api/.env` | `DATABASE_URL` | `postgresql://petshop:petshop_dev@127.0.0.1:55432/petshop?schema=public` |
| `api/.env` | `PORT` | `3001` |
| `api/.env` | `JWT_SECRET` | Segredo aleatório local, não versionado |
| `api/.env` | `CORS_ORIGIN` | `http://localhost:5173` |
| `frontend/.env` | `VITE_API_URL` | `http://localhost:3001` |

As credenciais de banco acima são as do ambiente acadêmico local, não de produção. Se alterar as configurações do PostgreSQL, ajuste também `DATABASE_URL`. O serviço PostgreSQL é publicado somente no loopback.

### 6.2. Dependências, banco e seed

Na raiz do monorepo, instale os workspaces:

```bash
npm ci
```

`npm ci` é a opção recomendada para reproduzir exatamente a instalação homologada. `npm install` também é suportado na raiz (instalação das dependências dos workspaces); para avaliação, preserve o lockfile. O `postinstall` compila o shared e gera o Prisma Client.

Com Docker ativo, execute:

```bash
docker compose up -d --wait postgres
npm run db:migrate:deploy -w api
npm run db:generate -w api
npm run db:status -w api
npm run db:seed -w api
npm run db:verify-seed -w api
```

As migrations versionadas criam as tabelas. O seed prepara dados demonstrativos; o verificador executa o seed novamente e confere sua idempotência. Use o seed no ambiente acadêmico: ele pode redefinir registros de demonstração. Não utilize `docker compose down -v` para encerrar a aplicação, pois isso remove o volume do banco.

### 6.3. Compilar e iniciar

```bash
npm run build
```

O script compila `shared`, `api` e `frontend` nessa ordem.

Abra dois terminais na raiz do projeto, mantendo o PostgreSQL em execução.

**Terminal 1 — Backend:**

```bash
npm run dev:api
```

**Terminal 2 — Frontend:**

```bash
npm run dev:frontend
```

| Serviço | Endereço |
| --- | --- |
| Aplicação | http://localhost:5173 |
| API | http://localhost:3001 |
| Health check | http://localhost:3001/health |
| Swagger UI | http://localhost:3001/docs/ |
| OpenAPI JSON | http://localhost:3001/docs/openapi.json |

Para inspecionar o banco pelo Prisma Studio, execute `npm exec -w api -- prisma studio` em um terceiro terminal e abra http://localhost:5555 (ou a porta indicada no terminal).

Após a compilação, a API também pode ser iniciada com `npm start -w api`. Para encerrar o banco sem apagar dados, use `docker compose stop postgres`.

### 6.4. Conta demonstrativa

| Campo | Valor |
| --- | --- |
| E-mail | `professor@petshop.com` |
| Senha | `PetShop@2026!` |

Credencial pública exclusiva do seed acadêmico. Não reutilizar em produção. Também é possível cadastrar uma nova conta pela interface, em `/cadastro`.

## 7. API REST e Swagger

A API possui 22 operações principais: duas públicas de autenticação e vinte de CRUD autenticado. Além delas, disponibiliza saúde e documentação.

| Método | Endpoint | Operação | Sucesso |
| --- | --- | --- | --- |
| POST | `/auth/cadastro` | Cadastrar usuário | 201 |
| POST | `/auth/login` | Autenticar usuário | 200 |
| GET | `/tutores` | Listar tutores | 200 |
| GET | `/tutores/{id}` | Consultar tutor | 200 |
| POST | `/tutores` | Criar tutor | 201 |
| PUT | `/tutores/{id}` | Editar tutor | 200 |
| DELETE | `/tutores/{id}` | Excluir tutor | 204 |
| GET | `/animais` | Listar animais | 200 |
| GET | `/animais/{id}` | Consultar animal | 200 |
| POST | `/animais` | Criar animal | 201 |
| PUT | `/animais/{id}` | Editar animal | 200 |
| DELETE | `/animais/{id}` | Excluir animal | 204 |
| GET | `/servicos` | Listar serviços | 200 |
| GET | `/servicos/{id}` | Consultar serviço | 200 |
| POST | `/servicos` | Criar serviço | 201 |
| PUT | `/servicos/{id}` | Editar serviço | 200 |
| DELETE | `/servicos/{id}` | Excluir serviço | 204 |
| GET | `/agendamentos` | Listar agendamentos | 200 |
| GET | `/agendamentos/{id}` | Consultar agendamento | 200 |
| POST | `/agendamentos` | Criar agendamento | 201 |
| PUT | `/agendamentos/{id}` | Editar agendamento | 200 |
| DELETE | `/agendamentos/{id}` | Excluir agendamento | 204 |

Para testar no Swagger, execute `POST /auth/login` com a conta de demonstração, copie o token retornado e informe-o no botão **Authorize**. O Swagger adiciona o prefixo `Bearer` automaticamente. As rotas protegidas esperam o header `Authorization: Bearer <token>`.

| Código | Significado |
| --- | --- |
| 400 | Entrada inválida, com indicação dos campos quando aplicável |
| 401 | Credencial inválida ou autenticação ausente/inválida |
| 404 | Registro inexistente |
| 409 | Conflito de unicidade ou relacionamento |
| 500 | Falha inesperada com mensagem genérica |

O retorno 204 não contém corpo. O contrato completo está no Swagger e em [`docs/Handoff-For-Front.md`](docs/Handoff-For-Front.md).

### Validação e autenticação

O mesmo schema Zod usado no React é aplicado pelo middleware de validação da API. O frontend rejeita dados inválidos antes do envio e apresenta mensagens por campo; o backend valida novamente para impedir que requisições diretas contornem essa proteção.

O cadastro armazena `senhaHash` por bcrypt (custo 12); o login utiliza `bcrypt.compare`. As respostas públicas não incluem senha nem hash. O JWT tem validade de uma hora e é verificado pela API. O frontend centraliza a sessão em `AuthContext`/store, adiciona o token via interceptor Axios e trata expiração, logout e HTTP 401. O token permanece em `sessionStorage` durante a sessão; o logout é local e não revoga antecipadamente o JWT no servidor.

## 8. Testes e integração contínua

Com o banco de desenvolvimento disponível e as variáveis configuradas, execute na raiz:

```bash
npm run build
npm test
```

Para os testes de navegador, instale o Chromium do Playwright, caso ainda não esteja disponível, e execute o runner do projeto:

```bash
npm exec -w frontend -- playwright install chromium
npm run test:e2e -w frontend
```

Em Linux, a CI utiliza `playwright install --with-deps chromium` para preparar as dependências do navegador. Os runners criam bancos descartáveis próprios para integração e navegador, aplicam migrations, executam seed e removem esses bancos após os testes. O usuário PostgreSQL necessita permissão para criar bancos, disponível no Compose acadêmico. Não aponte os testes para servidores de produção.

### Resultado da homologação de 26/11/2026

| Verificação | Resultado |
| --- | --- |
| Schemas compartilhados | 25 testes aprovados |
| API — testes locais | 6 testes aprovados |
| Frontend — testes unitários | 24 testes aprovados |
| API — integração PostgreSQL | 35 testes aprovados |
| Total de testes automatizados | **90 aprovados, 0 falhas, 0 ignorados** |
| Playwright G05 e M05 | **4 jornadas aprovadas** (notebook e mobile) |
| Builds dos três workspaces | Aprovados |
| Migrations, seed idempotente e integridade referencial | Aprovados |
| GitHub Actions no SHA homologado | [Success — execução 45815014083](https://github.com/VicenzoBenelli/Projeto-Web/actions/runs/45815014083) |

As jornadas utilizam React, Axios, API Express, Prisma e PostgreSQL reais. A jornada global verifica cadastro/login, criação e edição das quatro entidades, persistência, relacionamentos, bloqueio de exclusões indevidas e remoção dos registros na ordem correta.

**Limitações:** a homologação é acadêmica e não constitui certificação de produção. A auditoria de dependências registrou cinco pacotes com alertas altos (três advisories), sem correção compatível identificada nas versões mantidas. O audit da CI é informativo. A divisão de código por rota reduziu o JS de entrada no build local, mas o aviso de tamanho do Vite ainda apareceu no build remoto; não há benchmark de desempenho em rede real. A análise de risco e as evidências estão no [relatório técnico final](docs/GATE-FINAL-A2.md).

## 9. Roteiro de demonstração

1. Apresentar o tema e os integrantes; abrir o schema Prisma e mostrar as tabelas, relações e seed.
2. Cadastrar uma conta ou entrar com o usuário demonstrativo.
3. Criar um tutor, um animal relacionado, um serviço e um agendamento; mostrar nomes das relações, busca, edição e persistência após recarregar.
4. Demonstrar uma entrada inválida e uma exclusão bloqueada; excluir os registros na ordem Agendamento → Animal → Tutor/Serviço.
5. Mostrar no código o caminho da gravação (componente, Axios, rota, middleware, controller, service, repository e Prisma) e os schemas Zod em ambos os lados; repetir uma entrada inválida no Swagger.
6. Mostrar `bcrypt.hash`, `bcrypt.compare` e a resposta pública sem senha/hash.

O vídeo de apresentação está disponível no link indicado no início deste README. O roteiro acima também pode ser utilizado como guia de avaliação e reprodução dos fluxos do sistema.

## 10. Documentação complementar

- [Handoff e inicialização do backend](docs/Handoff-For-Front.md)
- [Handoff da Onda 03](docs/HANDOFF-G05-MARCOS.md)
- [Evidências da Onda 04](docs/QUARTA-ONDA-EVIDENCIAS.md)
- [Auditoria de segurança e CI](docs/GATE-SEGURANCA-CI.md)
- [Homologação global A2](docs/GATE-FINAL-A2.md)

Projeto desenvolvido para fins acadêmicos.
