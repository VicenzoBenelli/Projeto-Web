import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';

const requireBackend = createRequire(new URL('../../../api/package.json', import.meta.url));
const { PrismaClient } = requireBackend('@prisma/client');
const jwt = requireBackend('jsonwebtoken');

test('G05: jornada React, Axios e PostgreSQL real', async ({ page }, info) => {
  expect(new URL(process.env.DATABASE_URL).pathname).toBe(`/${process.env.PETSHOP_E2E_DATABASE}`);
  expect(process.env.PETSHOP_E2E_DATABASE).toMatch(/^petshop_e2e_[a-f0-9]{32}$/);
  const db = new PrismaClient();
  const suffix = info.project.name;
  const email = `g05-${suffix}@example.com`;
  const password = 'Senha@123';
  const ana = `Ana UI ${suffix}`, bruno = `Bruno UI ${suffix}`;
  const cpfAna = suffix === 'notebook' ? '77111111111' : '88111111111';
  const cpfBruno = suffix === 'notebook' ? '77222222222' : '88222222222';
  const tutoresUrl = `${process.env.E2E_API_URL}/tutores`;
  const errors = [], requests = [], responses = [], steps = [];
  let expectedNetworkFailure = false;
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/Failed to load resource: the server responded with a status of (400|401|409)/.test(text)) return;
    if (expectedNetworkFailure && /Failed to load resource|net::ERR_FAILED/.test(text)) return;
    errors.push({ message: text, path: message.location().url ? new URL(message.location().url).pathname : '' });
  });
  page.on('request', request => {
    if (request.url().startsWith(process.env.E2E_API_URL)) requests.push({ method: request.method(), path: new URL(request.url()).pathname });
  });
  page.on('response', response => {
    if (response.url().startsWith(process.env.E2E_API_URL)) responses.push({ path: new URL(response.url()).pathname, status: response.status() });
  });
  const step = async (name, action) => test.step(name, async () => { await action(); steps.push(name); });
  const dialog = () => page.getByRole('dialog');
  const row = (name) => page.getByRole('row').filter({ has: page.getByText(name, { exact: true }) });
  async function login() {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel(/^Senha/).fill(password);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page).toHaveURL(/\/home$/);
  }
  async function tutorForm(nome, cpf) {
    await dialog().getByLabel('Nome completo').fill(nome);
    await dialog().getByLabel(/^CPF/).fill(cpf);
    await dialog().getByLabel('Telefone').fill('11999999999');
  }
  async function chooseTutor(name, cpf) {
    await dialog().getByLabel('Tutor responsável').click();
    await dialog().getByLabel('Tutor responsável').fill(name);
    await page.getByRole('option', { name: `${name} — CPF ${cpf}`, exact: true }).click();
  }
  async function assertWidth() {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  try {
    await step('01 rota protegida sem sessão', async () => {
      await page.goto('/tutores'); await expect(page).toHaveURL(/\/login$/); await assertWidth();
    });
    await step('02 cadastro: Zod local não envia formulário inválido', async () => {
      await page.getByRole('link', { name: 'Criar conta', exact: true }).click();
      const count = requests.filter(r => r.method === 'POST' && r.path === '/auth/cadastro').length;
      await page.getByRole('button', { name: 'Cadastrar conta' }).click();
      await expect(page.getByText('Campo obrigatório').first()).toBeVisible();
      expect(requests.filter(r => r.method === 'POST' && r.path === '/auth/cadastro')).toHaveLength(count);
    });
    await step('03 cadastro válido e retorno ao login', async () => {
      await page.getByLabel(/^Nome/).fill(`Usuário ${suffix}`);
      await page.getByLabel('E-mail').fill(email); await page.getByLabel(/^Senha/).fill(password);
      const response = page.waitForResponse(r => r.url().endsWith('/auth/cadastro') && r.status() === 201);
      await page.getByRole('button', { name: 'Cadastrar conta' }).click(); await response;
      await expect(page).toHaveURL(/\/login$/); await expect(page.getByRole('status')).toContainText('Conta cadastrada');
    });
    await step('04 e-mail duplicado com 409 real', async () => {
      await page.getByRole('link', { name: 'Criar conta', exact: true }).click();
      await page.getByLabel(/^Nome/).fill('Duplicado'); await page.getByLabel('E-mail').fill(email);
      await page.getByLabel(/^Senha/).fill(password);
      await page.getByRole('button', { name: 'Cadastrar conta' }).click();
      await expect(page.getByRole('alert')).toContainText('já cadastrado');
      await page.getByRole('link', { name: /Já tenho conta/ }).click();
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByRole('heading', { name: 'PetCare', exact: true })).toBeVisible();
    });
    await step('05 login inválido e válido; sessão pública sem senha', async () => {
      await page.getByLabel('E-mail').fill(email); await page.getByLabel(/^Senha/).fill('Incorreta123');
      const rejected = page.waitForResponse(r => r.url().endsWith('/auth/login') && r.status() === 401);
      await page.getByRole('button', { name: 'Entrar', exact: true }).click();
      await rejected;
      await expect(page.getByRole('alert')).toContainText('E-mail ou senha inválidos');
      await login();
      const keys = await page.evaluate(() => Object.keys(JSON.parse(sessionStorage.getItem('petcare_usuario'))).sort());
      expect(keys).toEqual(['email', 'id', 'nome']); await assertWidth();
    });
    await step('06 refresh válido, navegação e menu mobile', async () => {
      await page.reload(); await expect(page.getByRole('heading', { name: 'Bem-vindo ao PetCare!' })).toBeVisible();
      if (suffix === 'mobile') await page.getByRole('button', { name: 'Abrir menu de navegação' }).click();
      await page.getByText('Tutores', { exact: true }).first().click();
      await expect(page).toHaveURL(/\/tutores$/);
      await expect(row('Tutor Demonstração')).toBeVisible();
    });
    await step('07 formulário Tutor: erros locais por campo, sem POST', async () => {
      await page.getByRole('button', { name: 'Novo tutor' }).click();
      await tutorForm(' ', '123');
      const count = requests.filter(r => r.method === 'POST' && r.path === '/tutores').length;
      await dialog().getByRole('button', { name: 'Cadastrar', exact: true }).click();
      await expect(dialog().getByText('O CPF deve conter exatamente 11 dígitos')).toBeVisible();
      expect(requests.filter(r => r.method === 'POST' && r.path === '/tutores')).toHaveLength(count);
    });
    await step('08 cadastrar Ana/Bruno e manter feedback após GET', async () => {
      await tutorForm(ana, cpfAna); await dialog().getByRole('button', { name: 'Cadastrar', exact: true }).click();
      await expect(row(ana)).toBeVisible(); await expect(page.getByRole('status')).toContainText('Tutor cadastrado com sucesso');
      await page.getByRole('button', { name: 'Novo tutor' }).click(); await tutorForm(bruno, cpfBruno);
      await dialog().getByRole('button', { name: 'Cadastrar', exact: true }).click(); await expect(row(bruno)).toBeVisible();
    });
    await step('09 pesquisa Ana exclui Bruno; CPF formatado e vazio', async () => {
      const search = page.getByRole('textbox', { name: 'Pesquisar tutores' });
      await search.fill('Ana'); await expect(row(ana)).toBeVisible(); await expect(row(bruno)).toHaveCount(0);
      await search.fill(cpfBruno.slice(0, 3) + '.' + cpfBruno.slice(3)); await expect(row(bruno)).toBeVisible(); await expect(row(ana)).toHaveCount(0);
      await search.fill('zzzz-sem-registro'); await expect(page.getByText('Nenhum tutor encontrado para essa pesquisa.')).toBeVisible();
      await search.fill('');
    });
    await step('10 editar Tutor no mesmo modal e persistir após refresh', async () => {
      await row(ana).getByRole('button', { name: 'Editar tutor', exact: true }).click();
      await dialog().getByLabel('Telefone').fill('11988887777');
      await dialog().getByRole('button', { name: 'Salvar alterações' }).click();
      await expect(row(ana)).toContainText('(11) 98888-7777');
      await expect(page.getByRole('status')).toContainText('Tutor atualizado com sucesso');
      await page.reload(); await expect(row(ana)).toContainText('(11) 98888-7777');
    });
    await step('11 CPF duplicado 409 e erro 400 real visíveis no modal', async () => {
      await page.getByRole('button', { name: 'Novo tutor' }).click(); await tutorForm('Duplicado UI', cpfAna);
      await dialog().getByRole('button', { name: 'Cadastrar', exact: true }).click();
      await expect(dialog().getByRole('alert')).toContainText('já cadastrado');
      // Injeta alteração no transporte para exercitar o 400 real do servidor,
      // separado do caso de validação local, que não envia dados inválidos.
      await page.route(tutoresUrl, async route => {
        if (route.request().method() === 'POST') await route.continue({ postData: JSON.stringify({ ...route.request().postDataJSON(), cpf: '123' }) });
        else await route.continue();
      });
      await tutorForm('Servidor 400', suffix === 'notebook' ? '77333333333' : '88333333333');
      await dialog().getByRole('button', { name: 'Cadastrar', exact: true }).click();
      await expect(dialog().getByText('O CPF deve conter exatamente 11 dígitos')).toBeVisible();
      await page.unroute(tutoresUrl); await dialog().getByRole('button', { name: 'Cancelar' }).click();
    });
    await step('12 exclusão Tutor bloqueada por Animal (409)', async () => {
      await row('Tutor Demonstração').getByRole('button', { name: 'Excluir tutor', exact: true }).click();
      await dialog().getByRole('button', { name: 'Excluir', exact: true }).click();
      await expect(dialog().getByRole('alert')).toContainText('vinculado');
      await dialog().getByRole('button', { name: 'Cancelar' }).click(); await expect(row('Tutor Demonstração')).toBeVisible();
      await expect(dialog()).toBeHidden();
      await page.getByRole('columnheader', { name: 'Nome', exact: true }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: info.outputPath('tutores.png'), fullPage: true, animations: 'disabled' }); await assertWidth();
    });
    const animalName = `Mel UI ${suffix}`, editedName = `Luna UI ${suffix}`;
    await step('13 lista Animais real, tutor público e select identificado', async () => {
      await page.goto('/animais'); await expect(row('Rex')).toContainText('Tutor Demonstração');
      await page.getByRole('button', { name: 'Novo animal' }).click();
      const count = requests.filter(r => r.method === 'POST' && r.path === '/animais').length;
      await dialog().getByRole('button', { name: 'Cadastrar', exact: true }).click();
      await expect(dialog().getByText('Informe um número positivo')).toBeVisible();
      expect(requests.filter(r => r.method === 'POST' && r.path === '/animais')).toHaveLength(count);
      await dialog().getByLabel('Nome do animal').fill(animalName); await chooseTutor(ana, cpfAna);
      const response = page.waitForResponse(r => r.url().endsWith('/animais') && r.request().method() === 'POST');
      await dialog().getByRole('button', { name: 'Cadastrar', exact: true }).click();
      const result = await response; expect(result.status()).toBe(201);
      expect(typeof result.request().postDataJSON().tutorId).toBe('number');
      await expect(row(animalName)).toContainText(ana); await expect(page.getByRole('status')).toContainText('Animal cadastrado');
    });
    await step('14 editar Animal e trocar tutor, persistir e pesquisar', async () => {
      await row(animalName).getByRole('button', { name: 'Editar animal', exact: true }).click();
      await dialog().getByLabel('Nome do animal').fill(editedName); await dialog().getByLabel(/^Raça/).fill('Persa');
      await chooseTutor(bruno, cpfBruno); await dialog().getByRole('button', { name: 'Salvar alterações' }).click();
      await expect(row(editedName)).toContainText(bruno); await page.reload(); await expect(row(editedName)).toContainText(bruno);
      const search = page.getByRole('textbox', { name: 'Pesquisar animais' });
      for (const term of ['Luna', bruno, 'Persa']) { await search.fill(term); await expect(row(editedName)).toBeVisible(); await expect(row('Rex')).toHaveCount(0); }
      await search.fill('zzzz-sem-animal'); await expect(page.getByText('Nenhum animal encontrado para essa pesquisa.')).toBeVisible();
      await search.fill(''); await page.screenshot({ path: info.outputPath('animais.png'), fullPage: true, animations: 'disabled' }); await assertWidth();
    });
    await step('15 select obsoleto: FK inexistente retorna 409 no modal', async () => {
      const stale = await db.tutor.create({ data: { nome: `Tutor removido ${suffix}`, cpf: suffix === 'notebook' ? '77999999999' : '88999999999', telefone: '11999999999' } });
      await page.reload(); await expect(row(editedName)).toBeVisible();
      await db.tutor.delete({ where: { id: stale.id } });
      await page.getByRole('button', { name: 'Novo animal' }).click(); await dialog().getByLabel('Nome do animal').fill('FK obsoleta');
      await chooseTutor(stale.nome, stale.cpf); await dialog().getByRole('button', { name: 'Cadastrar', exact: true }).click();
      await expect(dialog().getByRole('alert')).toContainText('Tutor informado não encontrado');
      await dialog().getByRole('button', { name: 'Cancelar' }).click();
    });
    await step('16 Animal com Agendamento bloqueia exclusão; Animal livre retorna 204', async () => {
      await row('Rex').getByRole('button', { name: 'Excluir animal', exact: true }).click(); await dialog().getByRole('button', { name: 'Excluir', exact: true }).click();
      await expect(dialog().getByRole('alert')).toContainText('vinculado'); await dialog().getByRole('button', { name: 'Cancelar' }).click();
      await row(editedName).getByRole('button', { name: 'Excluir animal', exact: true }).click();
      const removed = page.waitForResponse(r => r.request().method() === 'DELETE' && r.url().includes('/animais/'));
      await dialog().getByRole('button', { name: 'Excluir', exact: true }).click(); const result = await removed;
      expect(result.status()).toBe(204); expect(await result.body()).toHaveLength(0);
      await expect(row(editedName)).toHaveCount(0); await expect(page.getByRole('status')).toContainText('Animal excluído');
    });
    await step('17 confirmação e exclusão Tutor livre, 204 e persistência', async () => {
      await page.goto('/tutores'); await row(ana).getByRole('button', { name: 'Excluir tutor', exact: true }).click();
      await expect(dialog()).toContainText('Deseja realmente excluir');
      await dialog().getByRole('button', { name: 'Cancelar' }).click(); await expect(row(ana)).toBeVisible();
      await row(ana).getByRole('button', { name: 'Excluir tutor', exact: true }).click();
      const removed = page.waitForResponse(r => r.request().method() === 'DELETE' && r.url().includes('/tutores/'));
      await dialog().getByRole('button', { name: 'Excluir', exact: true }).click();
      const response = await removed; expect(response.status()).toBe(204); expect(await response.body()).toHaveLength(0);
      await expect(row(ana)).toHaveCount(0);
      await expect(page.getByRole('status')).toContainText('Tutor excluído'); await page.reload(); await expect(row(ana)).toHaveCount(0);
    });
    await step('18 loading e falha de rede em ambas as listas, sem perder sessão', async () => {
      for (const [entity, name] of [['tutores', bruno], ['animais', 'Rex']]) {
        const url = process.env.E2E_API_URL + '/' + entity;
        await page.route(url, async route => { await new Promise(r => setTimeout(r, 700)); await route.continue(); });
        await page.goto('/' + entity); await expect(page.getByText('Carregando ' + entity + '...')).toBeVisible();
        await expect(row(name)).toBeVisible(); await page.unroute(url);
        expectedNetworkFailure = true;
        await page.route(url, route => route.abort('failed')); await page.reload();
        await expect(page.getByRole('alert')).toContainText('Não foi possível conectar à API');
        if (entity === 'animais') await expect(page.getByText('Nenhum tutor cadastrado')).toHaveCount(0);
        await page.unroute(url); await page.reload(); await expect(row(name)).toBeVisible(); expectedNetworkFailure = false;
      }
      await page.goto('/tutores'); await expect(row(bruno)).toBeVisible();
    });
    await step('19 HTTP 401 global limpa a sessão, sem loop após reload', async () => {
      const user = await page.evaluate(() => JSON.parse(sessionStorage.getItem('petcare_usuario')));
      const invalid = jwt.sign({}, 'chave-invalida-apenas-fixture', { subject: String(user.id), issuer: 'petshop-api', expiresIn: '1h' });
      await page.evaluate(token => sessionStorage.setItem('petcare_token', token), invalid);
      const rejected = page.waitForResponse(r => r.url().endsWith('/tutores') && r.status() === 401);
      await page.reload(); await rejected; await expect(page).toHaveURL(/\/login$/);
      expect(await page.evaluate(() => Boolean(sessionStorage.getItem('petcare_token')))).toBe(false);
      expect(await page.evaluate(() => Boolean(sessionStorage.getItem('petcare_usuario')))).toBe(false);
      await page.reload(); await expect(page).toHaveURL(/\/login$/);
    });
    await step('20 expiração automática e logout consistente', async () => {
      await login();
      const user = await page.evaluate(() => JSON.parse(sessionStorage.getItem('petcare_usuario')));
      const short = jwt.sign({}, process.env.JWT_SECRET, { subject: String(user.id), issuer: 'petshop-api', expiresIn: 4 });
      await page.evaluate(token => sessionStorage.setItem('petcare_token', token), short); await page.goto('/home');
      await expect(page.getByRole('heading', { name: 'Bem-vindo ao PetCare!' })).toBeVisible();
      await expect(page).toHaveURL(/\/login$/, { timeout: 6000 });
      await login(); await page.getByRole('button', { name: 'Sair', exact: true }).click(); await expect(page).toHaveURL(/\/login$/);
      await page.goto('/animais'); await expect(page).toHaveURL(/\/login$/);
      expect(await page.evaluate(() => ['petcare_token', 'petcare_usuario'].map(key => sessionStorage.getItem(key) === null))).toEqual([true, true]);
    });
    writeFileSync(info.outputPath('evidencias.json'), JSON.stringify({ viewport: info.project.use.viewport, steps, requests, responses, unexpectedConsoleErrors: errors }, null, 2));
    expect(errors).toEqual([]);
  } catch (cause) {
      // Diagnóstico sem valores dos campos, corpos, headers ou tokens.
      console.info('G05 diagnóstico de falha:', JSON.stringify({
        path: new URL(page.url()).pathname,
        headings: await page.getByRole('heading').allTextContents(),
        alerts: await page.getByRole('alert').allTextContents(),
        inputs: await page.locator('input').evaluateAll(inputs => inputs.map(input => ({
          type: input.type, length: input.value.length, invalid: input.getAttribute('aria-invalid'),
        }))),
        requests: requests.slice(-8), responses: responses.slice(-8),
      }));
    throw cause;
  } finally { await db.$disconnect(); }
});
