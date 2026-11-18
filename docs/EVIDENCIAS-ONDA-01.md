# Evidências da primeira onda — Vicenzo

Execução em 18/11/2026, Windows/PowerShell, branch `main`. Um único escritor.
Identidade Git preexistente: Vicenzo Benelli <vicenzob.silva@gmail.com>.
O PDF não foi encontrado no diretório PAVW, incluindo `operacao`; o contrato
fornecido no pedido e o AGENTS.md integral foram usados como fonte.

## Preparação

- Bootstrap sem commits, revisado antes das alterações. `git ls-remote origin`
  retornou vazio (exit 0). `git pull --ff-only origin main` retornou
  `fatal: couldn't find remote ref main` (exit 1): remoto ainda vazio.
- Sistema: Node 24.20.0 / npm 12.0.2. Execução dos gates: Node **22.23.5** /
  npm **10.9.9**, pacote oficial Windows x64 com SHA-256 conferido.
  Instalado fora do repositório em `%LOCALAPPDATA%/petshop-toolchain`.
- Git 2.55.0.windows.5; Docker 29.8.0; Compose v5.5.1; Codex CLI 0.169.0.
- Porta 5432 já ocupada: Compose e exemplos usam `127.0.0.1:55432`.
  Container `projeto-web-postgres-1` e volume `projeto-web_petshop_postgres_data`
  criados para este projeto; outros serviços não foram alterados.
- `.env` e `api/.env` locais ignorados; segredo JWT gerado aleatoriamente.

## V01 — PASS

Todos os comandos abaixo retornaram exit 0:

| Comando | Evidência mínima |
|---|---|
| `npm install` | 293 pacotes adicionados; postinstall compilou shared |
| `npm run build -w shared` | TypeScript sem erros |
| `npm run build -w api` | TypeScript sem erros |
| `npm run build -w frontend` | Vite 7.3.8; 748 módulos; build concluído |
| `npm test -w api` | 1/1 teste HTTP; `/health` 200 e CORS conferido |
| `docker compose up -d --wait` | container Healthy |
| `docker compose exec -T postgres psql -U petshop -d petshop -c 'SELECT version();'` | PostgreSQL 16.15 |
| `npm ls prisma @prisma/client zod --depth=1` | Prisma CLI/client 6.19.0; Zod 3.25.76 |
| `git check-ignore .env api/.env` | ambos ignorados |

Arquivos: configurações da raiz, Compose, package-lock, esqueleto shared/API/
frontend, teste HTTP de health, notas de bootstrap e este registro.
Prisma CLI e cliente fixados em 6.19.0. `.nvmrc` e engine-strict exigem Node 22.
Frontend permanece apenas o shell de V01.

Verificação adicional: `npm audit --json` retornou exit **1**, com **12** alertas
(3 moderados, 9 altos). Inclui dependências transitivas de Prisma/Vite/Swagger e
Zod 3. Não foi executado `audit fix --force`: as correções sugeridas para Prisma
e Zod mudam as majors exigidas. Este audit não é um gate aprovado de segurança;
o risco precisa ser revisto antes de uso fora da demonstração local.

## V02 — PASS

Comandos com exit 0: `npm exec -w api -- prisma format`, `prisma validate`,
`npm run db:migrate:dev -w api -- --name init`, `npm run db:generate -w api`,
`npm run db:verify-seed -w api`, `npm run db:status -w api`, `npm run build` e
`docker compose up -d --wait`.

Migration real criada/aplicada: `api/prisma/migrations/20261118161526_init/migration.sql`;
`migration_lock.toml` também versionado. Log: `Your database is now in sync with
your schema` / `Database schema is up to date!`.

Seed executado **duas vezes** pelo verificador: contagens estáveis
`{"usuario":1,"tutor":1,"animal":1,"servico":1,"agendamento":1}`.
Verificadas senha bcrypt por compare, relações encadeadas, data UTC e as três
FKs RESTRICT no catálogo PostgreSQL. Nenhum `db push` foi usado.

Arquivos: `api/prisma/{schema.prisma,seed.ts,verify-seed.mjs,migrations/}`,
scripts em `api/package.json` e este registro. Esquema contém exatamente cinco
modelos e dois enums; cpf/email/Servico.nome únicos; preço inteiro em centavos;
datas TIMESTAMPTZ(3).

Escolha explicitada pela ausência do PDF e de valores no pedido: `Especie` =
`CACHORRO/GATO/OUTRO`; `StatusAgendamento` = `AGENDADO/CONCLUIDO/CANCELADO`.
Conferir esses valores com o grupo antes de alterá-los; mudanças exigirão
migration e atualização do shared. O seed redefine apenas os dados públicos de
demonstração e não deve ser usado como rotina em produção.

## V03 — PASS

Exit 0: `npm run build` (os três workspaces), `npm test -w shared` (**24/24**),
`npm test -w api` (**2/2**, incluindo resolução do shared),
`npm test -w frontend` (**1/1**, resolução em runtime Node),
`docker compose up -d --wait` e `git diff --check`.

Arquivos: `shared/src/index.ts`, `shared/test/schemas.test.mjs`, scripts de teste,
fachadas `api/src/contracts.ts` e `frontend/src/contracts.ts`, testes de resolução
dos dois consumidores e este registro. Os tipos são inferidos com `z.infer`.
O frontend continua somente o shell; não houve validação visual de CRUD.

CPF valida exclusivamente formato de 11 dígitos; telefone 10–11. Campos
opcionais (raca/descricao/observacoes) aceitam omissão ou null e rejeitam texto
vazio. PUT inteiro manterá obrigatórios nome/especie/tutorId; a omissão de raca
limpa o valor no banco. Datas exigem timezone e são normalizadas em UTC.
Inteiros respeitam o limite do PostgreSQL Int. Senhas têm mínimo de 8 caracteres
e máximo de 72 bytes para impedir truncamento bcrypt; não são aparadas.
E-mails são aparados e convertidos para minúsculas. Não há regra duplicada na API.

## V04 — PASS

Exit 0: `npm run build` (shared/API/frontend), `npm test -w api` (**3/3**),
`npm run test:integration -w api` (**7/7**), `docker compose up -d --wait`,
`git diff --check`. Sem skips.

Suíte real por HTTP: cadastro 201, login 200, hash bcrypt no PostgreSQL,
respostas públicas sem senhaHash, e-mail duplicado 409 (P2002), credenciais
incorretas 401, Zod 400 por campo, JSON malformado 400 e rota desconhecida 404.
Middleware verificado com token válido, ausente, inválido, expirado e HS384
indevido; resposta 500 genérica verificada em harness isolado do middleware.
Esse harness não adiciona rotas de teste ao backend entregue.

Banco descartável `petshop_test_3a8ae835057d47f99da99db3e0e8f4c4`: ausência
conferida antes da criação, migration versionada aplicada com migrate deploy,
conexões encerradas e ausência confirmada após DROP DATABASE. O banco de
demonstração não foi usado para os testes HTTP de escrita.

Arquivos: auth em `api/src/{routes,controllers,services,repositories}`,
middlewares autenticar/validarSchema/tratarErro, config, AppError, cliente Prisma,
app/server, testes locais/de integração e executor descartável.
JWT usa HS256, issuer petshop-api e expiração em 1 hora. O servidor recusa
JWT_SECRET ausente, curto ou igual ao exemplo. Nenhum segredo padrão foi criado.

## V05 — PASS

Exit 0: `npm run build` (três workspaces), `npm test -w shared` (**24/24**),
`npm test -w api` (**3/3**), `npm run test:integration -w api` (**21/21**,
7 de auth/erros + 14 de CRUD), `docker compose up -d --wait` e `git diff --check`.
Nenhum teste ignorado.

As 10 rotas CRUD foram exercitadas por HTTP com JWT válido e sem JWT (401).
POST 201, GET/PUT 200, DELETE 204 sem corpo e consultas após remoção 404.
CPF duplicado em POST/PUT 409; tutor inexistente em Animal 409; exclusão de
Tutor com Animal e de Animal com Agendamento 409 por FKs reais. Serviço vinculado
também protegido no PostgreSQL por P2003, usando fixture direta, sem criar rotas
da onda de Bernardo. GETs de Animal conferem tutor com exatamente id/nome.
PUT inteiro, limpeza de raca omitida/null, inválidos 400 por campo e ids
inexistentes 404 em GET/PUT/DELETE também conferidos.

Banco descartável `petshop_test_98ef73883c8740d8ab922df221899d4c`: migration
versionada aplicada; cleanup e ausência final confirmados.

Arquivos: Tutor/Animal nas quatro camadas de `api/src`, auxiliar obterId,
montagem no app, schemas de parâmetro numérico no shared (sem regra duplicada),
fachada de contratos e `api/test/integration/crud.test.mjs`.
Não foram implementados CRUD de Servico/Agendamento, Swagger /docs ou telas.
