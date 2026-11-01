import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/scroll-nav.js', import.meta.url), 'utf8');

function link(href) {
  const attrs = { href };
  return {
    getAttribute: name => attrs[name] ?? null,
    setAttribute: (name, value) => { attrs[name] = String(value); },
    removeAttribute: name => { delete attrs[name]; },
    get current() { return attrs['aria-current']; },
  };
}

function start({ width, height, rects = {} }) {
  const observers = [];
  const listeners = {};
  class IntersectionObserver {
    constructor(callback, options) {
      this.callback = callback;
      this.rootMargin = options.rootMargin;
      this.targets = [];
      observers.push(this);
    }
    observe(target) { this.targets.push(target); }
    disconnect() { this.disconnected = true; }
  }
  const boxes = {
    home: { top: 0, bottom: 500 },
    about: { top: 500, bottom: 1200 },
    work: { top: 1200, bottom: 2000 },
    ...rects,
  };
  const sections = Object.fromEntries(['home', 'about', 'work'].map(id => [id, {
    id,
    getBoundingClientRect: () => boxes[id],
  }]));
  const links = [link('./#home'), link('./#about'), link('./#work')];
  const document = {
    querySelector: selector => selector === 'nav[aria-label="Primary"]'
      ? { querySelectorAll: () => links }
      : null,
    getElementById: id => sections[id] ?? null,
  };
  const window = {
    innerWidth: width,
    innerHeight: height,
    IntersectionObserver,
    addEventListener: (type, fn) => { listeners[type] = fn; },
  };
  vm.runInNewContext(source, { document, window, IntersectionObserver });
  return { observers, listeners, links, window };
}

function bandHeight(margin, height) {
  assert.doesNotMatch(margin, /%/, margin);
  const [top, , bottom] = margin.split(/\s+/).map(part => Math.abs(Number.parseFloat(part)));
  return height - top - bottom;
}

test('observation band uses viewport height and cannot collapse on a wide screen', () => {
  const wide = start({ width: 1440, height: 800 });
  const wider = start({ width: 2000, height: 800 });
  assert.equal(wide.observers.length, 1);
  assert.equal(wide.observers[0].rootMargin, wider.observers[0].rootMargin);
  assert.ok(bandHeight(wide.observers[0].rootMargin, 800) > 0);

  const short = start({ width: 1440, height: 120 });
  assert.ok(bandHeight(short.observers[0].rootMargin, 120) > 0);
});

test('resize rebuilds the band from the new viewport height', () => {
  const page = start({ width: 1440, height: 800 });
  const first = page.observers[0];
  page.window.innerHeight = 500;
  page.listeners.resize();
  assert.equal(first.disconnected, true);
  assert.equal(page.observers.length, 2);
  assert.notEqual(page.observers[1].rootMargin, first.rootMargin);
  assert.ok(bandHeight(page.observers[1].rootMargin, 500) > 0);
});

test('the visible section is current, and the previous section is cleared', () => {
  const page = start({ width: 1280, height: 800 });
  const observer = page.observers[0];
  const entry = (id, isIntersecting) => ({ target: { id }, isIntersecting });

  observer.callback([entry('home', true)]);
  assert.equal(page.links[0].current, 'true');
  assert.equal(page.links[1].current, undefined);
  assert.equal(page.links[2].current, undefined);

  observer.callback([entry('home', false), entry('about', true)]);
  assert.equal(page.links[0].current, undefined);
  assert.equal(page.links[1].current, 'true');
  assert.equal(page.links[2].current, undefined);
});

test('an anchor landing on the activation line selects the section that reached it', () => {
  const page = start({
    width: 1440,
    height: 800,
    rects: {
      home: { top: 0, bottom: 96 },
      about: { top: 96, bottom: 900 },
      work: { top: 900, bottom: 1800 },
    },
  });
  page.observers[0].callback([
    { target: { id: 'home' }, isIntersecting: true },
    { target: { id: 'about' }, isIntersecting: true },
  ]);
  assert.equal(page.links[0].current, undefined);
  assert.equal(page.links[1].current, 'true');
  assert.equal(page.links[2].current, undefined);
});

test('a later section still below the activation line does not become current', () => {
  const page = start({
    width: 1440,
    height: 800,
    rects: {
      home: { top: -200, bottom: 400 },
      about: { top: 400, bottom: 900 },
    },
  });
  page.observers[0].callback([
    { target: { id: 'home' }, isIntersecting: true },
    { target: { id: 'about' }, isIntersecting: true },
  ]);
  assert.equal(page.links[0].current, 'true');
  assert.equal(page.links[1].current, undefined);
});
