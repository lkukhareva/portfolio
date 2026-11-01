import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';
import { preview } from 'astro';

const root = new URL('../', import.meta.url);
const exec = promisify(execFile);
const deployments = [
  { name: 'custom domain', site: 'https://lizavetakuk.com', base: '' },
  { name: 'repository subpath', site: 'https://lkukhareva.github.io', base: '/portfolio' },
];

for (const { name, site, base } of deployments) {
  test(`Pages ${name}: build flags preserve page and asset URLs`, async t => {
    const outDir = await mkdtemp(join(tmpdir(), 'portfolio-pages-'));
    t.after(() => rm(outDir, { recursive: true, force: true }));
    // Exercise the same CLI flags used by the workflow, without replacing dist/.
    await exec(process.execPath, [
      fileURLToPath(new URL('node_modules/.bin/astro', root)),
      'build', '--site', site, '--base', base, '--outDir', outDir,
    ], { cwd: root, timeout: 30_000, env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' } });

    const server = await preview({
      root: fileURLToPath(root),
      outDir,
      site,
      base,
      logLevel: 'silent',
      server: { host: '127.0.0.1', port: 0 },
    });
    t.after(() => server.stop());
    const origin = `http://127.0.0.1:${server.port}`;
    const prefix = `${base}/`;
    const localTargets = new Set();

    for (const page of ['', 'index.html', 'about.html', 'work.html', 'impressum.html']) {
      const url = `${origin}${prefix}${page}`;
      const response = await fetch(url, { redirect: 'manual' });
      assert.equal(response.status, 200, url);
      const html = await response.text();
      assert.equal(html, await readFile(join(outDir, page || 'index.html'), 'utf8'));
      for (const [, ref] of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
        if (/^(?:https?:|mailto:|#)/.test(ref)) continue;
        const target = new URL(ref, url);
        assert.ok(target.pathname.startsWith(prefix), `${ref}: stays inside the Pages base path`);
        localTargets.add(target.href);
      }
    }

    for (const url of localTargets) {
      const response = await fetch(url, { redirect: 'manual' });
      assert.equal(response.status, 200, url);
      await response.arrayBuffer();
    }
    const missing = await fetch(`${origin}${prefix}not-a-page.html`, { redirect: 'manual' });
    assert.equal(missing.status, 404);
    await missing.arrayBuffer();
  });
}
