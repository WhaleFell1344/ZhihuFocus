const DEFAULT_SETTINGS = {
  focusEnabled: true,
  readingBackground: 'default',
  readingFontSize: 16,
  readingWidth: 780
};
const BACKGROUNDS = new Set([
  'default',
  'warm',
  'gray',
  'green',
  'blue',
  'lavender'
]);

const toggle = document.querySelector('#focus-enabled');
const backgroundOptions = document.querySelectorAll('[name="reading-background"]');
const fontSize = document.querySelector('#reading-font-size');
const fontSizeValue = document.querySelector('#reading-font-size-value');
const readingWidth = document.querySelector('#reading-width');
const readingWidthValue = document.querySelector('#reading-width-value');
const restoreDefaults = document.querySelector('#restore-defaults');

function updateRangeValue(input, output) {
  output.value = `${input.value}px`;
}

chrome.storage.sync.get(DEFAULT_SETTINGS, settings => {
  const background = BACKGROUNDS.has(settings.readingBackground)
    ? settings.readingBackground
    : DEFAULT_SETTINGS.readingBackground;

  toggle.checked = settings.focusEnabled;
  document.querySelector(
    `[name="reading-background"][value="${background}"]`
  ).checked = true;
  fontSize.value = settings.readingFontSize;
  readingWidth.value = settings.readingWidth;
  updateRangeValue(fontSize, fontSizeValue);
  updateRangeValue(readingWidth, readingWidthValue);
});

toggle.addEventListener('change', () => {
  chrome.storage.sync.set({ focusEnabled: toggle.checked });
});

backgroundOptions.forEach(option => {
  option.addEventListener('change', () => {
    if (option.checked) {
      chrome.storage.sync.set({ readingBackground: option.value });
    }
  });
});

fontSize.addEventListener('input', () => {
  updateRangeValue(fontSize, fontSizeValue);
  chrome.storage.sync.set({ readingFontSize: Number(fontSize.value) });
});

readingWidth.addEventListener('input', () => {
  updateRangeValue(readingWidth, readingWidthValue);
  chrome.storage.sync.set({ readingWidth: Number(readingWidth.value) });
});

restoreDefaults.addEventListener('click', () => {
  chrome.storage.sync.set(
    { readingBackground: DEFAULT_SETTINGS.readingBackground },
    () => {
      document.querySelector(
        '[name="reading-background"][value="default"]'
      ).checked = true;
    }
  );
});
