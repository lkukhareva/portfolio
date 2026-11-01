import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../public/css/index.css', import.meta.url), 'utf8');
const desktopRule = selector => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rule = css.match(new RegExp(`^\\s*${escaped}\\s*\\{([^}]*)\\}`, 'm'))?.[1];
  assert.ok(rule, `${selector}: desktop rule exists`);
  return rule;
};

test('homepage intro aligns beside the portrait without fixed vertical offsets', () => {
  assert.match(desktopRule('#home .div-11'), /align-items:\s*center\s*;/);
  assert.match(desktopRule('#home .column-2'), /margin-top:\s*0\s*;/);
  assert.match(desktopRule('#home .div-12'), /margin-top:\s*0\s*;/);
});

test('homepage lead line sits above the portrait instead of covering it', () => {
  assert.doesNotMatch(desktopRule('#home .div-9'), /margin-bottom:\s*-/);
  assert.match(desktopRule('#home .div-9'), /margin-bottom:\s*16px/);
});

test('homepage hero retains the stacked mobile layout', () => {
  assert.match(css, /@media\s*\(max-width:\s*991px\)\s*\{\s*#home \.div-11\s*\{[^}]*flex-direction:\s*column\s*;[^}]*align-items:\s*stretch\s*;/);
});
