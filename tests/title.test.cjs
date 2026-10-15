const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, '..', 'content/title.js'), 'utf8');

function page(initialTitle, { headExists = true } = {}) {
  const observers = new Set();
  const pending = new Set();
  const root = {};
  let title = initialTitle;
  let writes = 0;
  const document = { documentElement: root, head: headExists ? {} : null };

  function mutate(target) {
    for (const observer of observers) {
      if (observer.target === target) pending.add(observer);
    }
  }

  Object.defineProperty(document, 'title', {
    get: () => title,
    set(value) {
      title = value;
      writes++;
      mutate(document.head);
    }
  });

  class MutationObserver {
    constructor(callback) { this.callback = callback; }
    observe(target) { this.target = target; observers.add(this); }
    disconnect() { observers.delete(this); pending.delete(this); }
  }

  function flush() {
    for (let turns = 0; pending.size; turns++) {
      assert.ok(turns < 10, 'title cleanup must not keep triggering itself');
      const batch = [...pending];
      pending.clear();
      batch.forEach(observer => observer.callback());
    }
  }

  vm.runInNewContext(source, { document, MutationObserver });
  flush();
  return {
    document,
    writes: () => writes,
    updateTitle(value) { document.title = value; flush(); },
    replaceHead(value) {
      document.head = {};
      title = value;
      mutate(root);
      flush();
    }
  };
}

test('removes the screenshot private-message prefix and stops rewriting', () => {
  const app = page('(4 封私信) 首页 - 知乎');
  assert.equal(app.document.title, '首页 - 知乎');
  assert.equal(app.writes(), 1);
});

test('supports full-width parentheses, spacing and large unread counts', () => {
  for (const title of ['（4封私信）首页 - 知乎', ' ( 99+ 封私信 ) 首页 - 知乎', '(1,024 封私信) 首页 - 知乎']) {
    assert.equal(page(title).document.title, '首页 - 知乎');
  }
});

test('keeps cleaning after unread-count updates and page navigation', () => {
  const app = page('(4 封私信) 首页 - 知乎');
  app.updateTitle('(5 封私信) 首页 - 知乎');
  assert.equal(app.document.title, '首页 - 知乎');
  app.updateTitle('(5 封私信) 一个问题 - 知乎');
  assert.equal(app.document.title, '一个问题 - 知乎');
  app.updateTitle('另一个问题 - 知乎');
  assert.equal(app.document.title, '另一个问题 - 知乎');
});

test('handles the head appearing after document_start and being replaced', () => {
  const app = page('', { headExists: false });
  app.replaceHead('(4 封私信) 首页 - 知乎');
  assert.equal(app.document.title, '首页 - 知乎');
  app.replaceHead('(6 封私信) 搜索 - 知乎');
  app.updateTitle('(7 封私信) 文章 - 知乎');
  assert.equal(app.document.title, '文章 - 知乎');
});

test('preserves normal titles, other notifications and title text mentioning messages', () => {
  for (const title of ['', '首页 - 知乎', '(2026) 阅读计划 - 知乎', '(2 条消息) 首页 - 知乎', '如何处理 (4 封私信)？- 知乎']) {
    const app = page(title);
    assert.equal(app.document.title, title);
    assert.equal(app.writes(), 0);
  }
});

test('runs at startup on all Zhihu routes without extending layout injection', () => {
  const manifest = JSON.parse(readFileSync(join(__dirname, '..', 'manifest.json'), 'utf8'));
  const scripts = manifest.content_scripts.filter(entry => entry.js?.includes('content/title.js'));
  assert.equal(scripts.length, 1);
  assert.deepEqual(scripts[0].matches, ['https://www.zhihu.com/*', 'https://zhuanlan.zhihu.com/*']);
  assert.equal(scripts[0].run_at, 'document_start');
  assert.equal(scripts[0].css, undefined);
});
