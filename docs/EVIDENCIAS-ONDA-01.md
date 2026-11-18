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
