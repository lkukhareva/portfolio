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
const mailto = '<a href="mailto:contact@lizavetakuk.com">contact@lizavetakuk.com</a>';

test('the contact email is a mailto link after the projects, in Impressum, and in the footer', () => {
  const work = index.match(/<section\b[^>]*id="work"[\s\S]*?<\/section>/)[0];
  // The large inline address may break after the @ rather than mid-domain.
  const workMailto = '<a href="mailto:contact@lizavetakuk.com">contact@<wbr>lizavetakuk.com</a>';
  assert.ok(work.includes(workMailto));
  assert.ok(work.indexOf(workMailto) > work.lastIndexOf('class="project-card"'), 'the ask follows the last case study');
  assert.ok(!index.match(/<section\b[^>]*id="about"[\s\S]*?<\/section>/)[0].includes(mailto), 'one inline ask, not two');
  assert.ok(impressum.match(/<main\b[\s\S]*?<\/main>/)[0].includes(mailto));
  for (const html of [index, impressum]) {
    const footer = html.match(/<footer\b[\s\S]*?<\/footer>/)[0];
    assert.match(footer, /<a href="mailto:contact@lizavetakuk\.com">Email<\/a>/);
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

test('project cards announce Behance and a new tab, and react to keyboard focus', () => {
  const cards = [...index.matchAll(/<a\b[^>]*target="_blank"[^>]*>([\s\S]*?)<\/a>/g)]
    .map(([, content]) => content).filter(content => content.includes('<h3'));
  assert.equal(cards.length, 4);
  for (const card of cards) {
    // A no-break space keeps the arrow with its word on narrow cards.
    assert.match(card, /Case study on Behance(?:&nbsp;|\u00a0)<span aria-hidden="true">↗<\/span>/);
    assert.match(card, /<span class="visually-hidden">\(opens in new tab\)<\/span>/);
  }
  // Any visible movement counts; the design picks the effect.
  assert.match(read('css/work.css'), /\.project-card:focus-visible\s*\{[^}]*transform:\s*(?!none\b)[^;}]+/);
});

test('touch, focus, and the fixed nav are accounted for on small screens', () => {
  const style = read('style.css');
  const work = read('css/work.css');
  // Hover lift is limited to devices that hover, so a tap cannot leave it stuck.
  const hoverBlock = work.match(/@media \(hover: hover\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  assert.match(hoverBlock, /\.project-card:hover/);
  assert.equal(work.match(/\.project-card:hover/g).length, 1, 'no hover rule outside the hover media query');
  // Focus keeps the card's corners instead of the generic link radius.
  assert.match(work, /\.project-card:focus-visible\s*\{[^}]*border-radius:\s*36px/);
  // Touch targets in the fixed nav reach 44px.
  const coarse = style.match(/@media \(pointer: coarse\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  assert.match(coarse, /nav a\s*\{[^}]*min-height:\s*(4[4-9]|[5-9]\d)px/);
  // Focused elements scroll clear of the pill, and the footer band runs under it.
  assert.match(style, /html\s*\{[^}]*scroll-padding-bottom:\s*\d+px/);
  assert.doesNotMatch(style.match(/body\s*\{[^}]*\}/)[0], /padding-bottom/);
});

test('skills are headed lists and project titles use sentence case', () => {
  const about = index.match(/<section\b[^>]*id="about"[\s\S]*?<\/section>/)[0];
  const lists = [...about.matchAll(/<ul\b[^>]*>([\s\S]*?)<\/ul>/g)];
  assert.equal(lists.length, 2);
  assert.deepEqual(lists.map(([, items]) => items.match(/<li\b/g).length), [5, 5]);
  // list-style: none drops list semantics in WebKit unless the role is explicit.
  for (const [list] of lists) assert.match(list, /<ul\b[^>]*role="list"/);
  // A visible heading names each group, so colour does not have to.
  assert.deepEqual([...about.matchAll(/<h3 class="skill-heading">([^<]+)<\/h3>\s*(?:<!--[\s\S]*?-->\s*)?<ul\b/g)].map(([, heading]) => heading), ['Soft skills', 'Hard skills']);
  const titles = [...index.matchAll(/<h3 class="project-title">([^<]+)<\/h3>/g)].map(([, title]) => title);
  assert.equal(titles.length, 4);
  for (const title of titles) assert.match(title, /^How I /);
});

test('copy is typographic, readable, and in story order', () => {
  const main = index.match(/<main\b[\s\S]*?<\/main>/)[0];
  // Quotations use curly marks only, never straight or entity quotes.
  for (const [, quote] of main.matchAll(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/g)) {
    assert.match(quote.trim(), /^“[\s\S]+”$/);
    assert.doesNotMatch(quote, /"|&quot;/);
  }
  // CSS lowercases display labels; the source keeps normal case for assistive technology.
  for (const [, heading] of main.matchAll(/<h2\b[^>]*>([^<]+)<\/h2>/g)) {
    assert.notEqual(heading, heading.toUpperCase(), `all-caps heading: ${heading}`);
  }
  const header = index.match(/<ul class="header-contacts"[\s\S]*?<\/ul>/)[0];
  assert.deepEqual([...header.matchAll(/<a\b[^>]*>([^<]+)<\/a>/g)].map(([, label]) => label), ['Email', 'LinkedIn', 'Behance']);
  // Stories run in life order: teaching, the IT company, then UX.
  assert.deepEqual([...main.matchAll(/<h2 class="story-title">([^<]+)<\/h2>/g)].map(([, title]) => title), [
    'Empathy and communication', 'Growth and improvement', 'Going the extra mile',
  ]);
});

test('the introduction offers a direct way to the work, without a second email ask', () => {
  const home = index.match(/<section\b[^>]*id="home"[\s\S]*?<\/section>/)[0];
  const links = [...home.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  assert.deepEqual(links.map(([, href]) => href), ['./#work']);
  assert.match(links[0][2], /^See my work(?:&nbsp;|\u00a0)<span aria-hidden="true">↓<\/span>$/);
  // All four case studies share one grid, so they can sit two to a row.
  const grid = index.match(/<div class="project-grid">([\s\S]*?)<\/div>\s*<p class="work-contact">/)[1];
  assert.equal(grid.match(/class="project-card"/g).length, 4);
});

test('her name leads the introduction, and the display face is preloaded', () => {
  const intro = index.match(/<div class="hero-intro">([\s\S]*?)<\/div>\s*<\/section>/)[1];
  // No eyebrow above the heading: the h1 opens the card and the tagline follows it.
  assert.match(intro, /^\s*<h1 class="hero-name">Lizaveta Kukharava<\/h1>\s*<p class="hero-tagline">Empathetic Designer: Meaningful Connections via Design<\/p>/);
  for (const html of [index, impressum]) {
    assert.match(html, /<link rel="preload" href="fonts\/bagel-fat-one\.woff2" as="font" type="font\/woff2" crossorigin>/);
  }
  // Fraunces ships upright only, so nothing may ask the browser to fake an italic.
  for (const sheet of ['style.css', 'css/index.css', 'css/about.css', 'css/work.css']) {
    assert.doesNotMatch(read(sheet), /font-style:\s*italic/, sheet);
  }
});

test('the hero bubble greets in five languages without a script', () => {
  const bubble = index.match(/<p class="hero-bubble">([\s\S]*?)<\/p>/)[1];
  assert.deepEqual([...bubble.matchAll(/<span lang="([a-z]+)">([^<]+)<\/span>/g)].map(([, lang, word]) => [lang, word]), [
    ['en', 'Hello'], ['ru', 'Привет'], ['de', 'Hallo'], ['be', 'Вітаю'], ['pl', 'Cześć'],
  ]);
  // Motion that starts on its own must stop within five seconds (WCAG 2.2.2).
  for (const sheet of ['style.css', 'css/index.css', 'css/about.css', 'css/work.css']) {
    assert.doesNotMatch(read(sheet), /\binfinite\b/, sheet);
  }
  const css = read('css/index.css');
  const seconds = value => Number.parseFloat(value);
  const wordLength = seconds(css.match(/\.hero-bubble span\s*\{[^}]*animation:\s*greeting\s+([\d.]+)s/)[1]);
  const lastDelay = Math.max(...[...css.matchAll(/\.hero-bubble span:nth-child\(\d\)\s*\{\s*animation-delay:\s*([\d.]+)s/g)].map(([, delay]) => seconds(delay)));
  const bookend = seconds(css.match(/\.hero-bubble span:first-child\s*\{[^}]*animation:\s*greeting-bookend\s+([\d.]+)s/)[1]);
  assert.ok(Math.max(lastDelay + wordLength, bookend) <= 5, 'the greeting settles within five seconds');
  // Without motion, the first greeting stays visible instead of none.
  assert.match(read('css/index.css'), /prefers-reduced-motion: reduce\)\s*\{\s*\.hero-bubble span:first-child\s*\{\s*opacity:\s*1/);
});
