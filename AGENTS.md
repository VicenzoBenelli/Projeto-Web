# Regras de desenvolvimento — Pet Shop A2

Fonte principal: Plano de Desenvolvimento Pet Shop A2 (PDF fornecido pelo grupo).

## Ordem obrigatória na main
Vicenzo (V01–V06) → Bernardo (B01–B05) → Gabriel (G01–G05) → Marcos (M01–M05).
Um único escritor por vez. Antes de cada tarefa: git status, git pull --ff-only, inspecionar arquivos e não sobrescrever mudanças não revisadas.

## GPT-6.1-Sol (xhigh)
Uma tarefa por rodada, sem avançar para tarefas de outro integrante. Seguir a stack exigida: Node 22, PostgreSQL Docker, Prisma 6.x, Express + TypeScript, Zod 3 compartilhado, bcrypt, JWT, Swagger, React + Vite, Mantine, Axios e npm workspaces.
Validar antes de commit. Não forjar autoria e não inserir assinaturas ou atribuição automática a IA em commits. Commit/push somente com identidade real do integrante e após revisão e testes. Sem force push/reset destrutivo.

## Contrato congelado
5 modelos: Tutor, Animal, Servico, Agendamento, Usuario. Animal → Tutor; Agendamento → Animal e Servico. Restrict na deleção com relacionamentos, unique em cpf/email/nomeServico, preço em centavos e data UTC ISO 8601.
Rotas: /auth/cadastro, /auth/login; CRUD 5 operações cada em /tutores, /animais, /servicos, /agendamentos; /docs e /health. CRUD com Bearer JWT; POST/PUT com validarBody + schemas de @petshop/shared. Camadas: routes → controllers → services → repositories → Prisma.
Status: 201 criar, 200 obter/editar, 204 apagar sem corpo, 400 Zod com errors por campo, 401 auth, 404 não encontrado, 409 unique/FK.
GET /animais inclui tutor {id,nome}; GET /agendamentos inclui animal.nome, animal.tutor.nome, servico.nome. Nunca enviar senhaHash em respostas.

## Primeira onda — Vicenzo
V01 workspaces/Docker/ambiente/health; V02 schema Prisma + migration real + seed idempotente; V03 schemas Zod + tipos shared; V04 auth bcrypt JWT e middlewares; V05 CRUD Tutor/Animal em 4 camadas; V06 regressão/handoff.
Não antecipar README definitivo nem vídeo. Não iniciar Bernardo antes do gate V06.
