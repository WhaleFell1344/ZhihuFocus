const FOCUS_CLASS = 'zhihu-focus-enabled';
const HEADER_HIDDEN_CLASS = 'zhihu-focus-header-hidden';
const SETTING_KEY = 'focusEnabled';
let lastScrollY = window.scrollY;

function applyFocusState(enabled) {
  document.documentElement.classList.toggle(FOCUS_CLASS, enabled);

  if (!enabled) {
    document.documentElement.classList.remove(HEADER_HIDDEN_CLASS);
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
applyFocusState(true);

chrome.storage.sync.get({ [SETTING_KEY]: true }, settings => {
  applyFocusState(settings[SETTING_KEY]);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'sync' || !changes[SETTING_KEY]) {
    return;
  }

  applyFocusState(changes[SETTING_KEY].newValue !== false);
});

window.addEventListener('scroll', updateHeaderVisibility, { passive: true });
