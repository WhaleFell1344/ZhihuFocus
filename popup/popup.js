const SETTING_KEY = 'focusEnabled';
const toggle = document.querySelector('#focus-enabled');

chrome.storage.sync.get({ [SETTING_KEY]: true }, settings => {
  toggle.checked = settings[SETTING_KEY];
});

toggle.addEventListener('change', () => {
  chrome.storage.sync.set({ [SETTING_KEY]: toggle.checked });
});
