# Handoff B05 — API PetShop para Gabriel

**Responsável pelo backend:** Bernardo — Backend 2  
**Base URL local:** `http://localhost:3001`  
**Swagger UI:** `http://localhost:3001/docs`  
**OpenAPI JSON:** `http://localhost:3001/docs/openapi.json`  
**Health:** `http://localhost:3001/health`

## Inicialização local

Na raiz do repositório, com Docker Desktop ativo:

```bash
docker compose up -d postgres
npm ci
npm run db:migrate:deploy -w api
npm run db:seed -w api
npm run dev:api
```

O serviço PostgreSQL do Compose fica limitado ao loopback e publica a porta `55432`. A API usa a configuração local de `api/.env` e inicia na porta `3001`. O frontend deve enviar `Authorization: Bearer <JWT>` nas operações privadas. O Swagger e `/health` são públicos.

## Conta acadêmica de demonstração

As credenciais vêm do seed acadêmico versionado:

```text
E-mail: professor@petshop.com
Senha: PetShop@2026!
```

Obtenha o JWT atual executando `POST /auth/login`, exemplo abaixo. O token tem validade de uma hora. O token individual do handoff deve ser compartilhado em canal privado e não armazenado neste arquivo ou no Git.

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

- JWT é temporário (uma hora); Gabriel deve solicitar outro via login quando necessário. O token atual foi entregue separadamente do repositório para evitar versionar credencial bearer.
- Prisma 6.19 emitiu aviso de descontinuação futura da configuração `package.json#prisma`; não afeta esta entrega.
- A API local já estava ativa em `localhost:3001`; o smoke de banco recém-criado foi executado em instância isolada na porta `3002` para não interromper o servidor em uso.
