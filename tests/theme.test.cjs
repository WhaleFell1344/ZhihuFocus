const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const source = path => readFileSync(join(__dirname, '..', path), 'utf8');

function reader({ saved = {}, dark = false, delayRead = false } = {}) {
  const properties = new Map();
  const classes = new Set();
  const root = {
    dataset: {},
    style: {
      setProperty: (key, value) => properties.set(key, value),
      removeProperty: key => properties.delete(key)
    },
    classList: {
      toggle: (key, enabled) => enabled ? classes.add(key) : classes.delete(key),
      remove: key => classes.delete(key),
      contains: key => classes.has(key)
    }
  };
  const mediaListeners = [];
  const media = { matches: dark, addEventListener: (_, listener) => mediaListeners.push(listener) };
  let storageListener;
  let completeRead;
  let getCalls = 0;
  const context = vm.createContext({
    document: { documentElement: root, addEventListener() {} },
    window: {
      matchMedia: () => media,
      location: { hostname: 'www.zhihu.com', pathname: '/question/1' },
      scrollY: 0,
      addEventListener() {}
    },
    chrome: { storage: {
      sync: { get(defaults, callback) {
        getCalls++;
        const snapshot = { ...defaults, ...saved };
        completeRead = () => callback(snapshot);
        if (!delayRead) completeRead();
      } },
      onChanged: { addListener: listener => { storageListener = listener; } }
    } }
  });
  vm.runInContext(source('shared/theme.js'), context);
  vm.runInContext(source('content/focus.js'), context);
  return {
    root, properties, classes,
    getCalls: () => getCalls,
    completeRead: () => completeRead(),
    update(changes, area = 'sync') {
      storageListener(Object.fromEntries(Object.entries(changes)
        .map(([key, newValue]) => [key, { newValue }])), area);
    },
    systemDark(value) {
      media.matches = value;
      mediaListeners.forEach(listener => listener({ matches: value }));
    }
  };
}

test('first paint follows dark system before storage resolves', () => {
  const app = reader({ dark: true, delayRead: true });
  assert.equal(app.root.dataset.zfColorScheme, 'dark');
  assert.equal(app.properties.get('--zf-page-background'), '#15181D');
});

test('system events restore each selected palette and clear dark variables', () => {
  const app = reader({ saved: {
    readingLightBackground: 'warm', readingDarkBackground: 'dark-blue', readingWidth: 880
  } });
  assert.equal(app.root.dataset.zfReadingBackground, 'warm');
  app.systemDark(true);
  assert.equal(app.root.dataset.zfReadingBackground, 'dark-blue');
  assert.equal(app.properties.get('--zf-link'), '#83C8F4');
  app.systemDark(false);
  assert.equal(app.root.dataset.zfReadingBackground, 'warm');
  assert.equal(app.properties.has('--zf-link'), false);
  assert.equal(app.properties.get('--zf-content-width'), '880px');
  assert.equal(app.getCalls(), 1);
});

test('changing all three dark palettes works while dark mode stays enabled', () => {
  const app = reader({ dark: true });
  for (const [palette, color] of [
    ['dark-blue', '#101923'], ['dark-warm', '#1C1815'], ['dark', '#15181D']
  ]) {
    app.update({ readingDarkBackground: palette });
    assert.equal(app.root.dataset.zfReadingBackground, palette);
    assert.equal(app.properties.get('--zf-page-background'), color);
  }
});

test('legacy preferences are retained in their corresponding mode', () => {
  for (const palette of ['default', 'warm', 'gray', 'green', 'blue', 'lavender']) {
    const app = reader({ saved: { readingBackground: palette } });
    assert.equal(app.root.dataset.zfReadingBackground, palette);
    app.systemDark(true);
    assert.equal(app.root.dataset.zfReadingBackground, 'dark');
    app.systemDark(false);
    assert.equal(app.root.dataset.zfReadingBackground, palette);
  }
  for (const palette of ['dark', 'dark-blue', 'dark-warm']) {
    const app = reader({ saved: { readingBackground: palette }, dark: true });
    assert.equal(app.root.dataset.zfReadingBackground, palette);
    app.systemDark(false);
    assert.equal(app.root.dataset.zfReadingBackground, 'default');
    app.systemDark(true);
    assert.equal(app.root.dataset.zfReadingBackground, palette);
  }
});

test('fixed modes ignore system changes; returning to system applies current mode', () => {
  const app = reader({ saved: {
    readingColorMode: 'light', readingLightBackground: 'green',
    readingDarkBackground: 'dark-warm'
  } });
  app.systemDark(true);
  assert.equal(app.root.dataset.zfReadingBackground, 'green');
  assert.equal(app.properties.get('--zf-surface-background'), '#F2F6F0');
  app.update({ readingColorMode: 'system' });
  assert.equal(app.root.dataset.zfReadingBackground, 'dark-warm');
  app.update({ readingColorMode: 'dark' });
  app.systemDark(false);
  assert.equal(app.root.dataset.zfReadingBackground, 'dark-warm');
});

test('late startup read cannot overwrite newer theme or focus changes', () => {
  const app = reader({ dark: true, delayRead: true, saved: {
    readingDarkBackground: 'dark-blue', focusEnabled: true
  } });
  app.update({ readingDarkBackground: 'dark-warm', focusEnabled: false });
  app.completeRead();
  assert.equal(app.root.dataset.zfReadingBackground, 'dark-warm');
  assert.equal(app.classes.has('zhihu-focus-enabled'), false);
  assert.equal(app.getCalls(), 1);
});

test('sync preference removal falls back; unrelated storage does not affect the reader', () => {
  const app = reader({ dark: true, saved: { readingDarkBackground: 'dark-blue' } });
  app.update({ readingDarkBackground: 'dark-warm' }, 'local');
  assert.equal(app.root.dataset.zfReadingBackground, 'dark-blue');
  app.update({ readingDarkBackground: undefined });
  assert.equal(app.root.dataset.zfReadingBackground, 'dark');
});

test('disabled focus stays disabled across a system transition and can be restored', () => {
  const app = reader({ saved: { focusEnabled: false } });
  app.systemDark(true);
  assert.equal(app.classes.has('zhihu-focus-enabled'), false);
  app.update({ focusEnabled: true });
  assert.equal(app.classes.has('zhihu-focus-enabled'), true);
  assert.equal(app.root.dataset.zfColorScheme, 'dark');
});
