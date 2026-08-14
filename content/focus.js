const FOCUS_CLASS = 'zhihu-focus-enabled';
const SETTING_KEY = 'focusEnabled';

function applyFocusState(enabled) {
  document.documentElement.classList.toggle(FOCUS_CLASS, enabled);
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
