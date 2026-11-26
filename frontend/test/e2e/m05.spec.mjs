import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';

const requireApi = createRequire(new URL('../../../api/package.json', import.meta.url));
const { PrismaClient } = requireApi('@prisma/client');
const api = process.env.E2E_API_URL;

test('M05: Serviços, Agendamentos e jornada global com PostgreSQL', async ({ page }, info) => {
  expect(process.env.PETSHOP_E2E_DATABASE).toMatch(/^petshop_e2e_[a-f0-9]{32}$/);
  expect(new URL(process.env.DATABASE_URL).pathname).toBe('/' + process.env.PETSHOP_E2E_DATABASE);
  const db = new PrismaClient();
  const suffix = info.project.name;
  const tutor = 'Tutor A2 ' + suffix;
  const cpf = suffix === 'notebook' ? '66200000001' : '66200000002';
  const animal = 'Pet A2 ' + suffix;
  const service = 'Consulta A2 ' + suffix;
  const email = 'a2-' + suffix + '@example.com';
  const password = 'Fixture-A2@123';
  const dialog = page.getByRole('dialog');
  const row = name => page.getByRole('row').filter({ has: page.getByRole('cell', { name, exact: true }) });
  const button = name => dialog.getByRole('button', { name, exact: true });
  const field = label => dialog.getByLabel(label);
  const failures = [];
  const requests = [];
  const responses = [];
  const steps = [];
  let networkFailure = false;

  page.on('pageerror', error => failures.push(error.message));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/Failed to load resource: the server responded with a status of (401|409)/.test(text)) return;
    if (networkFailure && /Failed to load resource|net::ERR_FAILED/.test(text)) return;
    failures.push({ text, path: message.location().url ? new URL(message.location().url).pathname : '' });
  });
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.origin === api) requests.push({ method: request.method(), path: url.pathname });
  });
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.origin === api) responses.push({ method: response.request().method(), path: url.pathname, status: response.status() });
  });

  const step = (name, work) => test.step(name, async () => { await work(); steps.push(name); });
  const open = async (path, title) => {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  };
  const capture = async (name, isApp = true) => {
    if (isApp) expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(name + '.png'), fullPage: true, animations: 'disabled' });
  };
  const select = async (label, option) => {
    await field(label).click();
    await page.getByRole('option', { name: option, exact: true }).click();
  };
  const receive = (method, path, status) => page.waitForResponse(response =>
    response.url() === api + path && response.request().method() === method && response.status() === status);
  const submit = async (label, method, path, status) => {
    const pending = receive(method, path, status);
    await button(label).click();
    return pending;
  };
  const success = async text => {
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('status').filter({ hasText: text })).toBeVisible();
  };
  const invalid = async (label, path, fieldLabel) => {
    const writes = () => requests.filter(r => r.path.startsWith(path) && ['POST', 'PUT'].includes(r.method)).length;
    const before = writes();
    await button(label).click();
    await expect(field(fieldLabel)).toHaveAttribute('aria-invalid', 'true');
    expect(writes()).toBe(before);
  };
  const remove = async ({ name, action, path, conflict }) => {
    await row(name).getByRole('button', { name: action, exact: true }).click();
    await expect(dialog).toContainText(/Deseja realmente excluir/);
    const response = await submit('Excluir', 'DELETE', path, conflict ? 409 : 204);
    if (conflict) {
      await expect(dialog.getByRole('alert')).toContainText(/vinculado/);
      await button('Cancelar').click();
      await expect(dialog).toBeHidden();
      await expect(row(name)).toBeVisible();
    } else {
      expect(await response.body()).toHaveLength(0);
      await success(/excluído/i);
      await expect(row(name)).toHaveCount(0);
    }
  };
  const recoverList = async (path, title, name) => {
    const { promise, resolve } = Promise.withResolvers();
    await page.route(api + path, async route => {
      await promise;
      await route.continue();
    });
    try {
      await open(path, title);
      await expect(page.getByText('Carregando ' + title.toLocaleLowerCase('pt-BR') + '...', { exact: true })).toBeVisible();
    } finally { resolve(); }
    await expect(row(name)).toBeVisible();
    await page.unroute(api + path);
    networkFailure = true;
    await page.route(api + path, route => route.abort('failed'));
    await page.reload();
    await expect(page.getByRole('alert')).toContainText('Não foi possível conectar à API');
    await expect(page.getByText('Lista indisponível.', { exact: false })).toBeVisible();
    await page.unroute(api + path);
    await page.reload();
    await expect(row(name)).toBeVisible();
    networkFailure = false;
  };

  try {
    await step('Conta real, login normalizado e Home', async () => {
      await open('/login', 'PetCare');
      await capture('login');
      await page.getByRole('link', { name: 'Criar conta' }).click();
      await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible();
      await capture('cadastro');
      await page.getByLabel(/^Nome/).fill('Operador A2');
      await page.getByLabel('E-mail').fill(email.toUpperCase());
      await page.getByLabel(/^Senha/).fill(password);
      const created = receive('POST', '/auth/cadastro', 201);
      await page.getByRole('button', { name: 'Cadastrar conta' }).click();
      expect(Object.keys(await (await created).json()).sort()).toEqual(['email', 'id', 'nome']);
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByRole('heading', { name: 'PetCare' })).toBeVisible();
      await page.getByLabel('E-mail').fill(email.toUpperCase());
      await page.getByLabel(/^Senha/).fill(password);
      const loggedIn = receive('POST', '/auth/login', 200);
      await page.getByRole('button', { name: 'Entrar', exact: true }).click();
      await loggedIn;
      await expect(page.getByRole('heading', { name: 'Bem-vindo ao PetCare!' })).toBeVisible();
      await capture('home');
    });

    let tutorId, animalId, serviceId, appointmentId;
    await step('Criar e editar Tutor pela interface, com persistência', async () => {
      await open('/tutores', 'Tutores');
      await expect(row('Tutor Demonstração')).toBeVisible();
      await page.getByRole('button', { name: 'Novo tutor' }).click();
      await field(/^Nome completo/).fill(tutor);
      await field(/^CPF/).fill(cpf);
      await field(/^Telefone/).fill('11999999999');
      tutorId = (await (await submit('Cadastrar', 'POST', '/tutores', 201)).json()).id;
      await success(/Tutor cadastrado/);
      await row(tutor).getByRole('button', { name: 'Editar tutor' }).click();
      await field(/^Telefone/).fill('11988887777');
      await submit('Salvar alterações', 'PUT', '/tutores/' + tutorId, 200);
      await success(/Tutor atualizado/);
      await page.reload();
      await expect(row(tutor)).toContainText('98888-7777');
      await capture('tutores');
    });

    await step('Criar e editar Animal ligado ao Tutor real', async () => {
      await open('/animais', 'Animais');
      await expect(row('Rex')).toBeVisible();
      await page.getByRole('button', { name: 'Novo animal' }).click();
      await field(/^Nome do animal/).fill(animal);
      await select(/^Tutor responsável/, tutor + ' — CPF ' + cpf);
      const response = await submit('Cadastrar', 'POST', '/animais', 201);
      expect(response.request().postDataJSON().tutorId).toBe(tutorId);
      animalId = (await response.json()).id;
      await success(/Animal cadastrado/);
      await row(animal).getByRole('button', { name: 'Editar animal' }).click();
      await field(/^Raça/).fill('Pastor');
      await submit('Salvar alterações', 'PUT', '/animais/' + animalId, 200);
      await success(/Animal atualizado/);
      await page.reload();
      await expect(row(animal)).toContainText('Pastor');
      await expect(row(animal)).toContainText(tutor);
      await capture('animais');
    });

    await step('Serviços: validação de POST, valores progressivos e duplicidade', async () => {
      await open('/servicos', 'Serviços');
      await expect(row('Banho')).toContainText(/R\$\s*50,00/);
      await page.getByRole('button', { name: 'Novo serviço' }).click();
      await field(/^Nome/).fill(service);
      await field(/^Descrição/).fill('Consulta preventiva');
      const price = field(/^Preço/);
      const duration = field(/^Duração/);
      await price.fill('50,00');
      for (const value of ['-30', '1.5', 'abc30', '1e3', '0', '2147483648']) {
        await duration.fill(value);
        await invalid('Cadastrar', '/servicos', /^Duração/);
      }
      await duration.fill('30');
      for (const value of ['-50,00', 'abc30', '12.34,56', '1.234', '50.00', '0,00', '21.474.836,48']) {
        await price.fill(value);
        await invalid('Cadastrar', '/servicos', /^Preço/);
        await expect(price).toHaveValue(value);
      }
      await capture('servico-erro');
      await price.fill('');
      await price.pressSequentially('50,00');
      await expect(price).toHaveValue('50,00');
      // Atraso controlado mantém a gravação em curso para verificar o bloqueio.
      let release;
      const waiting = new Promise(resolve => { release = resolve; });
      await page.route(api + '/servicos', async route => {
        if (route.request().method() === 'POST') await waiting;
        await route.continue();
      });
      const pending = receive('POST', '/servicos', 201);
      const writes = () => requests.filter(r => r.method === 'POST' && r.path === '/servicos').length;
      const before = writes();
      try {
        await button('Cadastrar').click();
        await expect(button('Cadastrar')).toBeDisabled();
        await dialog.locator('form').evaluate(form => form.requestSubmit());
      } finally { release(); }
      const response = await pending;
      await page.unroute(api + '/servicos');
      expect(writes()).toBe(before + 1);
      expect(response.request().postDataJSON()).toMatchObject({ precoCentavos: 5000, duracaoMinutos: 30 });
      serviceId = (await response.json()).id;
      await success(/Serviço cadastrado/);
      await page.getByRole('button', { name: 'Novo serviço' }).click();
      await field(/^Nome/).fill(service);
      await price.fill('50,00');
      await duration.fill('30');
      await submit('Cadastrar', 'POST', '/servicos', 409);
      await expect(dialog.getByRole('alert')).toContainText('Registro já cadastrado');
      await button('Cancelar').click();
      await expect(dialog).toBeHidden();
    });

    await step('Serviços: validação de PUT, limite monetário, edição e busca', async () => {
      const edit = () => row(service).getByRole('button', { name: 'Editar serviço' }).click();
      await edit();
      await expect(field(/^Preço/)).toHaveValue('50,00');
      await field(/^Descrição/).fill('Consulta preventiva revisada');
      const unchanged = await submit('Salvar alterações', 'PUT', '/servicos/' + serviceId, 200);
      expect(unchanged.request().postDataJSON().precoCentavos).toBe(5000);
      await success(/Serviço atualizado/);
      await edit();
      await field(/^Duração/).fill('-30');
      await invalid('Salvar alterações', '/servicos', /^Duração/);
      await field(/^Duração/).fill('45');
      await field(/^Preço/).fill('-80,50');
      await invalid('Salvar alterações', '/servicos', /^Preço/);
      await field(/^Preço/).fill('21.474.836,47');
      const max = await submit('Salvar alterações', 'PUT', '/servicos/' + serviceId, 200);
      expect(max.request().postDataJSON().precoCentavos).toBe(2147483647);
      await success(/Serviço atualizado/);
      await edit();
      await expect(field(/^Preço/)).toHaveValue('21474836,47');
      await field(/^Preço/).fill('');
      await page.keyboard.insertText('R$ 80,50');
      const edited = await submit('Salvar alterações', 'PUT', '/servicos/' + serviceId, 200);
      expect(edited.request().postDataJSON()).toMatchObject({ precoCentavos: 8050, duracaoMinutos: 45 });
      await success(/Serviço atualizado/);
      await page.reload();
      await expect(row(service)).toContainText(/R\$\s*80,50/);
      const search = page.getByRole('textbox', { name: 'Pesquisar serviços' });
      for (const term of [service.toUpperCase(), 'PREVENTIVA']) {
        await search.fill(term);
        await expect(row(service)).toBeVisible();
        await expect(row('Banho')).toHaveCount(0);
      }
      await search.fill('');
      await capture('servicos');
    });

    await step('Agendamentos: selects reais, calendário inválido e criação UTC', async () => {
      await open('/agendamentos', 'Agendamentos');
      await expect(row('Rex')).toContainText('Tutor Demonstração');
      await page.getByRole('button', { name: 'Novo agendamento' }).click();
      await invalid('Cadastrar', '/agendamentos', /^Animal/);
      await expect(field(/^Serviço/)).toHaveAttribute('aria-invalid', 'true');
      await expect(field(/^Data e hora/)).toHaveAttribute('aria-invalid', 'true');
      await select(/^Animal/, animal + ' — ' + tutor);
      await select(/^Serviço/, service);
      await field(/^Data e hora/).evaluate(input => {
        input.value = '2028-02-30T14:30';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await expect(field(/^Data e hora/)).toHaveValue('');
      await invalid('Cadastrar', '/agendamentos', /^Data e hora/);
      await capture('agendamento-erro');
      await field(/^Data e hora/).fill('2028-02-29T14:30');
      const response = await submit('Cadastrar', 'POST', '/agendamentos', 201);
      const utc = suffix === 'notebook' ? '2028-02-29T14:30:00.000Z' : '2028-02-29T17:30:00.000Z';
      expect(response.request().postDataJSON()).toMatchObject({ animalId, servicoId: serviceId, dataHora: utc, observacoes: null });
      appointmentId = (await response.json()).id;
      await success(/Agendamento cadastrado/);
      await expect(row(animal)).toContainText(tutor);
      await expect(row(animal)).toContainText(service);
      expect((await db.agendamento.findUniqueOrThrow({ where: { id: appointmentId } })).dataHora.toISOString()).toBe(utc);
    });

    await step('Agendamentos: troca relações, data, status, observações e preserva precisão', async () => {
      const record = await db.agendamento.findUniqueOrThrow({ where: { id: appointmentId } });
      const precise = new Date(record.dataHora.getTime() + 37125);
      // Fixture de um dado legado com segundos e milissegundos.
      await db.agendamento.update({ where: { id: appointmentId }, data: { dataHora: precise } });
      await page.reload();
      const edit = name => row(name).getByRole('button', { name: 'Editar agendamento', exact: true }).click();
      await edit(animal);
      await expect(field(/^Data e hora/)).toHaveValue('2028-02-29T14:30');
      await select(/^Animal/, 'Rex — Tutor Demonstração');
      await select(/^Serviço/, 'Banho');
      await select(/^Status/, 'Concluído');
      await field(/^Observações/).fill('Retorno confirmado');
      const updated = await submit('Salvar alterações', 'PUT', '/agendamentos/' + appointmentId, 200);
      const changed = await updated.json();
      expect(changed).toMatchObject({ dataHora: precise.toISOString(), status: 'CONCLUIDO',
        animal: { nome: 'Rex' }, servico: { nome: 'Banho' }, observacoes: 'Retorno confirmado' });
      await success(/Agendamento atualizado/);
      const completed = row('Rex').filter({
        has: page.getByRole('cell', { name: 'Concluído', exact: true }),
      });
      await completed.getByRole('button', { name: 'Editar agendamento' }).click();
      await select(/^Animal/, animal + ' — ' + tutor);
      await select(/^Serviço/, service);
      await field(/^Data e hora/).fill('2028-03-01T09:15');
      await field(/^Observações/).fill('');
      const restored = await submit('Salvar alterações', 'PUT', '/agendamentos/' + appointmentId, 200);
      expect(restored.request().postDataJSON()).toMatchObject({ animalId, servicoId: serviceId, observacoes: null,
        dataHora: suffix === 'notebook' ? '2028-03-01T09:15:00.000Z' : '2028-03-01T12:15:00.000Z' });
      await success(/Agendamento atualizado/);
      await page.reload();
      await expect(row(animal)).toContainText('Concluído');
      const search = page.getByRole('textbox', { name: 'Pesquisar agendamentos' });
      for (const term of [animal, tutor, service, 'concluído']) {
        await search.fill(term.toUpperCase());
        await expect(row(animal)).toBeVisible();
        await expect(row('Rex')).toHaveCount(0);
      }
      await search.fill('');
      await capture('agendamentos');
    });

    await step('Select desatualizado recebe conflito de FK no modal', async () => {
      const stale = await db.servico.create({ data: { nome: 'Temporário ' + suffix, duracaoMinutos: 15, precoCentavos: 1000 } });
      await page.reload();
      await expect(row(animal)).toBeVisible();
      await db.servico.delete({ where: { id: stale.id } });
      await page.getByRole('button', { name: 'Novo agendamento' }).click();
      await select(/^Animal/, animal + ' — ' + tutor);
      await select(/^Serviço/, stale.nome);
      await field(/^Data e hora/).fill('2028-03-02T09:15');
      await submit('Cadastrar', 'POST', '/agendamentos', 409);
      await expect(dialog.getByRole('alert')).toContainText('Serviço informado não encontrado');
      await button('Cancelar').click();
      await expect(dialog).toBeHidden();
    });

    await step('Banco confirma as quatro edições e vínculos', async () => {
      const stored = await db.agendamento.findUniqueOrThrow({
        where: { id: appointmentId }, include: { animal: { include: { tutor: true } }, servico: true },
      });
      expect(stored).toMatchObject({
        status: 'CONCLUIDO', observacoes: null,
        animal: { id: animalId, nome: animal, raca: 'Pastor', tutor: { id: tutorId, nome: tutor, telefone: '11988887777' } },
        servico: { id: serviceId, nome: service, precoCentavos: 8050, duracaoMinutos: 45 },
      });
      expect(stored.dataHora.toISOString()).toBe(suffix === 'notebook' ? '2028-03-01T09:15:00.000Z' : '2028-03-01T12:15:00.000Z');
    });

    await step('Falha de rede e recuperação em Serviços e Agendamentos', async () => {
      await recoverList('/servicos', 'Serviços', service);
      await recoverList('/agendamentos', 'Agendamentos', animal);
    });

    await step('Três exclusões restritas e remoção na ordem das dependências', async () => {
      const tutorDelete = { name: tutor, action: 'Excluir tutor', path: '/tutores/' + tutorId };
      const animalDelete = { name: animal, action: 'Excluir animal', path: '/animais/' + animalId };
      const serviceDelete = { name: service, action: 'Excluir serviço', path: '/servicos/' + serviceId };
      await open('/tutores', 'Tutores');
      await remove({ ...tutorDelete, conflict: true });
      await open('/animais', 'Animais');
      await remove({ ...animalDelete, conflict: true });
      await open('/servicos', 'Serviços');
      await remove({ ...serviceDelete, conflict: true });
      await open('/agendamentos', 'Agendamentos');
      await remove({ name: animal, action: 'Excluir agendamento', path: '/agendamentos/' + appointmentId });
      await open('/animais', 'Animais');
      await remove(animalDelete);
      await open('/tutores', 'Tutores');
      await remove(tutorDelete);
      await open('/servicos', 'Serviços');
      await remove(serviceDelete);
      await page.reload();
      await expect(row('Banho')).toBeVisible();
      await expect(row(service)).toHaveCount(0);
      const remaining = await Promise.all([
        db.agendamento.findUnique({ where: { id: appointmentId } }), db.animal.findUnique({ where: { id: animalId } }),
        db.tutor.findUnique({ where: { id: tutorId } }), db.servico.findUnique({ where: { id: serviceId } }),
      ]);
      expect(remaining).toEqual([null, null, null, null]);
    });

    await step('Logout protege quatro rotas e Swagger segue público', async () => {
      await page.getByRole('button', { name: 'Sair', exact: true }).click();
      await expect(page).toHaveURL(/\/login$/);
      for (const path of ['/servicos', '/agendamentos', '/tutores', '/animais']) {
        await page.goto(path);
        await expect(page).toHaveURL(/\/login$/);
      }
      await page.goto(api + '/docs/');
      await expect(page.getByRole('heading', { name: /^Pet Shop API/ })).toBeVisible();
      const spec = await page.request.get(api + '/docs/openapi.json');
      expect(spec.status()).toBe(200);
      const methods = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']);
      const operations = Object.values((await spec.json()).paths)
        .flatMap(pathItem => Object.keys(pathItem).filter(key => methods.has(key)));
      expect(operations).toHaveLength(22);
      await capture('swagger', false);
    });
    writeFileSync(info.outputPath('evidencias.json'), JSON.stringify({
      viewport: info.project.use.viewport, timezone: info.project.use.timezoneId, steps, requests, responses, failures,
    }, null, 2));
    expect(failures).toEqual([]);
  } finally {
    await db.$disconnect();
  }
});
