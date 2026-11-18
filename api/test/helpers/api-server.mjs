import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { setTimeout } from 'node:timers/promises';

export async function startApi() {
  const reservation = createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const logs = [];
  const child = spawn(process.execPath, ['dist/server.js'], {
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  });
  child.stdout.on('data', chunk => logs.push(chunk.toString()));
  child.stderr.on('data', chunk => logs.push(chunk.toString()));
  const exited = once(child, 'exit');
  const stop = async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
    await exited;
    assert.equal(logs.join('').includes(process.env.JWT_SECRET), false, 'Segredo JWT apareceu nos logs');
    assert.equal(logs.join('').includes('Senha@123'), false, 'Senha apareceu nos logs');
  };
  const base = `http://127.0.0.1:${port}`;
  try {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      assert.equal(child.exitCode, null, 'API compilada encerrou durante a inicialização');
      try {
        const response = await fetch(base + '/health', { signal: AbortSignal.timeout(1000) });
        if (response.status === 200) {
          assert.deepEqual(await response.json(), { status: 'ok' });
          console.info('API compilada iniciada em processo próprio; /health 200.');
          return { base, stop };
        }
      } catch { /* Aguarda o socket do processo real ficar disponível. */ }
      await setTimeout(100);
    }
    throw new Error('API compilada não ficou disponível no prazo');
  } catch (error) {
    await stop();
    throw error;
  }
}
