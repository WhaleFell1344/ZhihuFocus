const FOCUS_CLASS = 'zhihu-focus-enabled';
const HEADER_HIDDEN_CLASS = 'zhihu-focus-header-hidden';
const DEFAULT_SETTINGS = {
  focusEnabled: true,
  readingBackground: 'default',
  readingFontFamily: 'default',
  readingFontSize: 16,
  readingLineHeight: 1.7,
  readingParagraphSpacing: 0.6,
  readingWidth: 780
};
const BACKGROUND_COLORS = {
  default: null,
  warm: {
    page: '#F1EDE4',
    surface: '#F8F4EB'
  },
  gray: {
    page: '#E9ECEF',
    surface: '#F3F4F5'
  },
  green: {
    page: '#E8EFE6',
    surface: '#F2F6F0'
  },
  blue: {
    page: '#E8EEF4',
    surface: '#F2F6FA'
  },
  lavender: {
    page: '#EEEAF2',
    surface: '#F7F4F9'
  },
  dark: {
    page: '#15181D',
    surface: '#20242B'
  },
  'dark-blue': {
    page: '#101923',
    surface: '#192735'
  },
  'dark-warm': {
    page: '#1C1815',
    surface: '#29231E'
  }
};
const DARK_THEME_COLORS = {
  dark: {
    text: '#E2E6ED', secondary: '#AEB7C4', link: '#85B9FF', border: '#414B59',
    accent: '#283B53', accentBorder: '#45678F', solid: '#286BBA',
    hover: '#304560', heading: '#91CDA5'
  },
  'dark-blue': {
    text: '#DEE9F3', secondary: '#A8BDCF', link: '#83C8F4', border: '#39546B',
    accent: '#223F55', accentBorder: '#417594', solid: '#216E9F',
    hover: '#2B4A63', heading: '#8FD2C4'
  },
  'dark-warm': {
    text: '#ECE3D6', secondary: '#C2AF9A', link: '#E8BB86', border: '#5C4D40',
    accent: '#463629', accentBorder: '#886747', solid: '#855B32',
    hover: '#514030', heading: '#BACA97'
  }
};
const BACKGROUNDS = new Set(Object.keys(BACKGROUND_COLORS));
const FONT_FAMILIES = {
  default: null,
  sans: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
  serif: '"Songti SC", "STSong", "SimSun", serif',
  kai: '"Kaiti SC", "STKaiti", "KaiTi", serif'
};
const FONT_FAMILY_NAMES = new Set(Object.keys(FONT_FAMILIES));
const IS_ZHIHU =
  window.location.hostname === 'www.zhihu.com' ||
  window.location.hostname === 'zhuanlan.zhihu.com';
const IS_ZHIHU_HOME =
  window.location.hostname === 'www.zhihu.com' && window.location.pathname === '/';
const IS_ZHIHU_NON_HOME = IS_ZHIHU && !IS_ZHIHU_HOME;
const IS_DOUBAN_HOME =
  window.location.hostname === 'www.douban.com' && window.location.pathname === '/';
const IS_DOUBAN = window.location.hostname.endsWith('.douban.com');
let lastScrollY = window.scrollY;

function getZhihuFeedSignature() {
  const firstItem = document.querySelector('.Topstory-mainColumn .TopstoryItem');
  const title = firstItem?.querySelector('h2 a')?.getAttribute('href') || '';
  const itemId = firstItem?.getAttribute('data-za-detail-view-id') || '';

  return `${itemId}|${title}|${firstItem?.textContent?.slice(0, 80) || ''}`;
}

function refreshZhihuHomeFeed(button) {
  const recommendationLink = document.querySelector(
    ".TopstoryHeader a[href='https://www.zhihu.com/'], a.is-active[href='https://www.zhihu.com/']"
  );

  if (!recommendationLink || button.disabled) {
    return;
  }

  const previousSignature = getZhihuFeedSignature();
  let checks = 0;

  button.disabled = true;
  button.classList.add('is-refreshing');
  recommendationLink.click();

  const completionCheck = window.setInterval(() => {
    checks += 1;
    const feedChanged = getZhihuFeedSignature() !== previousSignature;

    if (!feedChanged && checks < 25) {
      return;
    }

    window.clearInterval(completionCheck);
    button.disabled = false;
    button.classList.remove('is-refreshing');

    if (feedChanged) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, 200);
}

function initializeZhihuHomeRefresh() {
  let attempts = 0;

  function applyWhenReady() {
    attempts += 1;
    const mainColumn = document.querySelector('.Topstory-mainColumn');

    if (!mainColumn && attempts < 30) {
      window.setTimeout(applyWhenReady, 100);
      return;
    }

    if (!mainColumn || document.querySelector('.zf-home-feed-refresh')) {
      return;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'zf-home-feed-refresh';
    button.setAttribute('aria-label', '刷新中间信息流');
    button.title = '刷新中间信息流';
    button.textContent = '↻';
    button.addEventListener('click', () => refreshZhihuHomeFeed(button));
    document.body.append(button);
  }

  applyWhenReady();
}

function initializeZhihuReturnHome() {
  if (document.querySelector('.zf-return-home')) {
    return;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'zf-return-home';
  button.setAttribute('aria-label', '回到知乎首页');
  button.title = '回到知乎首页';
  button.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 10.5 12 3l8 7.5v8.25A1.25 1.25 0 0 1 18.75 20H5.25A1.25 1.25 0 0 1 4 18.75V10.5Z"></path>
      <path d="M9.5 20v-6h5v6"></path>
    </svg>
  `;
  button.addEventListener('click', () => {
    window.location.assign('https://www.zhihu.com/');
  });
  document.body.append(button);
}

function initializeDoubanHomeSearch() {
  let attempts = 0;

  function applyWhenReady() {
    attempts += 1;
    const container = document.querySelector('#pt');
    const nativeEditor = container?.querySelector('.DRE-personal-topic-editor');

    if ((!container || !nativeEditor) && attempts < 20) {
      window.setTimeout(applyWhenReady, 100);
      return;
    }

    if (!container || !nativeEditor || container.querySelector('.zf-douban-home-search')) {
      return;
    }

    const form = document.createElement('form');
    const input = document.createElement('input');
    const source = document.createElement('input');
    const submit = document.createElement('button');

    form.className = 'zf-douban-home-search';
    form.action = 'https://www.douban.com/search';
    form.method = 'get';
    form.setAttribute('role', 'search');

    input.type = 'search';
    input.name = 'q';
    input.placeholder = '搜索你感兴趣的内容和人...';
    input.setAttribute('aria-label', input.placeholder);

    source.type = 'hidden';
    source.name = 'source';
    source.value = 'suggest';

    submit.type = 'submit';
    submit.setAttribute('aria-label', '搜索');

    form.append(input, source, submit);
    container.append(form);
  }

  applyWhenReady();
}

function initializeDoubanReadingSheet() {
  const wrapper = document.querySelector('#wrapper');
  const content = wrapper?.querySelector('#content');
  const footer = wrapper?.querySelector('#footer');

  if (!wrapper || !content || !footer) {
    return;
  }

  function updateSheetHeight() {
    // Keep 24px below the content, leaving the native footer outside the sheet.
    // Measuring the content also handles wrapped book titles and expanding reviews.
    const height = content.getBoundingClientRect().bottom
      - wrapper.getBoundingClientRect().top + 24;
    wrapper.style.setProperty('--zf-douban-sheet-height', `${Math.max(0, height)}px`);
  }

  updateSheetHeight();
  const observer = new ResizeObserver(updateSheetHeight);
  observer.observe(wrapper);
  observer.observe(content);
}

function applyFocusState(enabled) {
  document.documentElement.classList.toggle(FOCUS_CLASS, enabled);

  if (!enabled) {
    document.documentElement.classList.remove(HEADER_HIDDEN_CLASS);
  }
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function applyAppearance(settings) {
  const root = document.documentElement;
  const background = BACKGROUNDS.has(settings.readingBackground)
    ? settings.readingBackground
    : DEFAULT_SETTINGS.readingBackground;
  const fontFamily = FONT_FAMILY_NAMES.has(settings.readingFontFamily)
    ? settings.readingFontFamily
    : DEFAULT_SETTINGS.readingFontFamily;
  const fontSize = clampNumber(settings.readingFontSize, 14, 22, DEFAULT_SETTINGS.readingFontSize);
  const lineHeight = clampNumber(
    settings.readingLineHeight,
    1.4,
    2.2,
    DEFAULT_SETTINGS.readingLineHeight
  );
  const paragraphSpacing = clampNumber(
    settings.readingParagraphSpacing,
    0,
    1.5,
    DEFAULT_SETTINGS.readingParagraphSpacing
  );
  const readingWidth = clampNumber(settings.readingWidth, 680, 1100, DEFAULT_SETTINGS.readingWidth);
  const colors = BACKGROUND_COLORS[background];
  const fontStack = FONT_FAMILIES[fontFamily];

  root.dataset.zfReadingBackground = background;
  root.dataset.zfColorScheme = DARK_THEME_COLORS[background] ? 'dark' : 'light';
  root.dataset.zfReadingFontFamily = fontFamily;
  root.style.setProperty('--zf-reading-font-size', `${fontSize}px`);
  root.style.setProperty('--zf-reading-line-height', String(lineHeight));
  root.style.setProperty('--zf-paragraph-spacing', `${paragraphSpacing}em`);
  root.style.setProperty('--zf-content-width', `${readingWidth}px`);

  if (fontStack) {
    root.style.setProperty('--zf-reading-font-family', fontStack);
  } else {
    root.style.removeProperty('--zf-reading-font-family');
  }

  if (colors) {
    root.style.setProperty('--zf-page-background', colors.page);
    root.style.setProperty('--zf-surface-background', colors.surface);
  } else {
    root.style.removeProperty('--zf-page-background');
    root.style.removeProperty('--zf-surface-background');
  }

  const darkColors = DARK_THEME_COLORS[background];
  const darkProperties = {
    text: '--zf-text', secondary: '--zf-secondary-text', link: '--zf-link',
    border: '--zf-border', accent: '--zf-accent-background',
    accentBorder: '--zf-accent-border', solid: '--zf-accent-solid',
    hover: '--zf-hover-background', heading: '--zf-heading'
  };
  Object.entries(darkProperties).forEach(([key, property]) => {
    if (darkColors) {
      root.style.setProperty(property, darkColors[key]);
    } else {
      root.style.removeProperty(property);
    }
  });
}

function updateHeaderVisibility() {
  const currentScrollY = window.scrollY;
  const scrollDelta = currentScrollY - lastScrollY;

  if (!document.documentElement.classList.contains(FOCUS_CLASS)) {
    document.documentElement.classList.remove(HEADER_HIDDEN_CLASS);
  } else if (currentScrollY <= 8 || scrollDelta < 0) {
    document.documentElement.classList.remove(HEADER_HIDDEN_CLASS);
  } else if (scrollDelta > 3) {
    document.documentElement.classList.add(HEADER_HIDDEN_CLASS);
  }

  lastScrollY = currentScrollY;
}

// The first-run default is enabled. Stored preferences replace it as soon as
// Chrome returns them.
applyFocusState(DEFAULT_SETTINGS.focusEnabled);
applyAppearance(DEFAULT_SETTINGS);

chrome.storage.sync.get(DEFAULT_SETTINGS, settings => {
  applyFocusState(settings.focusEnabled);
  applyAppearance(settings);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'sync') {
    return;
  }

  if (changes.focusEnabled) {
    applyFocusState(changes.focusEnabled.newValue !== false);
  }

  if (
    changes.readingBackground ||
    changes.readingFontFamily ||
    changes.readingFontSize ||
    changes.readingLineHeight ||
    changes.readingParagraphSpacing ||
    changes.readingWidth
  ) {
    chrome.storage.sync.get(DEFAULT_SETTINGS, applyAppearance);
  }
});

window.addEventListener('scroll', updateHeaderVisibility, { passive: true });

if (IS_ZHIHU_HOME) {
  document.addEventListener(
    'DOMContentLoaded',
    initializeZhihuHomeRefresh,
    { once: true }
  );
}

if (IS_ZHIHU_NON_HOME) {
  document.addEventListener(
    'DOMContentLoaded',
    initializeZhihuReturnHome,
    { once: true }
  );
}

if (IS_DOUBAN_HOME) {
  document.addEventListener(
    'DOMContentLoaded',
    initializeDoubanHomeSearch,
    { once: true }
  );
}

if (IS_DOUBAN) {
  document.addEventListener(
    'DOMContentLoaded',
    initializeDoubanReadingSheet,
    { once: true }
  );
}
