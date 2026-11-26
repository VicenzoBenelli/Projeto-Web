# Quarta onda — Evidências (M01–M05)

> Nota de trabalho para o README acadêmico e o vídeo. A edição inicial foi escrita antes da publicação. Os cinco commits da onda chegaram à `main` até `9b57c1c`.

## Comandos que funcionaram (Linux + Podman/Docker)

```bash
cp .env.example .env && cp api/.env.example api/.env && cp frontend/.env.example frontend/.env
# Em api/.env: JWT_SECRET precisa de >= 32 caracteres (o do .env.example é rejeitado pela API)
docker compose up -d                     # Postgres 16 em 127.0.0.1:55432
npm install                              # workspaces + prisma generate
npm run db:migrate:dev -w api
npm run db:seed -w api                   # idempotente (verificado com seed duplo)
npm run db:verify-seed -w api
npm run dev:api                          # http://localhost:3001 (Swagger em /docs/)
npm run dev:frontend                     # http://localhost:5173
npm run build                            # shared + api + frontend, código 0
npm test                                 # shared + api + frontend + integração: 55 testes, 0 falhas no registro original
```

Credenciais demo: `professor@petshop.com` / `PetShop@2026!`

## M01 — Serviços com preço em reais
- `frontend/src/utils/moeda.ts`: `formatarBRL` (5000 → "R$ 50,00"), `paraCentavos` ("80,50" → 8050, rejeita inválidos/negativos), máscara progressiva.
- Modal único de create/edit (`components/ServicoModal.tsx`); nenhum valor com vírgula trafega para a API (conversão controlada antes do `servicoSchema.safeParse`).
- E2E: cadastro "Vacinação" R$ 80,50 → banco 8050 centavos; edição para R$ 90,00 (9000); erros 400 (Zod) e 409 ("Registro já cadastrado", "Não é possível excluir serviço com agendamentos vinculados") exibidos no modal.
- Bug corrigido durante E2E: `NumberInput` do Mantine devolvia número e quebrava a máscara (salvava R$ 0,80 em vez de R$ 80,50) → substituído por `TextInput` mascarado.

## M02 — Agendamentos com selects da API
- Selects de Animal e Serviço carregados de `GET /animais` e `GET /servicos`; nomes claros, IDs convertidos para número antes da validação.
- Lista mostra data/hora local, animal, tutor, serviço e status (nomes vindos do `include` da API).
- `datetime-local` → ISO 8601 com fuso (`new Date().toISOString()`); ida e volta verificada (15:30 local mantido após reload).
- CRUD completo: criar, editar (troca de serviço e status), excluir; validação por campo ("Selecione um animal/serviço", "Informe data e hora").

## M03 — Busca local com .filter
- `.filter` case-insensitive presente em `Servicos.tsx`, `Agendamentos.tsx` (novos) e `Tutores.tsx`/`Animais.tsx` (existentes).
- Busca não dispara API; estado vazio da busca distinto de banco vazio; contagem de registros.
- Padrão visual herdado de Tutores (Mantine, modais centralizados, alertas de sucesso/erro) nas 4 telas.

## M04 — Regressão end-to-end
- Builds dos três workspaces com código 0.
- API via cliente HTTP: 401 sem token, 400 Zod, 404 id inexistente, 409 duplicado e 409 FK; sem senha/senhaHash em respostas.
- Telas de Tutores e Animais (Gabriel) seguem carregando após as mudanças.

## Validação posterior à publicação

O registro de 55 testes acima descreve a execução original. A CI do SHA
`9b57c1ccacf5dfca2846e6cbd1bd0593d3b4c66e` registrou 80 testes e duas jornadas
de navegador do G05. Veja a [execução da quarta onda](https://github.com/VicenzoBenelli/Projeto-Web/actions/runs/45461679314)
e os totais e a cobertura posteriores no [Gate Final A2](GATE-FINAL-A2.md).

## M05 — Pendências registradas ao fim da onda
- Bloqueantes: nenhuma conhecida.
- Não bloqueantes: bundle do frontend > 500 kB (aviso de chunk do Vite, sem impacto funcional); `ModuloEmConstrucao.tsx` ficou sem uso após o cutover das rotas (pode ser removido antes do commit, se o grupo concordar — não removido para evitar conflito com trabalho simultâneo).
- README final e vídeo: pendentes por decisão do plano (não antecipados).
