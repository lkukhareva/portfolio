import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { dev, preview } from 'astro';

const root = new URL('../', import.meta.url);
const pages = ['', 'index.html', 'about.html', 'work.html', 'impressum.html'];
const missing = [
  'not-a-page.html', 'not-a-page', 'cv.html', 'css/cv.css', 'CVimage.png',
  'CV Lizaveta Kukharava Designer.pdf', 'CV Lizaveta Kukharava UX Designer.pdf',
];

for (const [name, start] of [['development', dev], ['production preview', preview]]) {
  test(`${name}: original URLs, assets, and missing resources`, async t => {
    const server = await start({
      root: fileURLToPath(root),
      logLevel: 'silent',
      server: { host: '127.0.0.1', port: 0 },
      devToolbar: { enabled: false },
    });
    t.after(() => server.stop());
    const port = name === 'development' ? server.address.port : server.port;
    const base = `http://127.0.0.1:${port}/`;

    for (const path of pages) {
      await t.test(`serves /${path} directly`, async () => {
        const response = await fetch(new URL(path, base), { redirect: 'manual' });
        assert.equal(response.status, 200);
        assert.match(response.headers.get('content-type'), /text\/html/);
        const html = await response.text();
        assert.match(html, /<title>Lizaveta Kukharava/);
        if (name === 'development') {
          assert.match(html, /src="\/@vite\/client"/, 'development retains live updates');
        } else {
          assert.equal(html, await readFile(new URL(`dist/${path || 'index.html'}`, root), 'utf8'));
          assert.doesNotMatch(html, /<script\b/, 'deployed pages need no JavaScript');
        }
      });
    }

    for (const path of missing) {
      await t.test(`/${path} returns 404`, async () => {
        const response = await fetch(new URL(path, base), { redirect: 'manual' });
        assert.equal(response.status, 404);
        await response.arrayBuffer();
      });
    }

    for (const path of ['style.css', 'css/about.css', 'assets/section-arrow.svg', 'profile.jpeg']) {
      await t.test(`serves ${path} unchanged`, async () => {
        const response = await fetch(new URL(path, base));
        assert.equal(response.status, 200);
        assert.deepEqual(Buffer.from(await response.arrayBuffer()), await readFile(new URL(`public/${path}`, root)));
      });
    }
  });
}

for (const command of ['dev', 'preview']) {
  test(`${command}: CLI port override rejects an occupied port`, async t => {
    const occupied = createServer();
    occupied.listen(0, '127.0.0.1');
    await once(occupied, 'listening');
    t.after(() => new Promise(resolve => occupied.close(resolve)));

    const child = spawn(process.execPath, [
      fileURLToPath(new URL('node_modules/.bin/astro', root)),
      // Keep the test process in the foreground, including inside agent harnesses.
      command, '--ignore-lock', '--port', String(occupied.address().port),
    ], { cwd: root, env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' } });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { output += chunk; });
    const timeout = setTimeout(() => child.kill('SIGKILL'), 15_000);
    t.after(() => {
      clearTimeout(timeout);
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    });
    const [code] = await once(child, 'close');
    assert.equal(code, 1, output);
    assert.match(output, /already in use/, 'must fail instead of silently selecting another port');
  });
}
