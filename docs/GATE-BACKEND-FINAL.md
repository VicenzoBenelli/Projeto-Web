# Gate backend-final — Pet Shop A2

Operador: Vicenzo Benelli. Execução em 20/11/2026. Escopo: estabilização do
backend; nenhuma tarefa de frontend, README definitivo ou vídeo.

## Gate A — diagnóstico anterior às correções

- Checkout inicial limpo em `a83621a`; `main` atualizada por
  `git pull --ff-only origin main` (exit 0) para
  `b519e2a53f8f071b9ca1dbf8dbdd3a7bd79cef8e`, igual ao SHA remoto esperado.
- Identidade preexistente: Vicenzo Benelli <vicenzob.silva@gmail.com>.
  `AGENTS.md` lido integralmente, não rastreado e ignorado por `.gitignore:15`.
- Lidos os três relatórios anteriores, código das quatro camadas, shared,
  autenticação, erros, OpenAPI, migrations, seed, testes e configurações.
  Nenhum PDF encontrado na árvore local PAVW. Critérios: contrato fornecido
  pelo operador e AGENTS.md; não se declara aderência a um PDF indisponível.
- Arquitetura preservada: routes → controllers → services → repositories →
  Prisma; Express 5 encaminha rejeições async ao middleware de erros.
  POST/PUT usam validarBody e shared; seleção pública de usuário não expõe hash.
  Cinco modelos, três FKs RESTRICT e unicidade de CPF/e-mail/nome de serviço
  constam do schema e da migration inicial. `Servico.nome` é o campo existente
  correspondente ao nome do serviço; não será renomeado para `nomeServico`.

| Prioridade | Problema e evidência | Arquivos previstos | Risco da correção |
|---|---|---|---|
| Bloqueante para homologação | `agendamentoSchema.safeParse` lança `RangeError: Invalid time value` para `2026-12-01T10:00:00+24:00`, `+99:99` e `+03:99`; transformação lança antes de produzir erro Zod e pode retornar HTTP 500 | shared/src/index.ts; testes shared e HTTP | Baixo: rejeitar somente datas não representáveis, preservando UTC e fusos válidos |
| Importante | BadRequest usa oneOf entre ApiError e objeto com errors; um erro Zod satisfaz ambos, invalidando o contrato OpenAPI | api/src/docs/openapi.ts; api/test/docs.test.mjs | Baixo: descrever corretamente respostas existentes |
| Importante | Handoff omite criação dos dois .env e geração de JWT_SECRET, pré-requisito Node 22 e comandos completos; sugere compartilhar token individual | docs/Handoff-For-Front.md | Baixo: documentação, sem alterar credenciais locais |
| Importante | npm audit inicial: 8 alertas, 5 altos/3 moderados; swagger-jsdoc e seus tipos não são importados pelo código e trazem glob/minimatch vulneráveis | api/package.json; package-lock.json; este relatório | Baixo para remoção de dependência sem uso; não forçar majors de Prisma/Zod |
| Opcional | Algumas descrições OpenAPI omitem trim, rejeição de opcionais em branco e limite de senha no login | api/src/docs/openapi.ts | Baixo: alinhar descrição com shared, sem mudar contrato |

Sem justificativa para refatorações estéticas, mudança de rotas, schema ou
migrations. A evidência histórica de 64 testes não foi tomada como prova atual.

## Gate B — correções

Antes da alteração, um POST HTTP autenticado em `/agendamentos`, usando a API
compilada e `dataHora=2026-12-01T10:00:00+24:00`, retornou **500** com mensagem
genérica. A reprodução não chegou ao banco. O shared agora verifica se a data
é representável antes de chamar `toISOString`; a falha gera erro Zod por campo.
Regressões adicionadas no shared e no HTTP POST/PUT cobrem cinco fusos inválidos,
preservação do agendamento e fusos válidos com normalização UTC.

OpenAPI: `BadRequest.anyOf` substitui o `oneOf` ambíguo. Descrições em referências
de preço/duração usam `allOf`, pois irmãos de `$ref` são ignorados em OpenAPI 3.0.
Opcionais em branco, limpeza no PUT e senha/e-mail do login foram alinhados ao
shared. O teste de documentação foi ajustado para o contrato corrigido.

O handoff agora explica Node 22, os dois .env, geração local do JWT_SECRET,
PostgreSQL saudável, migrations, seed, builds, testes, início da API/Vite,
login próprio, Axios, erros e listas para selects. Nenhum .env local foi editado.

`swagger-jsdoc` e seus tipos foram removidos porque não há uso em src/test: o
documento OpenAPI é construído diretamente em TypeScript e servido por
`swagger-ui-express`, que foi preservado. `npm install --package-lock-only
--ignore-scripts` terminou com exit 0. Revisão estrutural do lock: somente o
workspace api alterado e 40 entradas removidas; zero versões de pacotes
remanescentes alteradas. Não houve audit fix, overrides ou mudança de major.

Arquivos da entrega (allowlist):

- `shared/src/index.ts`
- `shared/test/schemas.test.mjs`
- `api/src/docs/openapi.ts`
- `api/test/docs.test.mjs`
- `api/test/integration/crud.test.mjs`
- `api/package.json`
- `package-lock.json`
- `docs/Handoff-For-Front.md`
- `docs/GATE-BACKEND-FINAL.md`

### Auditoria de dependências

`npm audit --json`: inicial **8** (5 altos/3 moderados), final **5 altos**,
ambos exit **1** por vulnerabilidades. Nenhum crítico. Os três alertas moderados
de swagger-jsdoc/glob/minimatch foram eliminados removendo a árvore sem uso.
O número é de pacotes sinalizados, não de cinco falhas independentes na API.
`npm audit --omit=dev --json`, na cópia limpa, também retorna cinco altos (exit
1): a cadeia Prisma permanece no grafo por sua relação peer com @prisma/client.
Portanto, omitir devDependencies não elimina os alertas; a avaliação de alcance
abaixo se baseia no código executado, não só na classificação npm.

| Pacote instalado | Relação | Risco e exposição avaliados | Correção disponível / decisão |
|---|---|---|---|
| prisma 6.19.0; @prisma/config 6.19.0 | CLI direta de desenvolvimento e transitiva | Alertas propagados de effect/deepmerge-ts; serviços HTTP não importam a CLI/config | Audit propõe Prisma 7.10.1; manter major 6 e client/CLI alinhados |
| deepmerge-ts 7.1.5 | Transitiva de @prisma/config | Exaustão de pilha ao mesclar grafos cíclicos; o advisory informa que JSON simples não produz esse cenário; não há entrada HTTP encaminhada a essa função | Correção 8.0.0; Prisma fixa 7.1.5; não forçar major transitiva |
| effect 3.18.4 | Transitiva de @prisma/config | Contaminação de contexto em fibers/RPC e ReDoS em Schema.TemplateLiteral; backend usa Express/Zod/JWT, sem RPC ou schemas Effect | Correções 3.20.0 e 3.22.1; dependência fixada pelo Prisma. Registry confirma Prisma 6.19.3 com effect 3.21.0: resolve só o primeiro advisory, mantém ReDoS e deepmerge; atualização parcial da CLI sem benefício HTTP não aplicada |
| zod 3.25.76 | Direta shared/API, consumida no frontend | Exaustão de memória com coleções grandes; schemas atuais têm objetos de campos escalares, sem arrays/maps/sets, e JSON HTTP limitado a 100 KB. Isso reduz a exposição observada, sem declarar o pacote corrigido | Advisory corrige em 4.6.6; 3.25.76 é a última versão 3 consultada. Major 4 viola a stack; risco residual registrado |

Fontes consultadas em 20/11/2026: advisories
[Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5),
[DeepmergeTS](https://github.com/advisories/GHSA-ggr8-5vv4-36mx),
[Effect contexto](https://github.com/advisories/GHSA-38f7-945m-qr2g) e
[Effect ReDoS](https://github.com/advisories/GHSA-7589-6fvf-x4pw), além de
`npm view prisma@6.19 version`, `npm view @prisma/config@6.19.3 dependencies`
e `npm view zod@3 version --json`. A avaliação de alcance no projeto é inferência
a partir do código auditado; não é certificação de segurança nem eliminação dos
alertas. Riscos aceitos como ressalva para integração acadêmica local; revisar
dependências antes de exposição pública.

## Gate C — execução

### Ambiente e instalação limpa

- Node **v22.23.5**, npm **10.9.9**, ativados por PATH somente do processo,
  usando `%LOCALAPPDATA%/petshop-toolchain/node22-path.txt` da Onda 01.
  Node global v24.20.0 e PATH global preservados.
- Docker Desktop iniciado (estava parado); Engine 29.8.0, Compose v5.5.1; PostgreSQL
  **16.15**, imagem postgres:16-alpine. `docker compose up -d --wait postgres`:
  exit 0, container `projeto-web-postgres-1` saudável, loopback **55432**.
- Cópia isolada: `%TEMP%/petshop-backend-final-0bf5f153f7554ac88078d807f00ab9a9/source`.
  Copiados 71 arquivos rastreados/previstos, com comparação SHA-256; sem Git,
  AGENTS.md, node_modules, dist, .env ou api/.env de desenvolvimento.
- `npm ci`: **exit 0**, 253 pacotes adicionados, postinstall compilou shared e
  gerou Prisma Client 6.19.0. Lockfile não sofreu alteração pela instalação.
- Credenciais públicas do exemplo e JWT_SECRET efêmero fornecidos somente no
  ambiente dos processos. Nenhum segredo JWT persistido nos relatórios/logs.
  Os exemplos, Compose e scripts existentes foram suficientes; não exigiram
  mudanças de configuração versionada.

### Banco descartável real

Nome `petshop_gate_87f86ed35e384b88800ac97b34ac10b4`, ausência comprovada antes
de CREATE DATABASE, criado exclusivamente pelo gate em 127.0.0.1:55432.

| Comando/verificação | Resultado |
|---|---|
| `npm exec -w api -- prisma validate` | exit 0 |
| `npm run db:migrate:deploy -w api` | exit 0; migration `20261118161526_init` aplicada do zero |
| `npm run db:verify-seed -w api` | exit 0; executou seed duas vezes |
| Contagens após cada seed | usuario=1, tutor=1, animal=1, servico=1, agendamento=1 |
| Hash acadêmico | diferente da senha; bcrypt.compare verdadeiro, sem imprimir hash |
| `npm run db:status -w api` | exit 0; Database schema is up to date |
| `prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code` | exit 0; sem drift |
| Catálogo pg_tables | Tutor, Animal, Servico, Agendamento, Usuario e _prisma_migrations |
| Catálogo pg_constraint | Animal_tutorId_fkey, Agendamento_animalId_fkey e Agendamento_servicoId_fkey; todas RESTRICT |
| Unicidade real | três índices esperados; tentativas duplicadas de CPF, nome de serviço e e-mail rejeitadas com P2002 |

O seed duplo também conferiu relações encadeadas e data UTC de demonstração.
Nenhuma migration foi alterada/criada. Sem db push.

### Builds e testes

Todos executados **nesta sessão**, na cópia limpa, com Node 22:

| Comando | Exit | Resultado |
|---|---:|---|
| `npm run build -w shared` | 0 | TypeScript aprovado |
| `npm run build -w api` | 0 | TypeScript aprovado |
| `npm run build -w frontend` | 0 | TypeScript + Vite 7.3.8; 748 módulos |
| `npm test` | 0 | **66/66**, zero falhas, skips, cancelados ou todo |

Distribuição: shared **25**, API local **6**, frontend **1**, integração HTTP
PostgreSQL **34**. A referência anterior de 64 cresceu em dois testes de regressão
do defeito de fuso. Nenhum teste removido. As integrações iniciam `node
dist/server.js` em processo próprio; não são mocks de banco ou controllers.

### HTTP e Swagger

Smoke independente usando **Axios** contra `dist/server.js`, porta efêmera
**60703**, no banco descartável com seed: **61 requisições aprovadas**, mais
preflight OPTIONS aprovado. Cobriu as **22 operações principais**:

- Cadastro 201, e-mail normalizado duplicado 409, login errado 401 e login
  acadêmico 200. Token emitido pelo próprio login e usado nos CRUDs.
- Em cada recurso: POST 201, GET lista/id 200, PUT completo 200, inválido 400,
  ID malformado 400, inexistente 404 e DELETE 204 com corpo vazio.
- CPF/nome de serviço duplicados 409; Tutor/Animal/Serviço inexistentes nas
  relações 409; DELETE de registros vinculados 409 e preservação dos dados.
- Datas com offset válido normalizadas para UTC; data sem fuso e fuso inválido
  rejeitados com `errors[].field=dataHora`. Suíte também testa POST e PUT.
- Animal inclui tutor id/nome; agendamento inclui animal.nome,
  animal.tutor.nome e servico.nome. Listas reais e respostas completas.
- `/health`, `/docs/`, quatro assets Swagger e `/docs/openapi.json`: 200.
  CORS para `http://localhost:5173` e preflight com authorization/content-type:
  aprovados. GETs privados sem JWT: 401; suíte cobre as 20 rotas sem JWT e
  tokens inválidos, expirados e algoritmo indevido.
- Respostas de cadastro/login sem senha/hash; respostas CRUD/erros sem hash ou
  stack; logs verificados sem JWT_SECRET, senha ou token emitido. A suíte
  também verifica 500 genérico em harness isolado, sem rota artificial na API.

OpenAPI 3.0.3 aprovado por `@apidevtools/swagger-parser` 12.1.0, ferramenta
preexistente fora da instalação limpa (não foi reintroduzida como dependência).
Contagem exata de 22 operações, segurança Bearer, respostas e relações
conferidas. Propriedades/obrigatórios das seis entradas e enums comparados
programaticamente com os schemas Zod reais: PASS.

Swagger renderizado e inspecionado visualmente em Chrome headless com perfil
temporário isolado: título Pet Shop API, Authorize, auth pública e cadeados CRUD,
sem erro visível. Captura local `swagger.png` junto aos logs. O navegador
integrado apresentou timeout e o helper desktop ficou indisponível; o fallback
headless concluiu a inspeção. Não se declara interação manual com Try it out;
requisições equivalentes foram executadas por HTTP real.

### Isolamento, cleanup e evidências locais

- Suíte criou `petshop_test_bce441266ee143ab95e512a1f48e91b0`, aplicou migration
  do zero e confirmou cleanup/ausência após terminar.
- Smoke/seed: `petshop_gate_87f86ed35e384b88800ac97b34ac10b4` removido somente
  após encerrar API/Prisma e comprovar zero sessões; ausência final confirmada.
- Hash dos dados ordenados das cinco tabelas do banco principal comparado antes
  e depois: **MAIN_DATABASE_UNCHANGED**. Nenhum volume removido.
- Instrumentação de banco/HTTP terminou com **BACKEND_FINAL_C_PASS**, exit 0.
  Uma tentativa inicial desse harness foi iniciada antes do fim do npm ci e
  falhou ao importar o cliente ainda não gerado; não criou banco nem executou
  testes. Foi reexecutada após instalação concluída. O npm ci em si passou.
- Logs completos preservados fora do Git na pasta pai de `source`: npm-ci.log,
  gate-c.log, prisma-validate.log, migrations-deploy.log, seed-double.log,
  migrations-status.log, schema-drift.log, build-shared.log, build-api.log,
  build-frontend.log, npm-test.log, database-evidence.json, http-evidence.json,
  command-results.json, audit-production.json e swagger.png.
- Executável/configuração/testes/handoff da entrega comparados novamente por
  SHA-256 com a cópia homologada: **70 arquivos idênticos**; o próprio relatório
  é completado após os gates. SHA-256 do lockfile após npm ci e na entrega:
  `CD840AECC055E850E41C9CD582EB229BE6FB21E85EA7CFA2E1E6E39DFD0E626F`.

### Parecer técnico

**APROVADO COM RESSALVAS** para Gabriel iniciar integração acadêmica local após
liberação do operador: instalação, três builds, migrations, seed, testes,
autenticação, 22 operações e documentação aprovados. Sem bloqueio funcional
conhecido no escopo exercitado. Permanecem cinco alertas npm altos, PDF original
indisponível e aviso futuro de package.json#prisma (Prisma 7), todos explicitados.
Não é homologação de produção nem garantia de ausência de defeitos não testados.
Nenhuma tela, deploy ou início automático da Onda 03 foi realizado.

## Gate D — publicação

Publicação autorizada pelo pedido do operador, condicionada à revisão final.
O commit que contém este relatório terá como pai
`b519e2a53f8f071b9ca1dbf8dbdd3a7bd79cef8e` e autoria real de Vicenzo. Os commits
de Bernardo permanecem intactos. Somente os nove caminhos da allowlist serão
incluídos; AGENTS.md, .env, node_modules, dist e artefatos temporários excluídos.

O SHA do próprio commit, resultado do push normal, confirmação de origin/main e
estado final do worktree serão informados na entrega da sessão após a operação;
não são antecipados como resultados neste documento.
