import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const baseline = JSON.parse(readFileSync(new URL('fixtures/pre-migration.json', import.meta.url), 'utf8'));
const hash = value => createHash('sha256').update(value).digest('hex');
// Ignore formatting and equivalent text entities, not elements, attributes, or copy.
const normalize = html => html
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/>\s+</g, '><')
  .replace(/\s+/g, ' ')
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, '&')
  .trim();

for (const [page, expected] of Object.entries(baseline.bodies)) {
  test(`${page}: generated body preserves the pre-migration layout and content`, () => {
    const html = readFileSync(new URL(`dist/${page}`, root), 'utf8');
    const body = html.match(/<body>([\s\S]*?)<\/body>/)?.[1];
    assert.ok(body, 'generated body exists');
    assert.equal(hash(normalize(body)), expected);
  });
}

// Start from original assets; update only affected hashes for intentional fixes.
for (const [asset, expected] of Object.entries(baseline.assets)) {
  test(`${asset}: static build preserves the approved asset bytes`, () => {
    assert.equal(hash(readFileSync(new URL(`dist/${asset}`, root))), expected);
  });
}

test('static output has exactly the original pages and no application JavaScript', () => {
  const files = readdirSync(new URL('dist/', root), { recursive: true });
  assert.deepEqual(files.filter(file => file.endsWith('.html')).sort(), Object.keys(baseline.bodies).sort());
  assert.deepEqual(files.filter(file => /\.(?:[cm]?js|map)$/.test(file)), []);
});
