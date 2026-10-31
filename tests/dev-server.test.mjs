import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createServer } from 'vite';

const root = new URL('../', import.meta.url);

test('local preview serves all pages and original assets with the live-update client', async t => {
  const server = await createServer({
    root: fileURLToPath(root),
    logLevel: 'silent',
    server: { host: '127.0.0.1', port: 0, strictPort: true, watch: null },
  });
  t.after(() => server.close());
  await server.listen();
  const base = server.resolvedUrls.local[0];

  for (const path of ['', 'index.html', 'about.html', 'work.html', 'cv.html', 'impressum.html']) {
    await t.test(`serves /${path}`, async () => {
      const response = await fetch(new URL(path, base));
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /text\/html/);
      const html = await response.text();
      assert.match(html, /<title>Lizaveta Kukharava/);
      assert.match(html, /src="\/@vite\/client"/, 'Vite supplies the live-update client');
    });
  }

  for (const path of ['style.css', 'css/about.css', 'assets/section-arrow.svg', 'profile.jpeg', 'CV Lizaveta Kukharava Designer.pdf']) {
    await t.test(`serves ${path} unchanged`, async () => {
      const response = await fetch(new URL(path, base), { headers: { Accept: 'text/css,*/*;q=0.1' } });
      assert.equal(response.status, 200);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), await readFile(new URL(path, root)));
    });
  }
});
