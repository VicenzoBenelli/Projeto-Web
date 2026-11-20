# Gate Backend-Hardening — Segurança e CI

Execução: 20/11/2026. Operador: Vicenzo Benelli.
SHA inicial: `313b23111bca1801599d7de2f31cd5ea2e55e966`.
Escopo: dependências e GitHub Actions; contratos, backend, shared, frontend,
schemas, migrations e testes existentes preservados.

## A — Inspeção

`main` inicialmente limpa e igual a origin/main. Identidade preexistente:
Vicenzo Benelli <vicenzob.silva@gmail.com>. `git pull --ff-only origin main`:
exit 0, Already up to date. Lidos integralmente AGENTS.md, Gate Backend-Final,
handoff, B04 e configurações npm/Prisma/Docker/execução dos testes.

AGENTS.md continua local, ignorado por `.gitignore:15` e não rastreado.
Seu SHA-256 e os de `.env`/`api/.env` foram comparados antes/depois: idênticos.
Nenhum PDF original encontrado na árvore local PAVW; não foi revisado.

## B — Dependências

Com Node 22, foram executados antes e depois:

| Comando | Antes | Depois |
|---|---|---|
| `npm audit --json` | exit 1, 5 altos | exit 1, 5 altos |
| `npm audit --omit=dev --json` | exit 1, 5 altos | exit 1, 5 altos |
| `npm ls prisma @prisma/client zod` | exit 0; Prisma/client 6.19.0; Zod 3.25.76 | exit 0; Prisma/client 6.19.3; Zod 3.25.76 |

Não há alertas críticos, moderados ou baixos nesse snapshot. Cinco é a contagem
de pacotes sinalizados, incluindo propagação; os advisories distintos caíram
de **4 para 3**. Comparação por URL confirmou **um corrigido e zero novos**.
Não se declara audit limpo nem aprovação integral de segurança.

### Atualização aplicada e justificativa

Prisma CLI e @prisma/client foram atualizados juntos e fixados em **6.19.3**.
É um patch de segurança oficial da série 6, cuja atualização de Effect corrige
GHSA-38f7-945m-qr2g, relacionado a contexto AsyncLocalStorage em fibers/RPC.
[Release oficial](https://github.com/prisma/prisma/releases/tag/6.19.3) e
[correção upstream](https://github.com/prisma/prisma/pull/29416).

Effect passou de **3.18.4 para 3.21.0** exclusivamente pela dependência oficial
de @prisma/config. A decisão deste hardening amplia a revisão anterior, que
havia mantido 6.19.0: há benefício de segurança verificável mesmo sem reduzir
o número total de pacotes sinalizados. A regressão foi executada antes de
avançar para a implementação de CI.

Lockfile atualizado por `npm install --package-lock-only --ignore-scripts`
(exit 0). Revisão estrutural: somente api e nove entradas da cadeia oficial
Prisma/Effect mudaram; nenhum pacote alheio foi alterado/adicionado/removido.
Os pacotes Prisma associados passaram a 6.19.3. A exceção de numeração é o
metadado @prisma/engines-version, agora
`7.1.1-3.c2990dca591cba766e3b7ef5d9e8a84796e47ab7`, selecionado pelo próprio
@prisma/engines 6.19.3; CLI e client continuam na major 6.
Sem overrides, atualização manual de transitivas ou audit fix --force.

### Análise individual dos cinco alertas residuais

| Pacote final | Relação | Alerta / exposição no projeto | Correção investigada e decisão |
|---|---|---|---|
| prisma 6.19.3 | Direta, CLI | Propagação de @prisma/config; CLI não é importada pelos serviços HTTP | Última 6.x consultada: 6.19.3. Audit propõe 7.10.1, fora da stack; manter patch testado |
| @prisma/config 6.19.3 | Transitiva | Propaga Effect/DeepmergeTS; configuração local da CLI, sem endpoint de configuração remoto | Continua fixando Effect 3.21.0 e DeepmergeTS 7.1.5; aguardar correção upstream compatível |
| effect 3.21.0 | Transitiva da configuração Prisma | ReDoS em Schema.TemplateLiteral; API usa Express/Zod/JWT, sem schemas Effect nem RPC | Corrigido em 3.22.1. Prisma fixa 3.21.0; não sobrepor o pin sem comprovação de compatibilidade upstream. O advisory de contexto, corrigido desde 3.20.0, saiu do audit |
| deepmerge-ts 7.1.5 | Transitiva da configuração Prisma | Exaustão de pilha ao mesclar grafos cíclicos; não há entrada HTTP entregue a essa função | Correção em 8.0.0, major diferente da versão fixada pelo Prisma; sem override. JSON simples não cria o ciclo descrito |
| zod 3.25.76 | Direta em shared/API, consumida no frontend | Exaustão de memória por validação de arrays grandes; schemas atuais são objetos de campos escalares, sem arrays/maps/sets | Última 3.x consultada: 3.25.76. Correção indicada em 4.6.6; manter Zod 3 conforme contrato |

Fontes dos riscos:
[Effect contexto corrigido](https://github.com/advisories/GHSA-38f7-945m-qr2g),
[Effect ReDoS residual](https://github.com/advisories/GHSA-7589-6fvf-x4pw),
[DeepmergeTS](https://github.com/advisories/GHSA-ggr8-5vv4-36mx) e
[Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
Também consultados `npm view prisma@6 version --json`,
`npm view @prisma/config@6.19.3 dependencies --json` e
`npm view zod@3 version --json`. O audit sem dev ainda inclui a cadeia Prisma
pela relação peer/optional com o client; omitir dev não resolve os alertas.

Mitigações verificadas: JSON limitado a **100 KB antes da validação**, schemas
sem coleções e sem exposição HTTP das funções Effect/DeepmergeTS vulneráveis.
O smoke rejeitou corpo acima do limite e array no lugar de objeto com 400 e
confirmou health 200 em seguida. São evidências específicas e uma análise de
alcance do código, não prova de imunidade ou correção dos pacotes residuais.
Reavaliar antes de uso público/produção; integração acadêmica local mantém
ressalvas explícitas e auditoria automatizada informativa.

## C — GitHub Actions

Workflow: `.github/workflows/backend-ci.yml`, para pushes em main e PRs com
destino main, em runner Linux `ubuntu-24.04`.

Job bloqueante: Node 22, serviço PostgreSQL 16-alpine com healthcheck TCP,
loopback 55432, npm ci, builds shared/API/frontend, prisma validate,
migrate deploy, seed duplo e npm test com integrações PostgreSQL reais.
Falhas em instalação/build/migration/seed/testes falham o job; nenhum desses
passos usa continue-on-error. O usuário PostgreSQL criado pelo container tem
permissão para os bancos descartáveis da suíte.

O PostgreSQL da CI não tem senha, usa trust **somente no serviço descartável do
runner**, restrito a 127.0.0.1 e sem volume persistente. Não contém dados ou
credenciais locais, não requer GitHub Secrets e não muda a autenticação do
Compose/banco de desenvolvimento. Essa configuração não se aplica a ambientes
persistentes ou públicos. DATABASE_URL do job não contém senha.

JWT_SECRET aleatório de 48 bytes é gerado no job, mascarado por add-mask e
fornecido via GITHUB_ENV; seu valor não é publicado em artefatos ou no Git.
O runner de integração ainda gera seu próprio segredo por execução.
Permissions limita GITHUB_TOKEN a contents:read; checkout não persiste
credenciais. Actions oficiais fixadas por SHA, conferidas nos tags v6:

- checkout: `d23441a48e516b6c34aea4fa41551a30e30af803`
- setup-node: `249970729cb0ef3589644e2896645e5dc5ba9c38`

Job separado de auditoria instala pelo lock sem scripts e executa os dois
audits com JSON integral. Apenas esses comandos têm continue-on-error. O summary
expõe seus outcomes e emite aviso quando não forem success; o job informativo
verde não significa audit aprovado. Nenhuma verificação preexistente foi removida.

Validação local do YAML: **actionlint 1.7.12, exit 0**; binário oficial temporário
com SHA-256 conferido pelo arquivo de checksums da release. Referência de serviço:
[documentação GitHub](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers).

**Execução remota confirmada: PASS.** Workflow Backend CI, evento push,
commit de implementação `2a76c4a586932ebf1960d0955464e3a0740bb549`,
[run 44832884223](https://github.com/VicenzoBenelli/Projeto-Web/actions/runs/44832884223),
concluído com success. Consultados metadados, passos e logs reais pela CLI.
Instalação, três builds, schema, migration, seed duplo e suíte completa passaram:
**66/66**, zero falhas/skips. Cleanup confirmado do banco
`petshop_test_ffae72bf87234d70a393e316166a8f41`.

O job informativo concluiu, mas os dois comandos npm audit retornaram **exit 1**,
ambos com cinco altos. O summary registrou outcome failure e aviso de ressalvas.
Portanto, CI funcional aprovada não significa aprovação de segurança.
Metadados e logs preservados junto às evidências locais em
`github-run-44832884223.json` e `github-run-44832884223.log`.
Este registro posterior ao push altera somente documentação; a execução do
SHA documental final será confirmada na entrega da sessão.
[Página do workflow](https://github.com/VicenzoBenelli/Projeto-Web/actions/workflows/backend-ci.yml).

## D — Regressão executada nesta sessão

Node **v22.23.5**, npm **10.9.9**, PATH alterado somente nos processos. Docker
PostgreSQL **16.15** saudável em 127.0.0.1:55432; configuração principal preservada.

| Verificação | Gate B, checkout principal | Gate D, cópia limpa |
|---|---|---|
| npm ci | exit 0; Prisma Client 6.19.3 gerado | exit 0; 253 pacotes instalados |
| npm run build -w shared | exit 0 | exit 0 |
| npm run build -w api | exit 0 | exit 0 |
| npm run build -w frontend | exit 0, Vite 7.3.8 | exit 0 |
| npm test | exit 0, **66/66** | exit 0, **66/66** |

Em cada suíte: shared 25, API local 6, frontend 1, integração real 34; zero falhas,
skips, cancelados ou todo. Nenhum teste alterado/removido. Cobertura inclui as
22 operações, Bearer/JWT inválido/expirado/algoritmo indevido, Zod por campo,
erros 400/401/404/409/500 genérico, unicidade, FKs, relações e DELETE sem corpo.

Cópia isolada em
`%TEMP%/petshop-hardening-23334c514c9643d28c9293488908cda0/source`, inicialmente
sem node_modules, dist, .env ou AGENTS.md. Comparação SHA-256 confirmou **72
arquivos idênticos** com a entrega, antes de acrescentar este relatório.
Lockfile após npm ci e na entrega:
`0DB709C6D8E47FE176E0BCDF739CC9FC01E362393CE26DE38F22CE499DD73998`.

No banco `petshop_hardening_78e8d764c2e5461b93b46cc7c559ce74`, comprovadamente
ausente antes de criar: prisma validate, migrate deploy da migration inicial,
db:status e migrate diff sem drift — todos exit 0. Seed executado duas vezes:
contagens estáveis de uma linha por modelo, bcrypt.compare verdadeiro, data UTC
e relações corretas. Catálogo confirmou cinco tabelas, três FKs RESTRICT e três
índices únicos; duplicações reais rejeitadas com P2002.

Smoke independente com Axios na API compilada: **64 requisições aprovadas**,
mais preflight OPTIONS. Exercitou as 22 operações, health/docs/OpenAPI/assets,
cadastro/login acadêmico, JWT, CORS Vite, validação, conflitos, inexistentes,
datas/fusos, relações aninhadas e DELETE 204 vazio. Incluiu rejeição de 110 KB e
array inválido. Respostas/logs conferidos sem senha/hash, stack ou segredos JWT,
ressalvado o token intencional do contrato de login, mantido apenas em memória.
OpenAPI 3.0.3 também validado por swagger-parser 12.1.0 instalado como ferramenta
temporária externa à árvore de dependências do projeto.

Cleanup confirmado e ausência final dos bancos:

- B: `petshop_test_b3e8235f58c74918872d3d5bdeb48131`
- D, suíte: `petshop_test_9bb775972b764c388bd2c694b3639301`
- D, seed/smoke: `petshop_hardening_78e8d764c2e5461b93b46cc7c559ce74`

Fingerprint dos dados das cinco tabelas principais antes/depois do Gate D:
MAIN_DATABASE_UNCHANGED. API de smoke encerrada e conexões próprias fechadas
antes de remover banco próprio; nenhum volume removido.
Instrumentação: BACKEND_HARDENING_D_PASS, exit 0.

Logs completos na pasta pai de source: audits antes/depois (completo/sem dev),
npm-ls-before/after.log, b-npm-ci.log, b-build-*.log, b-npm-test.log,
d-npm-ci.log, d-gate.log, prisma-validate.log, migrations-deploy.log,
seed-double.log, migrations-status.log, schema-drift.log, build-*.log,
npm-test.log, database-evidence.json, http-evidence.json e command-results.json.
Artefatos de instrumentação não integram o commit.

## E/F — Entrega e parecer

Allowlist de quatro arquivos: api/package.json, package-lock.json,
.github/workflows/backend-ci.yml e este relatório. Commit de implementação
`2a76c4a586932ebf1960d0955464e3a0740bb549`, pai igual ao SHA inicial, publicado
por push normal com autoria real de Vicenzo e SHA remoto confirmado. Diff
integral e git diff --check aprovados; worktree limpo e sincronizado após push.
O resultado remoto foi acrescentado neste fechamento documental, também sujeito
à revisão e publicação normal, sem reescrever o commit já publicado.
AGENTS.md, ambientes, tokens, node_modules, dist e temporários ficam fora do Git.
Histórico anterior preservado; SHA final e paridade remota na entrega da sessão.

**APROVADO COM RESSALVAS para integração acadêmica de Gabriel**, com regressão
local aprovada e um advisory corrigido por patch oficial. Persistem três
advisories distintos em cinco pacotes sinalizados, PDF indisponível e aviso
futuro package.json#prisma relativo ao Prisma 7. CI remota da implementação
confirmada com success, separadamente das ressalvas da auditoria.
Não é certificação de produção ou garantia de ausência de defeitos não testados.
Nenhum README definitivo, tela, deploy ou início automático da Onda 03.
A liberação de Gabriel continua pertencendo ao operador.
