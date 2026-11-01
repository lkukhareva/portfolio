import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

// Exercise the deployed HTML rather than Astro's source templates.
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const read = path => readFileSync(join(root, path), 'utf8');
const hash = value => createHash('sha256').update(value).digest('hex');
const pages = ['index.html', 'about.html', 'work.html', 'impressum.html'];

// Original copy and destinations, minus the intentionally removed CV links/CTA.
const baseline = {
  'index.html': ['ee89c302ea16ea9543e086e4aadd876f70e77166da15974516f0de550ce71a76', 'f12b37023af0eb5490d7b66a1f6f03742f4a8616fda12580ac21908714917aef'],
  'about.html': ['051dfba0f377e9235fa93b116493f6a3d2d1cb28c63a2337285da22b000916d8', '8f9f99982b9f10ba6bd65a4c501d50d884811ca362816f5664541df2689ffa1a'],
  'work.html': ['d7926037d7797ccf5f059562d8fa0730d66635c1d46f76c206ee8508016aa19e', 'bb58e8ccda76628b8c34c1b6286e97dde9b26447aac9c991ec974aab5c9921ca'],
  'impressum.html': ['4a74b6b173764657d54b2623a271fdd4460d0302293ca3a3c403dcbf2ffa9d7a', '8f9f99982b9f10ba6bd65a4c501d50d884811ca362816f5664541df2689ffa1a'],
};

const originalImages = {
  'index.html': ['profile.jpeg', 'assets/section-arrow.svg', 'IFDindex.png', 'Hopappindex.png', 'Cloud9index.png'],
  'about.html': ['profile.jpeg', 'assets/section-arrow.svg', 'andersenoffice.jpg', 'classroom.jpg', 'Laptop.jpg'],
  'work.html': ['IFDwork.png', 'Hopappwork.png', 'Cloud9work.png', 'Rapuhawork.png'],
  'impressum.html': [],
};

test('CV page, dedicated assets, and remaining page references are removed', () => {
  for (const path of ['cv.html', 'css/cv.css', 'CVimage.png', 'CV Lizaveta Kukharava Designer.pdf', 'CV Lizaveta Kukharava UX Designer.pdf']) {
    assert.equal(existsSync(join(root, path)), false, `${path} must be removed`);
  }
  for (const page of pages) {
    assert.doesNotMatch(read(page), /\bCV\b|CVimage|cv\.html/i, `${page} must not mention the removed CV`);
  }
});

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

  test(`${page}: copy and link destinations match the approved baseline`, () => {
    assert.equal(hash(pageText(html)), baseline[page][0]);
    const links = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map(m => decodeURI(m[1]));
    assert.equal(hash(JSON.stringify(links)), baseline[page][1]);
  });

  test(`${page}: document metadata and static navigation`, () => {
    assert.match(html, /<meta charset="utf-8">/);
    assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
    assert.match(html, /<link rel="icon" href="Logo.svg" type="image\/svg\+xml">/);
    const stylesheets = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m => m[1]);
    assert.deepEqual(stylesheets, ['style.css', `css/${page.replace('.html', '.css')}`], 'shared styles precede page overrides');
    const title = page === 'impressum.html'
      ? 'Lizaveta Kukharava | Impressum'
      : 'Lizaveta Kukharava, a Berlin-based UX Designer';
    assert.ok(html.includes(`<title>${title}</title>`));
    assert.match(html, /<meta name="description" content="If you care for your customers and users as much as I do, take a look at my portfolio and reach out to team up and transform your challenges into wins\.">/);
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
