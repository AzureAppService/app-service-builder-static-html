import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { createConnection } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { setTimeout } from 'node:timers/promises';

test('README documentation links use the canonical docs host', async () => {
  const readme = await readFile(new URL('README.md', import.meta.url), 'utf8');
  assert.match(readme, /https:\/\/builder\.appservice\.azure\.com\/docs\//);
  assert.doesNotMatch(readme, /https:\/\/builderapps\.azure\.com\/docs(?:\/|\b)/);
});

test('the static manifest uses the default public URL mount', async () => {
  assert.equal(await readFile(new URL('builder.yaml', import.meta.url), 'utf8'),
    'components:\n  - name: site\n    role: static\n    output: public\n');
});

test('the showcase stays self-contained and respects color scheme preferences', async () => {
  const html = await readFile(new URL('public/index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /<(?:script\b[^>]*\bsrc=|link\b[^>]*\brel=["']stylesheet|img\b)/i);
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script, 'the inline theme setup is present');
  for (const [search, prefersDark, expected] of [
    ['', false, 'light'],
    ['', true, 'dark'],
    ['?scoutTheme=light', true, 'light'],
    ['?scoutTheme=dark', false, 'dark'],
  ]) {
    let actual;
    runInNewContext(script, {
      URLSearchParams,
      window: {
        location: { search },
        matchMedia: () => ({ matches: prefersDark }),
      },
      document: {
        documentElement: {
          setAttribute: (name, value) => {
            assert.equal(name, 'data-theme');
            actual = value;
          },
        },
      },
    });
    assert.equal(actual, expected);
  }
});

test('the static sample runs from an independent root', { timeout: 15000 }, async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'builder-static-html-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const path of ['builder.yaml', 'serve.mjs', 'public']) {
    await cp(new URL(path, import.meta.url), join(root, path), { recursive: true });
  }
  await new Promise((resolve, reject) => {
    const socket = createConnection({ host: '127.0.0.1', port: 8080 });
    socket.once('connect', () => {
      socket.destroy();
      reject(new Error('Port 8080 is in use; stop the local helper before testing.'));
    });
    socket.once('error', (error) => {
      if (error.code === 'ECONNREFUSED') resolve();
      else reject(error);
    });
  });

  const helper = spawn(process.execPath, ['serve.mjs'], {
    cwd: root,
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  let stderr = '';
  let spawnError;
  helper.stderr.setEncoding('utf8').on('data', (data) => { stderr += data; });
  helper.once('error', (error) => { spawnError = error; });
  t.after(async () => {
    if (helper.pid && helper.exitCode === null && helper.signalCode === null) {
      const exited = once(helper, 'exit');
      assert.ok(helper.kill('SIGTERM'), 'the owned helper must stop');
      await exited;
    }
  });

  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    await setTimeout(50);
    if (spawnError) throw spawnError;
    assert.equal(helper.exitCode, null, `Local helper exited: ${stderr}`);
    try {
      const response = await fetch('http://127.0.0.1:8080/', {
        signal: AbortSignal.timeout(1000),
      });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
      assert.equal(await response.text(), await readFile(join(root, 'public/index.html'), 'utf8'));
      ready = true;
      break;
    } catch (error) {
      if (error.cause?.code !== 'ECONNREFUSED') throw error;
    }
  }
  assert.ok(ready, `Local helper did not become ready: ${stderr}`);

  const health = await fetch('http://127.0.0.1:8080/health');
  assert.equal(health.status, 200);
  assert.equal(health.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.equal(await health.text(), 'OK\n');
  const html = await readFile(join(root, 'public/index.html'), 'utf8');
  assert.match(html, /App Service Builder \/ static-html/);
  assert.match(html, /Hello from a browser-ready static sample\./);
  assert.match(html, /data-health-path="\/health"/);
  assert.match(html, /id="health-status" role="status"/);

  for (const path of ['/missing', '/builder.yaml', '/serve.mjs']) {
    const response = await fetch(`http://127.0.0.1:8080${path}`);
    assert.equal(response.status, 404, path);
    assert.equal(await response.text(), 'Not found\n');
  }
});
