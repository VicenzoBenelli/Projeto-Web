import assert from 'node:assert/strict';
import { once } from 'node:events';
import test, { after, before } from 'node:test';
import { app } from '../dist/app.js';

let server;
let base;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

test('Swagger UI e documento OpenAPI ficam públicos e descrevem as 22 operações', async () => {
  const ui = await fetch(`${base}/docs/`);
  assert.equal(ui.status, 200);
  assert.match(ui.headers.get('content-type') ?? '', /text\/html/);
  assert.match(await ui.text(), /swagger-ui/);

  const response = await fetch(`${base}/docs/openapi.json`);
  assert.equal(response.status, 200);
  const document = await response.json();
  assert.equal(document.openapi, '3.0.3');
  const operations = Object.values(document.paths).flatMap(path =>
    Object.entries(path).filter(([method]) => ['get', 'post', 'put', 'delete'].includes(method)));
  assert.equal(operations.length, 22);
  assert.equal(JSON.stringify(document).includes('senhaHash'), false);
});

test('rotas privadas usam Bearer, auth é pública e respostas 204 não têm corpo', async () => {
  const document = await (await fetch(`${base}/docs/openapi.json`)).json();
  assert.deepEqual(document.components.securitySchemes.BearerAuth, {
    type: 'http', scheme: 'bearer', bearerFormat: 'JWT',
    description: 'Cole o JWT retornado por POST /auth/login, sem escrever "Bearer ".',
  });

  for (const path of ['/tutores', '/animais', '/servicos', '/agendamentos']) {
    for (const method of ['get', 'post']) {
      assert.deepEqual(document.paths[path][method].security, [{ BearerAuth: [] }]);
    }
    for (const method of ['get', 'put', 'delete']) {
      assert.deepEqual(document.paths[`${path}/{id}`][method].security, [{ BearerAuth: [] }]);
    }
    assert.equal('security' in document.paths[path].post, true);
    assert.equal(document.paths[path].post.responses['201'].description.length > 0, true);
    assert.equal('content' in document.paths[`${path}/{id}`].delete.responses['204'], false);
  }
  assert.equal('security' in document.paths['/auth/login'].post, false);
  assert.equal('security' in document.paths['/auth/cadastro'].post, false);
  assert.ok(document.paths['/auth/login'].post.responses['200']);
  assert.ok(document.paths['/auth/login'].post.responses['401']);
});

test('schemas document entradas, erros e a resposta aninhada do agendamento', async () => {
  const document = await (await fetch(`${base}/docs/openapi.json`)).json();
  const schemas = document.components.schemas;
  assert.deepEqual(schemas.AgendamentoInput.required, ['animalId', 'servicoId', 'dataHora']);
  assert.deepEqual(schemas.AgendamentoInput.properties.status.enum, ['AGENDADO', 'CONCLUIDO', 'CANCELADO']);
  assert.equal(schemas.AgendamentoResponse.properties.animal.properties.tutor.properties.nome.type, 'string');
  assert.equal(schemas.AgendamentoResponse.properties.servico.properties.nome.type, 'string');
  // O objeto Zod também satisfaz ApiError: oneOf rejeitaria uma resposta real.
  assert.equal('oneOf' in schemas.BadRequest, false);
  assert.deepEqual(schemas.BadRequest.anyOf[0], { $ref: '#/components/schemas/ApiError' });
  assert.deepEqual(schemas.BadRequest.anyOf[1].required, ['message', 'errors']);

  const allResponses = JSON.stringify(document.paths);
  for (const status of ['200', '201', '204', '400', '401', '404', '409']) {
    assert.ok(allResponses.includes(`"${status}"`), `resposta ${status} documentada`);
  }
});
