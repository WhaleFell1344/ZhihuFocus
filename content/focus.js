const FOCUS_CLASS = 'zhihu-focus-enabled';
const HEADER_HIDDEN_CLASS = 'zhihu-focus-header-hidden';
const DEFAULT_SETTINGS = {
  focusEnabled: true,
  readingBackground: 'default',
  readingFontSize: 16,
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
  }
};
const BACKGROUNDS = new Set(Object.keys(BACKGROUND_COLORS));
let lastScrollY = window.scrollY;

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
  const fontSize = clampNumber(settings.readingFontSize, 14, 22, DEFAULT_SETTINGS.readingFontSize);
  const readingWidth = clampNumber(settings.readingWidth, 680, 1100, DEFAULT_SETTINGS.readingWidth);
  const colors = BACKGROUND_COLORS[background];

  root.dataset.zfReadingBackground = background;
  root.style.setProperty('--zf-reading-font-size', `${fontSize}px`);
  root.style.setProperty('--zf-content-width', `${readingWidth}px`);

  if (colors) {
    root.style.setProperty('--zf-page-background', colors.page);
    root.style.setProperty('--zf-surface-background', colors.surface);
  } else {
    root.style.removeProperty('--zf-page-background');
    root.style.removeProperty('--zf-surface-background');
  }
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

  if (changes.readingBackground || changes.readingFontSize || changes.readingWidth) {
    chrome.storage.sync.get(DEFAULT_SETTINGS, applyAppearance);
  }
});

window.addEventListener('scroll', updateHeaderVisibility, { passive: true });
