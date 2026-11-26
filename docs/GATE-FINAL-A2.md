# Gate Final A2 — PetCare

Homologação técnica de 26/11/2026, sob responsabilidade de Vicenzo Benelli.
A sessão iniciou com a `main` local limpa em `1f37511`. Após fetch e inspeção
dos cinco commits da Onda 04, a atualização por fast-forward chegou à base
`9b57c1ccacf5dfca2846e6cbd1bd0593d3b4c66e`, igual à `origin/main`. A
[CI dessa base](https://github.com/VicenzoBenelli/Projeto-Web/actions/runs/45461679314)
concluiu com sucesso. Os 80 testes e as duas jornadas G05 dessa execução são
evidência histórica. Os commits da quarta onda conservam a identidade
`vinicius` que consta no Git.

Fontes consultadas: AGENTS.md local, NOTAS-INICIAIS.md, evidências das ondas,
relatório B04, handoffs, gates de backend e CI e os três workspaces.
O planejamento original e o enunciado do professor não foram localizados na
árvore local PAVW. A matriz se limita aos requisitos conhecidos. A validação
acadêmica integral depende do confronto posterior com os documentos originais.

## A · Diagnóstico

| Onda | Revisão |
|---|---|
| Vicenzo | Fundação npm, Docker/PostgreSQL, Prisma, autenticação e Tutor/Animal estão coerentes com o contrato. As quatro camadas isolam HTTP, regras e persistência. |
| Bernardo | Serviço e Agendamento usam validação compartilhada, respostas REST, consultas com relacionamentos e FKs RESTRICT. Swagger descreve as 22 operações principais. |
| Gabriel | Sessão centralizada, Axios e rotas protegidas tratam refresh, 401, expiração e logout. G05 já cobre os fluxos de Tutor e Animal nas duas larguras. |
| Marcos | Rotas dos dois módulos substituíram os placeholders. Formulários e buscas reais estavam presentes, com as falhas de conversão e a lacuna de CI listadas abaixo. |

| Prioridade | Achado inicial |
|---|---|
| Bloqueante | Duração removia caracteres e alterava `-30`, `1.5`, `abc30` e `1e3`. O preço aplicava a mesma limpeza e podia aceitar um valor diferente do digitado. |
| Bloqueante | A conversão de datas aceitava normalizações do JavaScript e o PUT podia perder segundos/milissegundos de um horário que o operador não editou. |
| Alta | A CI cobria G05 no navegador. Faltavam M05 e uma jornada com os quatro recursos, incluindo persistência e exclusão em sequência. |
| Alta | Cinco pacotes sinalizados por três advisories altos. Versões compatíveis investigadas na seção de segurança. |
| Média | Cadastro de agendamento podia abrir durante falha ou ausência de dados dos selects. Alguns handlers dependiam somente do estado visual do botão para evitar reenvio. |
| Baixa | Placeholder órfão e evidência da quarta onda com frase anterior à publicação e total histórico sem contexto. |
| Melhoria opcional | Carregamento inicial concentrava todas as rotas em um chunk de 660,34 kB. |

## B · Correções

- Duração usa a validação de inteiro positivo do shared. Letras, sinais,
  decimais, expoentes, zero e valores superiores ao intervalo do PostgreSQL
  são rejeitados no campo antes do Axios.
- O preço mantém texto durante a digitação e é formatado ao sair do campo
  quando válido. O parser aceita reais com vírgula decimal e prefixo
  opcional R$. Agrupamento com ponto exige vírgula decimal explícita.
  A conversão concatena dígitos de reais e centavos antes de validar o
  inteiro, respeitando o máximo de 2.147.483.647 centavos.
- A data local é comparada com os componentes do instante convertido.
  Datas inexistentes e horários que cairiam numa lacuna de fuso são
  rejeitados. Se o campo mantém o horário exibido, o PUT reutiliza o
  timestamp recebido, incluindo a precisão original. Horário editado
  converte para UTC no fuso do navegador.
- Os formulários ignoram nova submissão enquanto salvam. Novo Animal e
  Novo Agendamento aguardam as listas necessárias. Falha de carga e
  lista vazia têm mensagens distintas. Os selects mantêm IDs numéricos,
  e os conflitos de vínculo são exibidos no modal.
- As páginas administrativas e o cadastro passam a carregar sob demanda.
  O componente órfão foi removido. A documentação M01–M05 conserva o
  registro original e distingue a validação posterior.

As correções preservam os contratos Zod, endpoints REST, schema Prisma,
migrations, tema, estrutura de navegação e comportamento da sessão.

## C · Segurança e dependências

`npm audit --json` e `npm audit --omit=dev --json` retornaram exit 1, cinco
pacotes altos em cada execução e zero alertas novos em relação à quarta onda.
`npm ls prisma @prisma/client zod` confirmou 6.19.3 / 6.19.3 / 3.25.76.
A consulta ao registro npm confirmou essas versões como finais das séries
autorizadas. O lockfile permanece idêntico. Nenhuma versão foi atualizada.

| Pacote | Relação | Advisory, exposição e decisão |
|---|---|---|
| prisma 6.19.3 | Direta de desenvolvimento | Propaga `@prisma/config`. CLI fora dos handlers HTTP. O audit sugere Prisma 7.10.1. |
| @prisma/config 6.19.3 | Transitiva de Prisma | Fixa Effect e DeepmergeTS nas versões citadas abaixo. Seu uso é configuração da CLI. |
| effect 3.21.0 | Transitiva | [GHSA-7589-6fvf-x4pw](https://github.com/advisories/GHSA-7589-6fvf-x4pw), alto. Afeta regex de Schema.TemplateLiteral, sem uso nas rotas PetCare. Correção 3.22.1 não consta do pin oficial do Prisma 6. |
| deepmerge-ts 7.1.5 | Transitiva | [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx), alto. Afeta merge de grafos recursivos, fora do caminho HTTP. Correção na major 8. |
| zod 3.25.76 | Direta em shared/API | [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), alto. Afeta coleções limitadas. Schemas do projeto usam campos escalares e JSON limitado a 100 kB. Correção na major 4 a partir de 4.6.6. |

A análise de exposição decorre do código atual. Permanecem as mitigações
existentes e a auditoria informativa. O teste novo confirma 400 para corpo
acima do limite e health 200 em seguida. Cadastro persiste bcrypt com custo 12
e retorna apenas dados públicos. Login emite JWT HS256 de uma hora, verificado
com algoritmo e emissor permitidos. O middleware limita detalhes de falhas
inesperadas. CORS usa a origem configurada e o banco Docker publica somente em
loopback. A CI usa `contents: read`, checkout sem credenciais persistentes e
segredo JWT efêmero mascarado. Antes de exposição pública, permanece a
necessidade de revisar o audit residual e a ausência de limitação de frequência
nas rotas públicas de autenticação.

### Desempenho do carregamento inicial

| Vite 7.3.8 | Base | Revisão |
|---|---:|---:|
| JavaScript da entrada | 660,34 kB | 466,51 kB |
| JavaScript da entrada em gzip | 202,25 kB | 145,05 kB |
| Soma dos chunks JavaScript | 660,34 kB | 667,70 kB |
| Soma dos chunks JavaScript em gzip | 202,25 kB | 215,33 kB |
| CSS | 203,45 kB / 30,06 kB gzip | 203,45 kB / 30,06 kB gzip |

O HTML de entrada carrega um único JS inicial. O login recebe cerca de 29%
menos JavaScript nesse ponto. A soma dos chunks aumentou com a divisão por
rotas. O limite de 500 kB continuou igual, e o aviso desapareceu. Foram
medidos tamanho de build e gzip, sem benchmark de tempo em rede real.

## D/E · Validação técnica

Ambiente Windows com Node 22.23.5, npm 10.9.9 e Docker PostgreSQL 16.15
saudável. Uma cópia de fontes sem arquivos privados recebeu a instalação
limpa da base e, após os ajustes, nova instalação pelo lockfile. As
configurações de exemplo foram conferidas com as portas do Compose, API e
Vite. O ambiente de teste foi fornecido por processo. Os scripts de setup
e os comandos para execução local constam do [handoff](Handoff-For-Front.md).

| Comando | Resultado local |
|---|---|
| `npm ci` | Exit 0, 257 pacotes instalados e Prisma Client gerado |
| `npm run build -w shared` | Exit 0 |
| `npm run build -w api` | Exit 0 |
| `npm run build -w frontend` | Exit 0, sem aviso de chunk |
| `npm test` | 90 testes aprovados, 0 falhas, 0 skips. Shared 25, API local 6, frontend 24, integração real 35. |

A API compilada exercitou as operações de cadastro, login e cinco
operações HTTP para cada recurso: Tutores, Animais, Serviços e Agendamentos.
Os testes também verificam `/health`, `/docs/` e `/docs/openapi.json` e os códigos
200, 201, 204 sem corpo, 400, 401, 404 e 409. O 500 genérico foi comprovado
em processo de teste com o middleware real e falha controlada. Não foi
adicionada rota de falha ao aplicativo.

O executor cria banco de nome aleatório só após verificar sua ausência.
Prisma validate aprovou o schema. A migration `20261118161526_init` foi
aplicada do zero, com `migrate diff --exit-code` sem drift. O seed duplo
manteve uma linha em cada um dos cinco modelos e verificou bcrypt e três
FKs RESTRICT. Conflitos HTTP comprovam as unicidades de CPF, e-mail e
nome de Serviço. O catálogo confirmou `Tutor_cpf_key`, `Usuario_email_key` e
`Servico_nome_key`, todos únicos. O banco de integração foi removido pelo executor.

A CI mantém instalação, builds, validate, migrations, seed, testes e
navegador como passos bloqueantes. A descoberta Playwright executa
`g05.spec.mjs` e `m05.spec.mjs` em notebook e mobile. Só os dois comandos
de audit são informativos e têm `continue-on-error`.

### Navegador e jornada global

`npm run test:e2e -w frontend` terminou com exit 0 e **4/4 jornadas em
4,1 minutos**. As duas G05 mantiveram 20 passos cada. As duas M05
executaram 12 passos cada, incorporando a jornada global. Notebook
1366×768 usou UTC e mobile 390×844 usou America/Fortaleza. Os relatórios
de navegação somam 419 requisições observadas e 403 respostas, incluindo
cenários de transporte abortados. Zero erros inesperados de console.

O fluxo criou uma conta e os quatro registros pela interface. Depois
editou e recarregou cada recurso, confirmou IDs, preço inteiro, status,
timestamp e vínculos no PostgreSQL e bloqueou as três exclusões
dependentes com 409. Removeu Agendamento, Animal, Tutor e Serviço nessa
ordem, com 204 sem corpo e ausência das linhas no banco. Logout voltou
a proteger as quatro rotas. As respostas de sucesso vieram da API e do
banco reais. A instrumentação permitiu atrasar/abortar transporte e
preparar duas situações controladas: um horário legado com
milissegundos e um select cujo vínculo foi removido após carregar.

Foram inspecionadas oito telas em cada largura (Login, Cadastro, Home,
Tutores, Animais, Serviços, Agendamentos e Swagger), além dos dois
modais com erros de campo por largura. As tabelas PetCare usam rolagem
interna no mobile. A verificação de largura passou nas telas da
aplicação e nos modais. A inspeção é do Chromium e das duas larguras
exercitadas. As suítes TAP levaram, respectivamente, 0,54 s, 3,32 s,
2,28 s e 12,83 s, sem contar a preparação externa do banco.

Dois ensaios iniciais de navegador reprovaram por seletores da
instrumentação e pela contagem de metadados OpenAPI. O teste foi
corrigido para esperar o carregamento, localizar a linha específica e
contar somente operações HTTP. Esses ensaios estão nos logs
`e2e-first.log` e `e2e-second.log`. A aprovação usa a repetição integral
`e2e-final.log`.

### Evidências e preservação

- Logs em `%TEMP%/petshop-a2-dbc9f42f40524eaf876985ab373ab3df`, incluindo
  `baseline-ci.log`, `bundle-before.log`, `ci-final.log`, três
  `build-final-*.log`, `tests-final.log`, `e2e-final.log`,
  `db-catalog.log`, `browser-evidence-summary.json` e os dois JSON de audit.
- Capturas e JSON por jornada em `%TEMP%/petshop-ui-qywxup`. As montagens
  `notebook-inspecao.png` e `mobile-inspecao.png` agrupam as oito telas.
  Os PNG individuais incluem os modais com erros de preço e data.
- Ausência confirmada dos quatro bancos descartáveis da sessão, incluindo
  tentativas reprovadas. O fingerprint ordenado das cinco tabelas do
  banco principal ficou igual. O contêiner permaneceu saudável e o volume foi preservado.
- Comparados 105 arquivos de código, configuração e testes com a cópia
  executada. Hashes dos arquivos locais protegidos permaneceram iguais.
  `AGENTS.md` e `.env` estão ignorados e fora do índice. A triagem de
  conteúdo não encontrou o JWT_SECRET local, JWTs ou chaves privadas.

### Matriz dos requisitos conhecidos

| Requisito | Implementação / arquivo | Teste e evidência | Status |
|---|---|---|---|
| Cinco modelos, seed, unicidades e três FKs | `api/prisma/` | Validate, migração do zero, diff sem drift, seed duplo e conflitos 409 da integração | PASS |
| Cadastro e login, dados públicos, JWT e bcrypt | `authService`, `usuarioRepository` e `autenticar` | `auth.test.mjs` com PostgreSQL, hash e JWT verificados | PASS |
| Entrada Zod e erros HTTP | `shared/src/index.ts`, `validarSchema`, `tratarErro` | Unitários shared, erros por campo, limite de corpo e 500 controlado | PASS |
| 22 operações REST, saúde e documentação | Rotas, controllers, services e repositories em `api/src` e `docs/openapi.ts` | `crud.test.mjs`, `auth.test.mjs`, testes locais de docs e health | PASS |
| Duração e preço no limite do PostgreSQL | `Servicos.tsx`, `ServicoModal.tsx`, `inteiro.ts` e `moeda.ts` | `final-a2.test.mjs` e M05, 5000/8050 centavos e rejeição local de entradas inválidas | PASS |
| Horário local, UTC e precisão de edição | `data.ts` e `Agendamentos.tsx` | Testes em UTC, Fortaleza, Kathmandu e Nova York e M05 com dados no banco | PASS |
| Autenticação web e Tutor/Animal | `AuthContext`, Axios, `ProtectedRoute` e páginas | G05, sessão expirada, 401, pesquisa, modais, persistência e FKs | PASS |
| Serviço/Agendamento e fluxo completo | Páginas, services Axios e modais | M05, operações pela interface, relações confirmadas e deleções em ordem | PASS |
| Notebook e mobile, estados visíveis e console | `AppLayout`, tabelas roláveis e formulários Mantine | Capturas reais e verificações de console, labels e largura | PASS |
| Critérios específicos do enunciado | Fonte original indisponível | Confronto acadêmico posterior | PENDENTE |

## F · Entrega

Parecer local: **APROVADO TECNICAMENTE COM RESSALVAS** para instalação e
demonstração acadêmica. A homologação remota requer sucesso da
[CI de backend e interface](https://github.com/VicenzoBenelli/Projeto-Web/actions/workflows/backend-ci.yml)
no SHA final. O SHA e a execução remota são confirmados no fechamento da
sessão. Permanecem os cinco alertas altos, a revisão acadêmica a partir
do enunciado e o aviso de depreciação do Prisma para uma major futura.
README acadêmico, RGMs e vídeo ficam para a etapa documental.

Arquivos da entrega:

- `.github/workflows/backend-ci.yml`
- `api/test/integration/auth.test.mjs`
- `docs/GATE-FINAL-A2.md`
- `docs/QUARTA-ONDA-EVIDENCIAS.md`
- `frontend/playwright.config.ts`
- `frontend/src/App.tsx`
- `frontend/src/components/ServicoModal.tsx`
- `frontend/src/contracts.ts`
- `frontend/src/pages/Agendamentos.tsx`
- `frontend/src/pages/Animais.tsx`
- `frontend/src/pages/Cadastro.tsx`
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/ModuloEmConstrucao.tsx`
- `frontend/src/pages/Servicos.tsx`
- `frontend/src/pages/Tutores.tsx`
- `frontend/src/utils/data.ts`
- `frontend/src/utils/inteiro.ts`
- `frontend/src/utils/moeda.ts`
- `frontend/test/e2e/m05.spec.mjs`
- `frontend/test/final-a2.test.mjs`
- `frontend/test/moeda.test.mjs`
- `frontend/test/run-e2e.mjs`
