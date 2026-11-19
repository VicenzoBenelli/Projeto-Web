# Relatório B04 — Testes de API, segurança, integridade e build

**Projeto:** PetShop  
**Responsável:** Bernardo — Backend 2  
**Data da execução:** 19/11/2026  
**Dependência:** B03 — Swagger OpenAPI integral em `/docs`  
**Resultado:** aprovado nos comandos executados, com ressalva de versão do Node registrada abaixo.

## Objetivo

Registrar evidências de que a API mantém seus contratos HTTP, autenticação, segurança, integridade referencial, isolamento do banco e compilação conforme a tarefa B04.

## Comandos executados

Na raiz do repositório:

```text
npm run build -w shared
npm run build -w api
npm test
git diff --check
```

Os dois builds terminaram sem erros de TypeScript. A suíte completa terminou com código de saída zero e `git diff --check` não reportou problemas. Os testes HTTP exigiram permissão de loopback e a integração usou PostgreSQL local descartável.

## Evidências por item da B04

### 1. Contratos HTTP dos 22 endpoints

Foram executados 33 testes de integração HTTP contra a API compilada. A cobertura percorre as 20 operações CRUD de Tutores, Animais, Serviços e Agendamentos, além de `POST /auth/cadastro` e `POST /auth/login`.

Foram verificados os comportamentos e códigos `200`, `201`, `204`, `400`, `401`, `404` e `409`, autenticação Bearer nas operações privadas, IDs inválidos/inexistentes e corpo vazio em `204`. Os testes validam shapes de cadastro/login e as relações `animal.nome`, `tutor.nome` e `servico.nome` em listagem, busca, criação e atualização de agendamento.

**Resultado:** 33 testes integrados aprovados; 0 falhas.

### 2. Validações, unicidade e integridade referencial

Os cenários cobriram:

- campos inválidos de Tutor (nome e CPF), Animal (nome e FK de tutor), Serviço (nome, preço e duração) e Agendamento (data/hora, status e FKs de animal e serviço);
- CPF duplicado, e-mail duplicado após normalização e nome de Serviço duplicado, com resposta `409`;
- exclusão de Tutor com Animal relacionado e de Animal/Serviço com Agendamento relacionado, com `409` e preservação dos dados;
- exclusões permitidas com `204`, corpo vazio e `404` em consulta posterior;
- FKs inexistentes no cadastro/atualização e constraints verificadas no PostgreSQL.

**Resultado:** cenários de validação e constraints aprovados contra PostgreSQL.

### 3. Hash e exposição de credenciais

Os testes confirmaram que a senha persistida difere da senha original e passa em `bcrypt.compare`; cadastro retorna somente `id`, `nome` e `email`; login retorna somente `token` e o usuário público (`id`, `nome`, `email`). Respostas verificadas não contêm `senhaHash`, senha em texto ou stack trace. O processo HTTP de teste verifica que seus logs não contêm o segredo JWT, a senha de fixture ou o token emitido no login. Erros internos retornam mensagem genérica.

Não existe endpoint de listagem/consulta de Usuários no contrato atual; portanto, essa parte condicional da rubrica não se aplica. Os retornos públicos de cadastro e login foram testados.

**Resultado:** verificações de hash e exposição de segredos aprovadas.

### 4. Banco de teste isolado

`api/test/run-postgres.mjs` exige PostgreSQL local em `127.0.0.1`, cria um banco de nome aleatório `petshop_test_<uuid>`, aplica as migrations e executa as integrações com um `JWT_SECRET` aleatório. Ao terminar, verifica que não há conexões pendentes, remove o banco e confirma que ele não existe mais.

Na execução registrada, foi criado `petshop_test_8be80bba8fea404c90cad088ac9db5a0`; ao final, o runner informou `Cleanup confirmado: ... ausente.` O banco de seed do grupo não foi usado nem removido.

**Resultado:** isolamento e cleanup confirmados.

### 5. Builds, Swagger e regressão

| Verificação | Resultado |
|---|---:|
| `npm run build -w shared` | Aprovado |
| `npm run build -w api` | Aprovado |
| Testes de `shared` | 24 aprovados, 0 falhas |
| Testes unitários da API | 6 aprovados, 0 falhas |
| Testes do frontend | 1 aprovado, 0 falhas |
| Testes HTTP integrados da API | 33 aprovados, 0 falhas |
| Total de `npm test` | **64 aprovados, 0 falhas** |
| Swagger/OpenAPI | 3 verificações aprovadas; UI pública e 22 operações documentadas |
| `git diff --check` | Aprovado |

Tutor e Animal tiveram regressão por criação, listagem, busca, atualização, validações, duplicidade de CPF, FK de Tutor e exclusões restritas. Os testes de documentação verificam Swagger público, Bearer, schemas e respostas. Serviço e Agendamento também tiveram seus contratos e relações exercitados.

## Critérios de aceite

- **Suites e builds passam sem erros de TypeScript:** atendido; builds solicitados aprovados e 64 testes sem falhas.
- **HTTP e shapes do contrato permanecem estáveis:** atendido pelos testes CRUD, autenticação, erros e relações aninhadas.
- **Sem payloads ou logs com segredos:** atendido; verificadas respostas sem hash/senha/stack e logs sem segredo JWT/senha/token de acesso.
- **Banco de seed preservado:** atendido; execução isolada em banco descartável removido ao final.

## Ressalvas

O projeto fixa Node `22` em `.nvmrc` e declara `engines: >=22 <23`. A execução foi feita com Node `v24.16.0`, então build e testes passaram nessa versão, mas falta repetir com Node 22 para validar exatamente o runtime esperado.

O Prisma emitiu aviso de que `package.json#prisma` será descontinuado no Prisma 7. O aviso não afetou migration, testes ou cleanup e não foi alterado nesta tarefa.

## Arquivos de evidência

- `api/test/integration/crud.test.mjs` — contratos CRUD, validações, relações e integridade;
- `api/test/integration/auth.test.mjs` — bcrypt, JWT, validação e retornos públicos;
- `api/test/run-postgres.mjs` — banco descartável isolado e cleanup;
- `api/test/helpers/api-server.mjs` — API compilada e verificação de logs sem segredos;
- `api/test/docs.test.mjs` — Swagger/OpenAPI;
- `api/test/health.test.mjs` e `api/test/config.test.mjs` — saúde/CORS e segredo JWT.

## Conclusão

Os critérios técnicos da B04 foram cobertos e aprovados nos comandos executados. Para fechar a conformidade do ambiente, falta repetir build e testes com Node 22, versão indicada pelo repositório.
