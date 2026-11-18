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

## V06 — PASS (gate técnico)

Regressão repetida no clone e em **cópia limpa**, sem node_modules, dist ou .env.
Cópia em `C:/Users/vicen/AppData/Local/Temp/petshop-v06-09260d8fdcd542b6acf2eac499113184`.
O código/configuração da cópia foi comparado por SHA-256 com a entrega: **50
arquivos idênticos**. DATABASE_URL de desenvolvimento foi fornecida no ambiente
do processo; o executor de integração gera um segredo JWT efêmero em memória.

Comandos executados em ambas as árvores com exit **0**:

```text
npm install
npm run db:generate -w api
npm run db:migrate:deploy -w api
npm run db:verify-seed -w api
npm run db:status -w api
npm run build
npm test
```

`npm run build` executa os três `npm run build -w shared/api/frontend` em
sequência. `npm test` executa shared (24), API local (3), resolução no frontend
(1) e integração PostgreSQL (21): **49/49 em cada árvore**, zero falhas/skips.
A API compilada (`node dist/server.js`, o mesmo entrypoint de npm start) foi
iniciada em processo separado para as suítes HTTP, com /health 200, cadastro/login
e as dez operações CRUD autenticadas. Processos de API encerrados após os testes;
logs verificados sem segredo JWT nem senha de teste.

Instalação limpa: 293 pacotes, log final `CLEAN_INSTALL_GATE_PASS`.
SHA-256 do package-lock permaneceu:
`0F9DA05D3EBB4764277884AC7A4BA181509517D173FD1116E667E6A21EFEA0A6`.
Seed duplo novamente estável: 1 linha por modelo; bcrypt/FKs/data conferidos.
Migrate status: `Database schema is up to date!`. Migração inicial também
reaplicada do zero em cada banco descartável de integração.

Cleanup confirmado dos bancos V06:
`petshop_test_d135523c146d4b098362ac590104e785` (clone) e
`petshop_test_54ff0961b492463ea9a1886561d16a94` (instalação limpa).

`docker compose up -d --wait` e `git diff --check`: exit 0. Docker permanece
saudável. Lockfile e ambos os arquivos de migrations rastreados; .env,
node_modules e dist não rastreados e ignorados. Branch main e autoria real de
Vicenzo conferidas. A confirmação remota e o SHA do próprio commit V06 são
apresentados na entrega da sessão, após commit e push normais.

Arquivos V06: package.json da raiz (postinstall agora gera Prisma Client e teste
agregado), helper que inicia o servidor compilado, suítes HTTP usando esse
processo, cleanup do executor em finally e este registro de transferência.

## Commits e transferência

| Task | Status técnico | Commit |
|---|---|---|
| V01 | PASS | [c16c9bc](https://github.com/VicenzoBenelli/Projeto-Web/commit/c16c9bcacef8af3d244f8ec153f99221560fb569) |
| V02 | PASS | [953a408](https://github.com/VicenzoBenelli/Projeto-Web/commit/953a4085561d5ef18153f185966568c4e037eca0) |
| V03 | PASS | [f31ee6b](https://github.com/VicenzoBenelli/Projeto-Web/commit/f31ee6b55524206353fe685239498fc68ba093b7) |
| V04 | PASS | [8370a3d](https://github.com/VicenzoBenelli/Projeto-Web/commit/8370a3d0a594df9a5d36bd28f22973f1f0513c6f) |
| V05 | PASS | [8cc1ef6](https://github.com/VicenzoBenelli/Projeto-Web/commit/8cc1ef69c9edb138d92880ce55a5bfe53be5f8df) |
| V06 | PASS | Commit que contém esta seção; SHA na entrega e em `git log -1` |

Bernardo deve assumir somente após a confirmação de publicação de V06, mantendo
um único escritor e repetindo `git status` / `git pull --ff-only origin main`.
Esta execução não iniciou B01 nem tarefas de Gabriel/Marcos.

Para reproduzir: ativar Node 22, criar .env a partir dos dois exemplos e gerar
um JWT_SECRET aleatório (mínimo 32 caracteres; não registrar seu valor).
Executar `npm install`, `docker compose up -d --wait`, `npm run db:migrate:deploy
-w api`, `npm run db:verify-seed -w api`, `npm run build`, `npm test` e iniciar
`npm run dev:api` (ou `npm start -w api` após build). A suíte de integração exige
DATABASE_URL em 127.0.0.1 e permissão local de criar/remover bancos, fornecida
pelo usuário de desenvolvimento do Compose. Ela não grava no banco apontado:
cria banco petshop_test com UUID e remove apenas o que criou.

No Windows desta execução, Node 22 está fora do PATH global; ativação na sessão:

```powershell
$nodeDir = (Get-Content "$env:LOCALAPPDATA/petshop-toolchain/node22-path.txt").Trim()
$env:PATH = "$nodeDir;$env:PATH"
```

Preservar as quatro camadas, validarBody e os schemas existentes ao implementar
as tarefas de Bernardo previstas no plano. O banco usa porta 55432 no host,
credenciais públicas locais dos exemplos e volume persistente; API usa 3001.
O login de demonstração é professor@petshop.com / PetShop@2026!, com hash bcrypt.

Riscos pendentes: PDF ausente e enums escolhidos conforme registrado em V02;
**12 alertas npm audit** (3 moderados/9 altos) permanecem, sem correção forçada
que altere as majors exigidas. Isto exige revisão de dependências antes de uso
fora da demonstração local. Aviso de depreciação de package.json#prisma refere-se
ao Prisma 7; a stack permanece 6.19.0. README definitivo e vídeo seguem para a
integração das quatro ondas. Nenhum deploy foi realizado.
