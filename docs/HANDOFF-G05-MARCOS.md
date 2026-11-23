# Handoff G05 — Frontend de Gabriel para Marcos

Revisão e correções: Vicenzo Benelli, 23/11/2026.
Base de Gabriel: `02a13e939a71b4c121bbb5c7aa719d647339e294`, autor original
Gabriel Anthoni <gabriel.anthonipb@gmail.com>, preservado sem reescrita.
Pai e backend homologado: `a60b80dca41130ba6d0a97ae2240cf8ec1570820`.
Não havia commits adicionais em origin/front-test na inspeção inicial.
Revisão feita na branch local `revisao/g05-vicenzo`, derivada de origin/front-test.
O PDF acadêmico não foi encontrado na árvore PAVW; não foi revisado.

## Correções de Vicenzo

| Defeito observado | Correção e arquivos principais |
|---|---|
| Proteção baseada apenas na presença de token; 401 não encerrava sessão | auth/AuthContext.tsx, auth/sessionStore.ts e auth/session.ts centralizam sessão; ProtectedRoute e interceptor Axios usam a mesma fonte |
| Cadastro de usuário ausente | pages/Cadastro.tsx e rota pública /cadastro; nome/e-mail/senha, Zod shared, erros, loading, 409 e retorno ao login |
| Pesquisa Ana incluía Bruno porque CPF.includes('') era verdadeiro | utils/search.ts só considera CPF quando há dígitos; regressões em Node e no navegador |
| Reload de Tutores apagava o sucesso | Estado de carga separado de mensagem de operação; feedback preservado depois do GET |
| Erros de salvar/excluir ficavam atrás do modal | Alertas no modal ativo; errors do servidor associados aos campos por errosApi |
| Tutores homônimos no select não eram distinguíveis | Opções de Animal exibem nome e CPF; value permanece id convertido para número |
| Exclusão sem loading e cancelamento durante gravação | Indicador de exclusão e bloqueio do cancelamento durante a operação |
| Falha de rede podia ser apresentada como ausência de registros/tutores | Erro de carga separado; lista indisponível não é tratada como banco vazio |
| Recursos/acessibilidade básica | Favicon SVG publicado (corrige 404 de /favicon.ico), rótulos de busca/menu e cabeçalho compacto em mobile |
| Arquivo frontend/main.tsx vazio e sem uso | Removido; entrypoint real continua frontend/src/main.tsx |

Backend, shared, schema Prisma e migrations não foram alterados. Home e layout
de Gabriel foram preservados; Serviços e Agendamentos continuam placeholders.
Nenhum CRUD de Marcos, README definitivo ou vídeo foi implementado.

## Arquitetura do frontend

`src/main.tsx` monta MantineProvider → BrowserRouter → AuthProvider → App.
AppLayout contém AppShell, cabeçalho, menu responsivo e Outlet.

| Rota React | Acesso / implementação |
|---|---|
| /login | Pública; login via shared + AuthContext |
| /cadastro | Pública; criação de usuário e navegação para login |
| /home | Protegida; visão geral e acesso aos módulos |
| /tutores | Protegida; CRUD em lista e modal único para criar/editar |
| /animais | Protegida; CRUD com tutor selecionado da lista real |
| /servicos | Protegida; placeholder reservado a Marcos |
| /agendamentos | Protegida; placeholder reservado a Marcos |
| / e rotas desconhecidas | Redirecionam à entrada; sem sessão, chegam ao login |

### Autenticação e Axios

- services/api.ts é a instância Axios única. baseURL vem de VITE_API_URL,
  com fallback http://localhost:3001. Não criar outra instância nos novos CRUDs.
- auth/sessionStore.ts é a fonte de sessão, consumida por AuthContext via
  useSyncExternalStore. Login/logout alteram estado e sessionStorage juntos.
- Chaves mantidas de Gabriel: petcare_token e petcare_usuario. O usuário
  persistido contém somente id, nome e email; senhas nunca são persistidas.
- Na recuperação após refresh, JSON corrompido, par incompleto e JWT
  malformado/expirado são descartados. Há timer de expiração e verificação ao
  mudar a visibilidade. O cliente verifica formato/exp, não a assinatura:
  a validação criptográfica continua sendo responsabilidade da API.
- O interceptor adiciona Bearer às operações privadas. HTTP 401 protegido
  limpa a sessão e o ProtectedRoute redireciona para login. Uma resposta de
  sessão antiga não apaga um token novo. Login/cadastro são públicos e não
  entram nesse ciclo; credenciais incorretas aparecem no próprio login.
- Login retorna token/usuario; não é necessário compartilhar JWT individual.
  A assinatura válida não é revogada pelo logout local: JWT segue o contrato
  stateless de uma hora do backend, sem novo endpoint de revogação.

### Modais, campos e mensagens

Use Tutores.tsx e Animais.tsx como referência: registro selecionado decide
POST ou PUT; PUT envia corpo completo. Validar com schema.safeParse do shared
antes do Axios. Erros Zod ficam nos campos; errosApi extrai errors[].field e
message dos 400 da API. mensagemErro trata mensagens públicas e falha de rede.
409 de CPF/FK é exibido no modal ativo. Loading da lista, sucesso/erro de
operação e erro de carga têm estados independentes. Excluir exige confirmação,
mostra loading e respeita o 409 de vínculos. Não limpar o sucesso ao recarregar.

Animal usa tutorService.listar() para o select; não pede ID digitado ao usuário.
Opção: nome — CPF; value: String(id), convertido por Number antes do schema.
Raça vazia é enviada como null. Tutores removem formatação de CPF/telefone
antes da validação. Tabelas usam ScrollContainer: em mobile a rolagem horizontal
é interna à tabela, sem transbordar a página.

## Inicialização local

Node **22.x** e npm compatível; gate executado com **22.23.5 / 10.9.9**.
Docker Desktop com engine Linux. Na raiz, configure os ambientes sem sobrescrever
os existentes, seguindo [Handoff-For-Front.md](Handoff-For-Front.md), inclusive a
geração local do JWT_SECRET aleatório. Há também frontend/.env.example, contendo
somente VITE_API_URL público; copiá-lo para frontend/.env é opcional no padrão.

```powershell
if (!(Test-Path frontend/.env)) { Copy-Item frontend/.env.example frontend/.env }
npm ci
docker compose up -d --wait postgres
npm run db:migrate:deploy -w api
npm run db:verify-seed -w api
npm run build -w shared
npm run build -w api
npm run build -w frontend
npm test
```

Terminais separados na raiz: `npm run dev:api` e `npm run dev:frontend`.
API: http://localhost:3001; Vite: http://localhost:5173; PostgreSQL:
127.0.0.1:55432. A origem usada no navegador precisa corresponder a CORS_ORIGIN
em api/.env. Se Vite usar outra porta/origem, ajustar essa variável localmente.
Swagger público: http://localhost:3001/docs; health: /health.

É possível criar a própria conta em /cadastro. Alternativa acadêmica do seed:
professor@petshop.com / PetShop@2026! (credencial pública de demonstração).
Cada integrante obtém seu token pelo próprio login. Não copiar tokens ou
JWT_SECRET para código, relatórios, mensagens ou arquivos versionados.

## Contratos disponíveis para Marcos

Os endpoints já existem; apenas as telas React correspondentes estão pendentes.
Criar os serviços seguindo services/tutorService.ts e animalService.ts, usando api
e retornando response.data. Os contratos completos estão no Swagger e no shared.

| Recurso | Operações | Entrada shared / observações |
|---|---|---|
| Serviços | GET/POST /servicos; GET/PUT/DELETE /servicos/:id | servicoSchema: nome, precoCentavos, duracaoMinutos; descricao opcional/null. Preço é inteiro positivo em centavos; nome é único |
| Agendamentos | GET/POST /agendamentos; GET/PUT/DELETE /agendamentos/:id | agendamentoSchema: animalId, servicoId, dataHora com fuso ISO 8601; status AGENDADO/CONCLUIDO/CANCELADO e observacoes opcional/null |

Selects devem carregar GET /animais e GET /servicos; IDs são numéricos.
Animais trazem tutor {id,nome}; agendamentos retornam animal.nome,
animal.tutor.nome e servico.nome. Datas são normalizadas para UTC pelo contrato
shared/backend; converter datetime-local para ISO com fuso antes do envio.

Todos os CRUDs exigem Bearer. POST 201, GET/PUT 200, DELETE 204 sem corpo.
400 retorna errors por campo, 401 encerra sessão no cliente, 404 é inexistência,
409 é unicidade/FK. Serviço vinculado a Agendamento não pode ser excluído.
Não adicionar política de agenda, nomes de campo ou regras divergentes do shared.

## Homologação executada

Instalação limpa em cópia temporária sem .env/node_modules/dist de desenvolvimento,
preservando o checkout e a instalação local. Node 22, PostgreSQL 16.15 real via
Docker; npm ci e os três builds com exit 0. Builds e suíte repetidos após os ajustes.

| Verificação | Evidência |
|---|---|
| npm test | **74/74**, zero falhas/skips: shared 25, API local 6, frontend 9, integração PostgreSQL 34 |
| Regressões novas | 8 testes de pesquisa/recuperação de sessão; caso Ana versus Bruno, CPF formatado, token expirado e storage inválido |
| Playwright 1.65.1 + Chrome headless local | **2/2** jornadas, 20 passos cada; notebook 1366×768 e mobile 390×844 |
| API e navegador | 70 requisições e 66 respostas por viewport; quatro falhas de transporte provocadas por viewport para testar recuperação |
| Console e responsividade | Zero exceções/erros inesperados; sem overflow horizontal da página; menu mobile e tabela com scroll interno |
| PostgreSQL | Migration inicial aplicada do zero; seed executado duas vezes, contagens estáveis de 1/modelo; bcrypt, relações e 3 FKs RESTRICT verificados |
| Regressão do backend | 22 operações e Swagger nas suítes HTTP existentes, sem alterações no código/migrations do backend |
| CI | Workflow mantém todos os gates anteriores e acrescenta instalação de Chromium e test:e2e bloqueante |

As jornadas cobrem: acesso protegido; cadastro inválido/válido/duplicado; login
inválido/válido; Home e refresh; criar/editar/pesquisar Tutores e Animais;
select de Tutor real com ID numérico; validação local sem POST inválido; 400
real por campo; 409 de unicidade/FKs; confirmação e DELETE 204 vazio;
persistência após reload; loading/rede/recuperação nas duas listas; 401 global,
expiração automática e logout. API compilada, Vite e banco são reais.

Somente falhas de transporte/loading e a alteração de um POST para exercitar o
400 do servidor são controladas pelo teste. Dados nominais, login, persistência
e conflitos não são mocks. As mensagens de recurso HTTP 400/401/409 esperadas
dos cenários negativos e as falhas de rede injetadas são classificadas; qualquer
outro erro de console reprova a jornada. Nenhum teste foi removido ou ignorado.

Execuções iniciais do executor exigiram correções de instrumentação: DATABASE_URL
ausente na primeira suíte limpa; seletor exato incompatível com asterisco do
Mantine; filtro de rede amplo que também abortava a navegação Vite. Foram
corrigidas e reexecutadas. A execução visual encontrou também 404 real do favicon,
corrigido no produto. Capturas aguardam o fechamento do modal para evitar frames
da animação de saída. Falhas iniciais não foram contadas como aprovação.

Os runners criam nomes únicos petshop_test_* e petshop_e2e_*, comprovam ausência
antes de criar, fecham processos/conexões e removem apenas bancos próprios.
Cleanup confirmado inclusive nas tentativas que falharam. O fingerprint das
cinco tabelas principais e os hashes de AGENTS.md/.env/api/.env foram preservados.

Logs locais: `%TEMP%/petshop-g05-88ba64fa85864112aca36a77ec96e21f`, incluindo
npm-ci.log, c-tests.log, final-build-*.log, final-tests.log, e2e-final.log e
e2e-reviewed.log. Cada log E2E informa sua pasta petshop-ui_* com tutores.png,
animais.png e evidencias.json por viewport, sem headers/tokens; traces desativados.
Artefatos e credenciais locais não integram o Git.

A repetição visual com capturas estabilizadas terminou com **2 passed (2.2m)**,
cleanup do banco `petshop_e2e_acbcec1f04754a2791860203410a0de2` e artefatos em
`%TEMP%/petshop-ui-oM2isA`. Capturas de Tutores/Animais em notebook/mobile
inspecionadas; 20 passos, 70 requisições, 66 respostas e zero erros inesperados
por viewport. A suíte final usou `petshop_test_a235df14cd0e4402aa5dca2337d48a00`,
também removido. As requisições abortadas são os cenários de rede controlados.

### Arquivos da correção e homologação

```text
.github/workflows/backend-ci.yml
docs/HANDOFF-G05-MARCOS.md
frontend/.env.example
frontend/index.html
frontend/main.tsx (removido)
frontend/package.json
frontend/playwright.config.ts
frontend/public/favicon.svg
frontend/src/App.tsx
frontend/src/auth/AuthContext.tsx
frontend/src/auth/session.ts
frontend/src/auth/sessionStore.ts
frontend/src/components/AppLayout.tsx
frontend/src/main.tsx
frontend/src/pages/Animais.tsx
frontend/src/pages/Cadastro.tsx
frontend/src/pages/Login.tsx
frontend/src/pages/Tutores.tsx
frontend/src/routes/ProtectedRoute.tsx
frontend/src/services/api.ts
frontend/src/styles/global.css
frontend/src/utils/apiError.ts
frontend/src/utils/search.ts
frontend/test/e2e/g05.spec.mjs
frontend/test/regression.test.mjs
frontend/test/run-e2e.mjs
package-lock.json
```

### Como repetir os testes de interface

Após instalar dependências e compilar shared/API, com PostgreSQL local disponível:

```text
npm run test:e2e -w frontend
```

Usar esse wrapper: ele cria banco novo, aplica migrations/seed, inicia API/Vite
em portas livres e executa Playwright com ambiente próprio; não reutiliza os
dados principais. No Windows, usa Chrome instalado. Em Linux/CI, instalar antes
`npm exec -w frontend -- playwright install --with-deps chromium`.
Não executar o spec diretamente contra banco compartilhado. Artefatos ficam
fora do repositório e a saída informa o caminho para inspeção.

## Limitações e liberação

- npm audit atual: **5 altos**, exit 1, sem aumento com Playwright. Riscos de
  Prisma/Effect/DeepmergeTS/Zod permanecem conforme GATE-SEGURANCA-CI.md;
  job informativo de audit não equivale a aprovação de segurança.
- Vite avisa chunk JS de aproximadamente 641 KB (198 KB gzip). Build passa;
  limite não foi alterado. Otimização de carregamento fica como melhoria futura.
- PDF original ausente; validação segue contrato fornecido e backend congelado.
- Inspeção cobre Chrome headless e duas larguras, não todos os navegadores ou
  dispositivos físicos. Sem falha funcional conhecida nos fluxos exercitados.

Parecer local: **APROVADO COM RESSALVAS** para Marcos. A integração exige manter
o commit autoral de Gabriel, correções com identidade real de Vicenzo,
fast-forward na main, push normal e CI real do SHA final com sucesso. SHA,
commits e resultado remoto serão apresentados na entrega final da sessão,
após a publicação. A Onda 04 não foi iniciada; a liberação pertence ao operador.
