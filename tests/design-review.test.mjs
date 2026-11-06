import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

// Regression checks for the mechanical fixes from the design review.
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const read = path => readFileSync(join(root, path), 'utf8');
const index = read('index.html');
const impressum = read('impressum.html');
const mailto = '<a href="mailto:contact@lizaveta.co">contact@lizaveta.co</a>';

test('the contact email is a mailto link in About, Impressum, and the footer', () => {
  assert.ok(index.match(/<section\b[^>]*id="about"[\s\S]*?<\/section>/)[0].includes(mailto));
  assert.ok(impressum.match(/<main\b[\s\S]*?<\/main>/)[0].includes(mailto));
  for (const html of [index, impressum]) {
    const footer = html.match(/<footer\b[\s\S]*?<\/footer>/)[0];
    assert.match(footer, /<a href="mailto:contact@lizaveta\.co">Email<\/a>/);
  }
});

test('a skip link opens the body, ahead of every focusable element, and targets main', () => {
  for (const html of [index, impressum]) {
    const body = html.match(/<body>([\s\S]*)<\/body>/)[1];
    assert.match(body, /^\s*<a href="#main" class="skip-link">/);
    assert.match(body, /<main\b[^>]*\bid="main"/);
  }
  assert.match(read('style.css'), /\.skip-link\s*\{[^}]*top:\s*-100px/);
  assert.match(read('style.css'), /\.skip-link:focus\s*\{[^}]*top:\s*8px/);
});

test('content images are compressed and reserve their layout space', () => {
  assert.match(read('style.css'), /img\s*\{[^}]*height:\s*auto/);
  const photos = [...index.matchAll(/<img\b[^>]*>/g)].map(([tag]) => tag)
    .filter(tag => !tag.includes('section-arrow.svg'));
  assert.equal(photos.length, 8);
  for (const tag of photos) {
    assert.match(tag, /\bwidth="\d+" height="\d+"/, tag);
    const src = tag.match(/\bsrc="([^"]+)"/)[1];
    assert.ok(statSync(join(root, src)).size < 400_000, `${src} is under 400 KB`);
  }
});


test('skills are lists with explicit list semantics', () => {
  const about = index.match(/<section\b[^>]*id="about"[\s\S]*?<\/section>/)[0];
  const lists = [...about.matchAll(/<ul\b[^>]*>([\s\S]*?)<\/ul>/g)];
  assert.equal(lists.length, 2);
  assert.deepEqual(lists.map(([, items]) => items.match(/<li\b/g).length), [5, 5]);
  // list-style: none drops list semantics in WebKit unless the role is explicit.
  for (const [list] of lists) assert.match(list, /<ul\b[^>]*role="list"/);
});
