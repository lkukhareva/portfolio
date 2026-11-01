import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = () => readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');

test('Pages deployment runs only on master pushes or manual dispatch', () => {
  const yaml = workflow();
  assert.match(yaml, /on:\s*\n  push:\s*\n    branches: \[master\]\s*\n  workflow_dispatch:/);
  assert.doesNotMatch(yaml, /pull_request|pull_request_target/);
  assert.match(yaml, /if: github\.ref == 'refs\/heads\/master'/);
  assert.match(yaml, /concurrency:\s*\n  group: pages\s*\n  cancel-in-progress: true/);
});

test('Pages deployment validates before building and uploading the configured Pages URL', () => {
  const yaml = workflow();
  const commands = ['npm ci', 'npm run check', 'npm test', 'npm run build -- --site "$PAGES_ORIGIN" --base "$PAGES_BASE_PATH"'];
  let previous = -1;
  for (const command of commands) {
    const index = yaml.indexOf(`run: ${command}`);
    assert.ok(index > previous, `${command}: present in order`);
    previous = index;
  }
  assert.ok(yaml.indexOf('uses: actions/upload-pages-artifact@') > previous, 'upload follows the final build');
  assert.ok(yaml.indexOf('uses: actions/deploy-pages@') > yaml.indexOf('uses: actions/upload-pages-artifact@'), 'deploy follows upload');
  assert.match(yaml, /node-version: '24'/);
  assert.match(yaml, /PAGES_ORIGIN: \$\{\{ steps\.pages\.outputs\.origin \}\}/);
  assert.match(yaml, /PAGES_BASE_PATH: \$\{\{ steps\.pages\.outputs\.base_path \}\}/);
  assert.match(yaml, /uses: actions\/upload-pages-artifact@[a-f0-9]{40}[^\n]*\n\s+with:\s*\n\s+path: dist/);
});

test('Pages deployment uses scoped permissions, protected environment, and pinned actions', () => {
  const yaml = workflow();
  assert.match(yaml, /\npermissions: \{\}/);
  assert.match(yaml, /permissions:\s*\n      contents: read\s*\n      pages: write\s*\n      id-token: write/);
  assert.match(yaml, /environment:\s*\n      name: github-pages\s*\n      url: \$\{\{ steps\.deploy\.outputs\.page_url \}\}/);
  const actions = [...yaml.matchAll(/uses: ([^\s]+)/g)];
  assert.equal(actions.length, 5);
  for (const [, action] of actions) assert.match(action, /^actions\/[\w-]+@[a-f0-9]{40}$/);
  assert.match(yaml, /persist-credentials: false/);
});
