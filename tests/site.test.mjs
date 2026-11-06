import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

// Exercise the deployed HTML rather than Astro's source templates.
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const read = path => readFileSync(join(root, path), 'utf8');
const pages = ['index.html', 'about.html', 'work.html', 'impressum.html'];
const portfolioCopy = [
  'Empathetic Designer: Meaningful Connections via Design',
  'lizaveta kukharava',
  'A growth-oriented professional with a passion for enhancing',
  'Thrive on driving initiatives that foster innovation, improve',
  'Excel in dynamic environments, contributing to meaningful change',
  'Lizaveta is tactful in communicating with clients and colleagues',
  'She displayed strong professionalism, patience with others and',
  'Liza was a pleasure to work with',
  'what i bring to the table',
  'Known for my easy-going nature, non-conflict attitude, and can-do',
  'Communication',
  'Active Listening',
  'Attention to Detail',
  'Problem Solving',
  'Presentation Skills',
  'UX Research',
  'Wireframing & Prototyping',
  'Content Design',
  'Coding basics',
  'Analytical thinking',
  'Growth and improvement',
  'Empathy and communication',
  'Going extra mile',
  'contact@lizaveta.co',
  'RECENT PROJECTS',
  'How I redesigned a fashion contest site',
  'Improving consistency and content structure',
  'How I redesigned a travel app',
  'Simplifying the design to reduce overload',
  'How I created a niche weather app',
  'Making days on the water safe and fun',
  'How I created a visual identity for dev team',
  'Helping a team stand out and present values',
];
const behance = [
  'https://www.behance.net/gallery/216457395/International-Fashion-Show-Website-Redesign',
  'https://www.behance.net/gallery/163104401/Hop-App-UIUX-Case-Study',
  'https://www.behance.net/gallery/142352791/Cloud-9-app-UX-Case-Study',
  'https://www.behance.net/gallery/170639797/Rapuha-Brand-Design',
];
const portfolioImages = [
  'profile.webp',
  'assets/section-arrow.svg',
  'andersenoffice.jpg',
  'classroom.webp',
  'Laptop.webp',
  'assets/section-arrow.svg',
  'IFDwork.webp',
  'Hopappwork.webp',
  'Cloud9work.webp',
  'Rapuhawork.webp',
];

function pageText(html) {
  return html
    .replace(/<head\b[\s\S]*?<\/head>/gi, '')
    .replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function assertBalanced(html) {
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
}

function assertSafeAssets(html) {
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
    if (/^(?:https?:|mailto:|#|\.\/#)/.test(ref)) continue;
    assert.ok(existsSync(join(root, decodeURI(ref))), `missing local asset: ${ref}`);
  }
  assert.doesNotMatch(html, /apiKey=|cdn\.builder\.io/, 'no third-party decoration request or embedded API key');
}

test('index.html is one scrolling portfolio with hash navigation', () => {
  const html = read('index.html').replace(/<!--[\s\S]*?-->/g, '');
  const text = pageText(html);
  for (const copy of portfolioCopy) assert.ok(text.includes(copy), `missing copy: ${copy}`);
  const ids = [...html.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(ids, ['home', 'about', 'work']);
  assert.match(html, /<section\b[^>]*id="home"[^>]*aria-label="Home"/);
  assert.match(html, /<section\b[^>]*id="about"[^>]*aria-label="About"/);
  assert.match(html, /<section\b[^>]*id="work"[^>]*aria-label="Work"/);

  const headings = [...html.matchAll(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/g)].map(([, level, content]) => [level, content.replace(/<[^>]+>/g, '').trim()]);
  assert.deepEqual(headings.filter(([level]) => level === '1'), [['1', 'lizaveta kukharava']]);
  assert.ok(headings.some(([level, content]) => level === '2' && content === 'what i bring to the table'));
  assert.ok(headings.some(([level, content]) => level === '2' && content === 'RECENT PROJECTS'));
  assert.deepEqual(headings.filter(([level]) => level === '3').map(([, content]) => content), [
    'How I redesigned a fashion contest site',
    'How I redesigned a travel app',
    'How I created a niche weather app',
    'How I created a visual identity for dev team',
  ]);

  const nav = html.match(/<nav\b[^>]*>([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(nav, 'navigation exists');
  assert.deepEqual([...nav.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map(match => [match[1], match[2]]), [
    ['./#home', 'Home'],
    ['./#about', 'About'],
    ['./#work', 'Work'],
  ]);
  assert.doesNotMatch(nav, /aria-current/, 'the visible section is marked by script, not baked into the HTML');
  assert.doesNotMatch(html, /index\.html#/);

  const stylesheets = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(match => match[1]);
  assert.deepEqual(stylesheets, ['style.css', 'css/index.css', 'css/about.css', 'css/work.css']);
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)].map(match => match[1]);
  assert.deepEqual(scripts, ['scroll-nav.js']);
  assert.equal([...html.matchAll(/<script\b/g)].length, 1);
  assert.doesNotMatch(read('scroll-nav.js'), /location|history|replaceState|pushState/, 'scrolling must not rewrite the URL');

  const sources = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(sources, portfolioImages);
  const links = [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map(match => decodeURI(match[1]));
  for (const href of behance) assert.ok(links.includes(href), href);
  assert.ok(links.includes('impressum.html'));
  assertBalanced(html);
  assertSafeAssets(html);
  assert.match(html, /<title>Lizaveta Kukharava, a Berlin-based UX Designer<\/title>/);
  assert.doesNotMatch(html, /<style\b/);
});

for (const [page, hash, label] of [['about.html', 'about', 'About'], ['work.html', 'work', 'Work']]) {
  test(`${page} jumps to /#${hash} without leaving index.html in the address bar`, () => {
    const html = read(page);
    assert.match(html, /<meta charset="utf-8">/);
    assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
    assert.match(html, new RegExp(`<link rel="canonical" href="\\./#${hash}">`));
    assert.match(html, new RegExp(`<meta http-equiv="refresh" content="0; url=\\./#${hash}">`));
    assert.match(html, new RegExp(`<script>location\\.replace\\("\\./#${hash}"\\)</script>`));
    assert.match(html, new RegExp(`<a href="\\./#${hash}">${label}</a>`));
    assert.doesNotMatch(html, /index\.html#/);
    assert.equal([...html.matchAll(/<script\b/g)].length, 1);
    assertBalanced(html);
    assertSafeAssets(html);
  });
}

test('impressum stays a separate page and links back to the scroll sections', () => {
  const html = read('impressum.html').replace(/<!--[\s\S]*?-->/g, '');
  const text = pageText(html);
  for (const copy of ['Impressum', 'Angaben gemaess § 5 TMG', 'Lizaveta Kukharava, Berlin', 'contact@lizaveta.co', 'Haftung fuer Inhalte', 'Haftung fuer Links']) {
    assert.ok(text.includes(copy), `missing impressum copy: ${copy}`);
  }
  const nav = html.match(/<nav\b[^>]*>([\s\S]*?)<\/nav>/)?.[1];
  assert.deepEqual([...nav.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map(match => [match[1], match[2]]), [
    ['./#home', 'Home'],
    ['./#about', 'About'],
    ['./#work', 'Work'],
  ]);
  assert.doesNotMatch(nav, /aria-current/);
  assert.match(html, /<a href="impressum\.html" aria-current="page">Impressum<\/a>/);
  assert.doesNotMatch(html, /<script\b/);
  assert.doesNotMatch(html, /index\.html#/);
  const stylesheets = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(match => match[1]);
  assert.deepEqual(stylesheets, ['style.css', 'css/impressum.css']);
  assert.match(html, /<title>Lizaveta Kukharava \| Impressum<\/title>/);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
  assertBalanced(html);
  assertSafeAssets(html);
});

test('static output publishes only the four pages and the scroll-navigation script', () => {
  const files = readdirSync(root, { recursive: true });
  assert.deepEqual(files.filter(file => file.endsWith('.html')).sort(), [...pages].sort());
  assert.deepEqual(files.filter(file => /\.(?:[cm]?js|map)$/.test(file)), ['scroll-nav.js']);
});

test('markup and styles use named components, not exported div-N/column-N/img-N classes', () => {
  const generated = /^(?:div|column|img)(?:-\d+)?$/;
  for (const page of pages) {
    for (const [, classes] of read(page).matchAll(/\bclass="([^"]+)"/g)) {
      for (const name of classes.split(/\s+/)) assert.doesNotMatch(name, generated, `${page}: class="${classes}"`);
    }
  }
  for (const file of ['style.css', 'css/index.css', 'css/about.css', 'css/work.css', 'css/impressum.css']) {
    assert.doesNotMatch(read(file), /\.(?:div|column|img)(?:-\d+)?(?![\w-])/, file);
  }
});
