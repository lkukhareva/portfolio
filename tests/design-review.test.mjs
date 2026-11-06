import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

// Regression checks for the mechanical fixes from the design review.
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const read = path => readFileSync(join(root, path), 'utf8');
const index = read('index.html');
const impressum = read('impressum.html');





test('skills are lists with explicit list semantics', () => {
  const about = index.match(/<section\b[^>]*id="about"[\s\S]*?<\/section>/)[0];
  const lists = [...about.matchAll(/<ul\b[^>]*>([\s\S]*?)<\/ul>/g)];
  assert.equal(lists.length, 2);
  assert.deepEqual(lists.map(([, items]) => items.match(/<li\b/g).length), [5, 5]);
  // list-style: none drops list semantics in WebKit unless the role is explicit.
  for (const [list] of lists) assert.match(list, /<ul\b[^>]*role="list"/);
});
