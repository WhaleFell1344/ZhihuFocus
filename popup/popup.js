const DEFAULT_SETTINGS = {
  focusEnabled: true,
  readingBackground: 'default',
  readingFontFamily: 'default',
  readingFontSize: 16,
  readingLineHeight: 1.7,
  readingParagraphSpacing: 0.6,
  readingWidth: 780
};
const BACKGROUNDS = new Set([
  'default',
  'warm',
  'gray',
  'green',
  'blue',
  'lavender',
  'dark',
  'dark-blue',
  'dark-warm'
]);
const FONT_FAMILIES = new Set(['default', 'sans', 'serif', 'kai']);

const toggle = document.querySelector('#focus-enabled');
const backgroundOptions = document.querySelectorAll('[name="reading-background"]');
const fontFamilyOptions = document.querySelectorAll('[name="reading-font-family"]');
const fontSize = document.querySelector('#reading-font-size');
const fontSizeValue = document.querySelector('#reading-font-size-value');
const lineHeight = document.querySelector('#reading-line-height');
const lineHeightValue = document.querySelector('#reading-line-height-value');
const paragraphSpacing = document.querySelector('#reading-paragraph-spacing');
const paragraphSpacingValue = document.querySelector('#reading-paragraph-spacing-value');
const readingWidth = document.querySelector('#reading-width');
const readingWidthValue = document.querySelector('#reading-width-value');
const restoreDefaults = document.querySelector('#restore-defaults');

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function updateRangeValue(input, output, suffix = '') {
  output.value = `${input.value}${suffix}`;
}

function applyPopupTheme(background) {
  document.documentElement.dataset.zfReadingBackground = background;
  document.documentElement.dataset.zfColorScheme = background.startsWith('dark') ? 'dark' : 'light';
}

chrome.storage.sync.get(DEFAULT_SETTINGS, settings => {
  const background = BACKGROUNDS.has(settings.readingBackground)
    ? settings.readingBackground
    : DEFAULT_SETTINGS.readingBackground;
  const fontFamily = FONT_FAMILIES.has(settings.readingFontFamily)
    ? settings.readingFontFamily
    : DEFAULT_SETTINGS.readingFontFamily;
  const savedFontSize = clampNumber(settings.readingFontSize, 14, 22, DEFAULT_SETTINGS.readingFontSize);
  const savedLineHeight = clampNumber(
    settings.readingLineHeight,
    1.4,
    2.2,
    DEFAULT_SETTINGS.readingLineHeight
  );
  const savedParagraphSpacing = clampNumber(
    settings.readingParagraphSpacing,
    0,
    1.5,
    DEFAULT_SETTINGS.readingParagraphSpacing
  );
  const savedWidth = clampNumber(settings.readingWidth, 680, 1100, DEFAULT_SETTINGS.readingWidth);

  toggle.checked = settings.focusEnabled;
  applyPopupTheme(background);
  document.querySelector(
    `[name="reading-background"][value="${background}"]`
  ).checked = true;
  document.querySelector(
    `[name="reading-font-family"][value="${fontFamily}"]`
  ).checked = true;
  fontSize.value = savedFontSize;
  lineHeight.value = savedLineHeight;
  paragraphSpacing.value = savedParagraphSpacing;
  readingWidth.value = savedWidth;
  updateRangeValue(fontSize, fontSizeValue, 'px');
  updateRangeValue(lineHeight, lineHeightValue);
  updateRangeValue(paragraphSpacing, paragraphSpacingValue, 'em');
  updateRangeValue(readingWidth, readingWidthValue, 'px');
});

toggle.addEventListener('change', () => {
  chrome.storage.sync.set({ focusEnabled: toggle.checked });
});

backgroundOptions.forEach(option => {
  option.addEventListener('change', () => {
    if (option.checked) {
      applyPopupTheme(option.value);
      chrome.storage.sync.set({ readingBackground: option.value });
    }
  });
});

fontFamilyOptions.forEach(option => {
  option.addEventListener('change', () => {
    if (option.checked) {
      chrome.storage.sync.set({ readingFontFamily: option.value });
    }
  });
});

fontSize.addEventListener('input', () => {
  updateRangeValue(fontSize, fontSizeValue, 'px');
  chrome.storage.sync.set({ readingFontSize: Number(fontSize.value) });
});

lineHeight.addEventListener('input', () => {
  updateRangeValue(lineHeight, lineHeightValue);
  chrome.storage.sync.set({ readingLineHeight: Number(lineHeight.value) });
});

paragraphSpacing.addEventListener('input', () => {
  updateRangeValue(paragraphSpacing, paragraphSpacingValue, 'em');
  chrome.storage.sync.set({ readingParagraphSpacing: Number(paragraphSpacing.value) });
});

readingWidth.addEventListener('input', () => {
  updateRangeValue(readingWidth, readingWidthValue, 'px');
  chrome.storage.sync.set({ readingWidth: Number(readingWidth.value) });
});

restoreDefaults.addEventListener('click', () => {
  const appearanceDefaults = {
    readingBackground: DEFAULT_SETTINGS.readingBackground,
    readingFontFamily: DEFAULT_SETTINGS.readingFontFamily,
    readingFontSize: DEFAULT_SETTINGS.readingFontSize,
    readingLineHeight: DEFAULT_SETTINGS.readingLineHeight,
    readingParagraphSpacing: DEFAULT_SETTINGS.readingParagraphSpacing,
    readingWidth: DEFAULT_SETTINGS.readingWidth
  };

  chrome.storage.sync.set(appearanceDefaults, () => {
    applyPopupTheme(appearanceDefaults.readingBackground);
    document.querySelector('[name="reading-background"][value="default"]').checked = true;
    document.querySelector('[name="reading-font-family"][value="default"]').checked = true;
    fontSize.value = appearanceDefaults.readingFontSize;
    lineHeight.value = appearanceDefaults.readingLineHeight;
    paragraphSpacing.value = appearanceDefaults.readingParagraphSpacing;
    readingWidth.value = appearanceDefaults.readingWidth;
    updateRangeValue(fontSize, fontSizeValue, 'px');
    updateRangeValue(lineHeight, lineHeightValue);
    updateRangeValue(paragraphSpacing, paragraphSpacingValue, 'em');
    updateRangeValue(readingWidth, readingWidthValue, 'px');
  });
});
