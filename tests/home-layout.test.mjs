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
  assert.match(desktopRule('.div-11'), /align-items:\s*center\s*;/);
  assert.match(desktopRule('.column-2'), /margin-top:\s*0\s*;/);
  assert.match(desktopRule('.div-12'), /margin-top:\s*0\s*;/);
});

test('homepage hero retains the stacked mobile layout', () => {
  assert.match(css, /@media\s*\(max-width:\s*991px\)\s*\{\s*\.div-11\s*\{[^}]*flex-direction:\s*column\s*;[^}]*align-items:\s*stretch\s*;/);
});
