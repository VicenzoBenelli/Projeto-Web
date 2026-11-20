# Handoff B05 — API PetShop para Gabriel

**Responsável pelo backend:** Bernardo — Backend 2  
**Base URL local:** `http://localhost:3001`  
**Swagger UI:** `http://localhost:3001/docs`  
**OpenAPI JSON:** `http://localhost:3001/docs/openapi.json`  
**Health:** `http://localhost:3001/health`

## Inicialização local

Pré-requisitos: Node **22.x**, npm compatível (gate: 10.9.9), Docker Desktop
com engine Linux e Docker Compose operacionais. O Node 24 global não atende ao
`engines` do projeto. No Windows desta máquina, ative o Node 22 apenas na sessão:

```powershell
$nodeDir = (Get-Content "$env:LOCALAPPDATA/petshop-toolchain/node22-path.txt").Trim()
$env:PATH = "$nodeDir;$env:PATH"
node --version
npm --version
```

Em outra máquina, instale/ative Node 22 pelo gerenciador de versões de sua
preferência; o caminho acima é específico desta máquina.

Na raiz do repositório, configure os dois arquivos de ambiente **antes** de
executar a API. Em PowerShell, os comandos abaixo preservam arquivos existentes:

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
if (!(Test-Path api/.env)) {
  Copy-Item api/.env.example api/.env
  node -e 'const fs=require("node:fs"),crypto=require("node:crypto"); const p="api/.env"; fs.writeFileSync(p,fs.readFileSync(p,"utf8").replace("substitua-por-segredo-longo-aleatorio-no-ambiente-local",crypto.randomBytes(48).toString("hex")));'
}
```

Se `api/.env` já existir, confira localmente se `JWT_SECRET` é aleatório, tem
pelo menos 32 caracteres e difere do exemplo. Não imprima nem compartilhe esse
segredo. `.env` e `api/.env` são ignorados pelo Git. Os exemplos usam somente
credenciais públicas de desenvolvimento, sem segredos de produção.

Com Docker Desktop ativo, na raiz:

```bash
npm ci
docker compose up -d --wait postgres
npm run db:migrate:deploy -w api
npm run db:status -w api
npm run db:seed -w api
npm run db:verify-seed -w api
npm run build -w shared
npm run build -w api
npm run build -w frontend
npm test
npm run dev:api
```

`npm ci` compila shared e gera o Prisma Client pelo postinstall. O serviço
PostgreSQL do Compose fica limitado ao loopback e publica a porta `55432`.
`api/.env` aponta para `postgresql://petshop:petshop_dev@127.0.0.1:55432/petshop?schema=public`,
com `PORT=3001` e `CORS_ORIGIN=http://localhost:5173`. Se mudar as credenciais ou
porta no `.env` da raiz, ajuste também `DATABASE_URL` em `api/.env`.
O seed é acadêmico: redefine os dados públicos de demonstração; não é rotina de
produção. O verificador executa o seed mais duas vezes e confere idempotência.
`npm test` cria/remove seu próprio banco descartável e exige permissão local
CREATEDB do usuário do Compose; não escreve no banco de desenvolvimento.

A API usa `api/.env` e inicia na porta `3001`. Após o build, pode ser executada
por `npm start -w api`. Em outro terminal, `npm run dev:frontend` inicia o shell
Vite em `http://localhost:5173`. Se a porta estiver ocupada, libere-a ou ajuste o
CORS para a origem efetivamente usada. O Swagger e `/health` são públicos.

## Conta acadêmica de demonstração

As credenciais vêm do seed acadêmico versionado:

```text
E-mail: professor@petshop.com
Senha: PetShop@2026!
```

Gabriel deve gerar seu próprio JWT por `POST /auth/login`, com JSON contendo
`email` e `senha` acima. O token tem validade de uma hora; repita o login quando
expirar. Não é necessário compartilhar tokens individuais. Em `/docs`, abra
Authorize e cole apenas o token retornado, sem o prefixo Bearer.

## Consumo com Axios

Axios já é dependência do frontend. Configure `baseURL: 'http://localhost:3001'`
e envie `Authorization: Bearer <JWT>` nas 20 operações CRUD. Cadastro/login são
públicos. O corpo nominal está em `response.data`; falhas HTTP estão em
`error.response.status` e `error.response.data`. A resposta 204 tem corpo vazio.
Em erros Zod, associe cada item de `errors` ao campo indicado por `field`.
Conflitos 409 têm `message` pública; não dependa do texto exato para decidir o
status. Não coloque token em URL nem em código versionado.

Os selects usam `GET /tutores` (`id`, `nome`), `GET /animais` (`id`, `nome`,
`tutor.id`, `tutor.nome`) e `GET /servicos` (`id`, `nome`). As listas são arrays
reais, sem wrapper ou paginação. Preços são inteiros positivos em centavos.
POST/PUT retornam o objeto completo, incluindo relações documentadas abaixo.
PUT exige os campos obrigatórios completos; omitir raca/descricao/observacoes
limpa esses opcionais. Status omitido em Agendamento assume AGENDADO.
Datas devem incluir fuso (`Z` ou `±HH:MM`) e retornam UTC. Converta o valor de
`datetime-local` para ISO com fuso antes do envio. Fusos inválidos retornam 400.

## Matriz dos 22 endpoints

Para simplificar os exemplos, respostas mostram um registro representativo; IDs e datas são ilustrativos. As rotas CRUD exigem `Authorization: Bearer <JWT>`.

| # | Método e rota | Exemplo de request | Resposta nominal |
|---:|---|---|---|
| 1 | `POST /auth/cadastro` | `{"nome":"Ana","email":"ana@example.com","senha":"Senha@123"}` | `201` `{"id":2,"nome":"Ana","email":"ana@example.com"}` |
| 2 | `POST /auth/login` | `{"email":"professor@petshop.com","senha":"PetShop@2026!"}` | `200` `{"token":"<JWT>","usuario":{"id":1,"nome":"Professor","email":"professor@petshop.com"}}` |
| 3 | `GET /tutores` | Sem body | `200` `[ {"id":1,"nome":"Tutor Demonstração","cpf":"12345678901","telefone":"11999999999","criadoEm":"2026-11-19T12:00:00.000Z"} ]` |
| 4 | `GET /tutores/{id}` | Ex.: `/tutores/1` | `200` `{"id":1,"nome":"Tutor Demonstração","cpf":"12345678901","telefone":"11999999999","criadoEm":"2026-11-19T12:00:00.000Z"}` |
| 5 | `POST /tutores` | `{"nome":"Maria Silva","cpf":"12345678902","telefone":"11988887777"}` | `201` Tutor criado com `id` e `criadoEm` |
| 6 | `PUT /tutores/{id}` | `{"nome":"Maria Silva","cpf":"12345678902","telefone":"11988887777"}` | `200` Tutor atualizado |
| 7 | `DELETE /tutores/{id}` | Sem body | `204`, corpo vazio; `409` quando há animais vinculados |
| 8 | `GET /animais` | Sem body | `200` `[ {"id":1,"nome":"Rex","especie":"CACHORRO","raca":null,"tutorId":1,"tutor":{"id":1,"nome":"Tutor Demonstração"}} ]` |
| 9 | `GET /animais/{id}` | Ex.: `/animais/1` | `200` Animal com objeto público `tutor` (`id`, `nome`) |
| 10 | `POST /animais` | `{"nome":"Luna","especie":"GATO","raca":"Siamês","tutorId":1}` | `201` Animal criado com `tutor` (`id`, `nome`) |
| 11 | `PUT /animais/{id}` | `{"nome":"Luna","especie":"GATO","raca":null,"tutorId":1}` | `200` Animal atualizado com `tutor` |
| 12 | `DELETE /animais/{id}` | Sem body | `204`, corpo vazio; `409` quando há agendamento vinculado |
| 13 | `GET /servicos` | Sem body | `200` `[ {"id":1,"nome":"Banho","descricao":"Banho de demonstração","precoCentavos":5000,"duracaoMinutos":60} ]` |
| 14 | `GET /servicos/{id}` | Ex.: `/servicos/1` | `200` Serviço com nome, descrição, preço em centavos e duração |
| 15 | `POST /servicos` | `{"nome":"Tosa","descricao":"Tosa higiênica","precoCentavos":7500,"duracaoMinutos":45}` | `201` Serviço criado |
| 16 | `PUT /servicos/{id}` | `{"nome":"Tosa","descricao":"Tosa completa","precoCentavos":8200,"duracaoMinutos":50}` | `200` Serviço atualizado |
| 17 | `DELETE /servicos/{id}` | Sem body | `204`, corpo vazio; `409` quando há agendamentos vinculados |
| 18 | `GET /agendamentos` | Sem body | `200` lista com `animal.nome`, `animal.tutor.nome` e `servico.nome` |
| 19 | `GET /agendamentos/{id}` | Ex.: `/agendamentos/1` | `200` Agendamento com as relações aninhadas abaixo |
| 20 | `POST /agendamentos` | `{"animalId":1,"servicoId":1,"dataHora":"2026-12-10T14:00:00.000Z","status":"AGENDADO","observacoes":"Demonstração"}` | `201` Agendamento criado com as relações abaixo |
| 21 | `PUT /agendamentos/{id}` | `{"animalId":1,"servicoId":1,"dataHora":"2026-12-11T14:00:00.000Z","status":"CONCLUIDO","observacoes":"Concluído"}` | `200` Agendamento atualizado com as relações abaixo |
| 22 | `DELETE /agendamentos/{id}` | Sem body | `204`, corpo vazio |

Formato representativo de agendamento:

```json
{
  "id": 1,
  "animalId": 1,
  "servicoId": 1,
  "dataHora": "2026-12-10T14:00:00.000Z",
  "status": "AGENDADO",
  "observacoes": "Demonstração",
  "animal": { "nome": "Rex", "tutor": { "nome": "Tutor Demonstração" } },
  "servico": { "nome": "Banho" }
}
```

Para POST/PUT inválidos, a API retorna `400` com `{ "message": "Dados inválidos", "errors": [{"field":"...","message":"..."}] }`. IDs malformados retornam `400`; IDs válidos inexistentes, `404`; CPF/e-mail/nome de Serviço duplicados e FKs inválidas, `409`. Credenciais inválidas retornam `401`.

## Smoke test e evidências B05

- Banco novo `petshop_b05_gate_20261119`: migration aplicada, seed executado e verificação do seed repetida duas vezes sem alterar contagens. A base usual `petshop` foi preservada.
- `GET /health` respondeu `200` na API compilada.
- `/docs` abriu, e `/docs/openapi.json` declarou exatamente 22 operações.
- Login com a conta de seed respondeu `200`; token foi aceito por operação privada.
- GET/POST/PUT/DELETE foram exercitados em Tutor, Animal, Serviço e Agendamento; respostas aninhadas e `204` vazio foram conferidos. Fixtures criadas pelo smoke test foram removidas.
- Builds `shared` e `api` aprovados com Node `v22.23.5`.
- Suíte `npm test`: 64 aprovados, 0 falhas; banco isolado de integração removido pelo runner.

## Limitações

- JWT é temporário (uma hora); Gabriel deve gerar outro via login quando necessário.
- Prisma 6.19 emitiu aviso de descontinuação futura da configuração `package.json#prisma`; não afeta esta entrega.
- A API local já estava ativa em `localhost:3001`; o smoke de banco recém-criado foi executado em instância isolada na porta `3002` para não interromper o servidor em uso.

As evidências B05 acima são históricas. A homologação atual, correções e riscos
de dependências estão em [GATE-BACKEND-FINAL.md](GATE-BACKEND-FINAL.md).
Este handoff não autoriza iniciar automaticamente a Onda 03.
