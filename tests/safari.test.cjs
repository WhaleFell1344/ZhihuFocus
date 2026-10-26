const assert = require('node:assert/strict');
const { existsSync, readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const root = join(__dirname, '..');
const resources = join(root, 'safari/ZhihuFocus/Shared (Extension)/Resources');
const read = path => readFileSync(path, 'utf8');
const manifest = JSON.parse(read(join(resources, 'manifest.json')));

test('Safari manifest preserves page coverage without unsupported include_globs', () => {
  const chromeManifest = JSON.parse(read(join(root, 'manifest.json')));
  const expected = structuredClone(chromeManifest);
  expected.content_scripts.forEach(script => {
    if (script.include_globs) {
      script.matches = script.include_globs;
      delete script.include_globs;
    }
  });
  assert.deepEqual(manifest, expected);
  assert.equal(JSON.stringify(manifest).includes('include_globs'), false);
  assert.ok(manifest.content_scripts.some(script =>
    script.matches.includes('https://www.zhihu.com/') &&
    script.matches.includes('https://www.zhihu.com/?*')));
});

test('Safari package contains every referenced script, stylesheet, icon and popup', () => {
  const paths = [...Object.values(manifest.icons), manifest.action.default_popup];
  manifest.content_scripts.forEach(script => paths.push(...(script.js || []), ...(script.css || [])));
  paths.forEach(path => assert.ok(existsSync(join(resources, path)), `missing ${path}`));
  const popup = join(resources, manifest.action.default_popup);
  for (const match of read(popup).matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert.ok(existsSync(join(popup, '..', match[1])), `missing popup resource ${match[1]}`);
  }
});

test('Safari sources stay in sync with Chrome except for local storage', () => {
  function compare(directory) {
    for (const item of readdirSync(join(root, directory), { withFileTypes: true })) {
      const relative = join(directory, item.name);
      if (item.isDirectory()) {
        compare(relative);
        continue;
      }
      let expected = readFileSync(join(root, relative));
      if (['content/focus.js', 'popup/popup.js'].includes(relative)) {
        expected = Buffer.from(expected.toString()
          .replaceAll('chrome.storage.sync', 'chrome.storage.local')
          .replaceAll("areaName !== 'sync'", "areaName !== 'local'"));
      }
      assert.deepEqual(readFileSync(join(resources, relative)), expected, `stale Safari resource: ${relative}`);
    }
  }
  ['content', 'popup', 'shared', 'icons'].forEach(compare);
});
