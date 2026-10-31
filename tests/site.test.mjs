import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(join(root, path), 'utf8');
const hash = value => createHash('sha256').update(value).digest('hex');
const pages = ['index.html', 'about.html', 'work.html', 'cv.html', 'impressum.html'];

// Fingerprints of the original copy and anchor destinations, before cleanup.
const original = {
  'index.html': ['353f80a6d5f26cd40069c4fbd6fc837ebff64f9a4fe0a51e1d5f0837bde5288b', '4d5a6a3c4ffa05edcc8ad73e17d89f811a2f92619f183420a4468cee56e4cd8c'],
  'about.html': ['811c0a5b59d4e13a0132549f0bcc375d315222baa29b775f97348f140a7d1a64', 'ffc94c94beddc2abf03bd958907d45e532fe798f3a395207becfb37fab9d8cb3'],
  'work.html': ['d5392118071b1f848c5b38b36ffe745dc2a236cd407de956fb8ad42ec0e176d9', '5f71c0bc83b57fdf071faf849425649382e25cb81b468ff5e2a1d49421878761'],
  'cv.html': ['d62fa444dcfe13a3b11c48253da74b3e0ea9f09c4814c29b6adf57b40bd70269', '02d71da434375def6c6e9e4fce5d2fbffaae9256d2b10f85237fbfd69960116e'],
  'impressum.html': ['a5a941876dd428406c06966d499b5df68c859182b701a492e9167b74ee7b1887', 'ffc94c94beddc2abf03bd958907d45e532fe798f3a395207becfb37fab9d8cb3'],
};

const originalImages = {
  'index.html': ['profile.jpeg', 'assets/section-arrow.svg', 'IFDindex.png', 'Hopappindex.png', 'Cloud9index.png'],
  'about.html': ['profile.jpeg', 'assets/section-arrow.svg', 'andersenoffice.jpg', 'classroom.jpg', 'Laptop.jpg'],
  'work.html': ['IFDwork.png', 'Hopappwork.png', 'Cloud9work.png', 'Rapuhawork.png'],
  'cv.html': ['CVimage.png'],
  'impressum.html': [],
};

function pageText(html) {
  return html
    .replace(/<head\b[\s\S]*?<\/head>/gi, '')
    .replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<h1 class="visually-hidden">[^<]*<\/h1>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

for (const page of pages) {
  const html = read(page).replace(/<!--[\s\S]*?-->/g, '');

  test(`${page}: original copy and link destinations are preserved`, () => {
    assert.equal(hash(pageText(html)), original[page][0]);
    const links = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map(m => decodeURI(m[1]));
    assert.equal(hash(JSON.stringify(links)), original[page][1]);
  });

  test(`${page}: document metadata and static navigation`, () => {
    assert.match(html, /<meta charset="utf-8">/);
    assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
    assert.match(html, /<link rel="icon" href="Logo.svg" type="image\/svg\+xml">/);
    assert.match(html, /<link rel="stylesheet" href="style.css">/);
    const nav = html.match(/<nav\b[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    assert.ok(nav, 'navigation exists');
    const current = [...nav.matchAll(/<a\b[^>]*aria-current="page"[^>]*>/g)];
    assert.equal(current.length, page === 'impressum.html' ? 0 : 1);
    if (current.length) assert.match(current[0][0], new RegExp(`href="${page.replace('.', '\\.')}"`));
    assert.doesNotMatch(html, /<script\b/, 'static navigation needs no script or clipboard handler');
  });

  test(`${page}: explicit, balanced structure and landmarks`, () => {
    // A strict nesting check for these simple, explicitly closed HTML documents,
    // not a general-purpose HTML validator (optional end tags are not supported).
    const stack = [];
    const voidTags = new Set(['meta', 'link', 'img', 'br', 'hr', 'input']);
    const markup = html.replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
    for (const match of markup.matchAll(/<(\/?)([a-z][\w-]*)\b[^>]*>/gi)) {
      const [, closing, tag] = match;
      if (closing) {
        assert.equal(stack.pop(), tag, `unexpected closing ${tag}`);
      } else if (!voidTags.has(tag)) {
        if (['header', 'main', 'footer'].includes(tag)) {
          assert.equal(stack.at(-1), 'body', `${tag} belongs directly inside body`);
        }
        stack.push(tag);
      }
    }
    assert.deepEqual(stack, [], 'all elements are closed');
    for (const tag of ['head', 'body', 'header', 'main', 'footer', 'h1']) {
      assert.equal([...markup.matchAll(new RegExp(`<${tag}\\b`, 'g'))].length, 1, `one ${tag}`);
    }
    assert.doesNotMatch(html, /<style\b/, 'page styles belong in external stylesheets');
  });

  test(`${page}: original imagery is preserved (the shared arrow is now local)`, () => {
    const sources = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(sources, originalImages[page]);
  });

  test(`${page}: images, assets, and new-tab links are safe`, () => {
    for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
      assert.match(tag, /\balt="[^"]*"/, 'every image has an alt attribute');
      assert.match(tag, /\bsrc="(?!https?:)[^"]+"/, 'images are local and have a src fallback');
      assert.doesNotMatch(tag, /\bsrcset=/, 'single images do not need srcset');
    }
    for (const [, content] of html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)) {
      if (!content.replace(/<[^>]+>/g, '').trim()) {
        assert.match(content, /\balt="[^"]+"/, 'image-only links need an accessible name');
      }
    }
    for (const [tag] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
      assert.match(tag, /\brel="[^"]*\bnoopener\b/, 'new tabs cannot control the opener');
    }
    for (const [, ref] of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
      if (/^(?:https?:|mailto:|#)/.test(ref)) continue;
      assert.ok(existsSync(join(root, decodeURI(ref))), `missing local asset: ${ref}`);
    }
    assert.doesNotMatch(html, /apiKey=|cdn\.builder\.io/, 'no third-party decoration request or embedded API key');
  });
}

test('CSS assets exist and known invalid declarations do not return', () => {
  const cssFiles = ['style.css', ...readdirSync(join(root, 'css')).filter(f => f.endsWith('.css')).map(f => `css/${f}`)];
  for (const file of cssFiles) {
    const css = read(file);
    assert.doesNotMatch(css, /var\([^)]*,\s*\)\s*#/);
    assert.doesNotMatch(css, /\d+x\s*;/);
    assert.doesNotMatch(css, /(?:display:\s*center|object-fit:\s*auto|justify-content:\s*flex\s*;|max-height:\s*auto)/);
    assert.equal([...css.matchAll(/{/g)].length, [...css.matchAll(/}/g)].length, `${file}: balanced blocks`);
    for (const [, ref] of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
      assert.ok(existsSync(join(root, dirname(file), ref)), `${file}: missing ${ref}`);
    }
  }
  assert.match(read('style.css'), /:focus-visible/);
  assert.match(read('style.css'), /prefers-reduced-motion/);
});
