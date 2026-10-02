const DEFAULT_SETTINGS = {
  focusEnabled: true,
  readingBackground: 'default',
  readingColorMode: 'system',
  readingFontFamily: 'default',
  readingFontSize: 16,
  readingLineHeight: 1.7,
  readingParagraphSpacing: 0.6,
  readingWidth: 780
};
const systemColorScheme = window.matchMedia('(prefers-color-scheme: dark)');
let currentSettings = { ...DEFAULT_SETTINGS };
let settingsLoaded = false;
let startupChanges = {};
const FONT_FAMILIES = new Set(['default', 'sans', 'serif', 'kai']);

const toggle = document.querySelector('#focus-enabled');
const modeOptions = document.querySelectorAll('[name="reading-color-mode"]');
const themeStatus = document.querySelector('#theme-status');
const themeLabel = document.querySelector('#reading-theme-label');
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

function applyPopupTheme() {
  const appearance = ZhihuFocusTheme.resolve(currentSettings, systemColorScheme.matches);
  ZhihuFocusTheme.apply(document.documentElement, appearance);
  modeOptions.forEach(option => {
    option.checked = option.value === appearance.readingColorMode;
  });
  backgroundOptions.forEach(option => {
    const dark = ZhihuFocusTheme.isDarkBackground(option.value);
    option.closest('label').hidden = dark !== (appearance.colorScheme === 'dark');
    option.checked = option.value === appearance.background;
  });
  const label = appearance.colorScheme === 'dark' ? '深色' : '浅色';
  themeLabel.textContent = `${label}主题`;
  themeStatus.textContent = appearance.readingColorMode === 'system'
    ? `跟随系统，当前为${label}。` : `固定使用${label}模式。`;
}

function renderSettings(settings) {
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

  toggle.checked = settings.focusEnabled !== false;
  applyPopupTheme();
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
}

// Render the system appearance immediately, then load saved palettes.
applyPopupTheme();
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'sync') return;
  for (const [key, change] of Object.entries(changes)) {
    currentSettings[key] = change.newValue;
    if (!settingsLoaded) startupChanges[key] = change.newValue;
  }
  renderSettings(currentSettings);
});
chrome.storage.sync.get(DEFAULT_SETTINGS, settings => {
  currentSettings = { ...DEFAULT_SETTINGS, ...settings, ...startupChanges };
  settingsLoaded = true;
  startupChanges = {};
  renderSettings(currentSettings);
});
systemColorScheme.addEventListener('change', applyPopupTheme);

function saveSettings(changes) {
  currentSettings = { ...currentSettings, ...changes };
  if (!settingsLoaded) startupChanges = { ...startupChanges, ...changes };
  chrome.storage.sync.set(changes);
}

modeOptions.forEach(option => {
  option.addEventListener('change', () => {
    if (!option.checked) return;
    saveSettings({ readingColorMode: option.value });
    applyPopupTheme();
  });
});

toggle.addEventListener('change', () => {
  saveSettings({ focusEnabled: toggle.checked });
});

backgroundOptions.forEach(option => {
  option.addEventListener('change', () => {
    if (option.checked) {
      const key = ZhihuFocusTheme.isDarkBackground(option.value)
        ? 'readingDarkBackground' : 'readingLightBackground';
      // Freeze both migrated palettes before updating the legacy key.
      saveSettings({
        ...ZhihuFocusTheme.normalize(currentSettings),
        [key]: option.value,
        readingBackground: option.value
      });
      applyPopupTheme();
    }
  });
});

fontFamilyOptions.forEach(option => {
  option.addEventListener('change', () => {
    if (option.checked) {
      saveSettings({ readingFontFamily: option.value });
    }
  });
});

fontSize.addEventListener('input', () => {
  updateRangeValue(fontSize, fontSizeValue, 'px');
  saveSettings({ readingFontSize: Number(fontSize.value) });
});

lineHeight.addEventListener('input', () => {
  updateRangeValue(lineHeight, lineHeightValue);
  saveSettings({ readingLineHeight: Number(lineHeight.value) });
});

paragraphSpacing.addEventListener('input', () => {
  updateRangeValue(paragraphSpacing, paragraphSpacingValue, 'em');
  saveSettings({ readingParagraphSpacing: Number(paragraphSpacing.value) });
});

readingWidth.addEventListener('input', () => {
  updateRangeValue(readingWidth, readingWidthValue, 'px');
  saveSettings({ readingWidth: Number(readingWidth.value) });
});

restoreDefaults.addEventListener('click', () => {
  const appearanceDefaults = {
    readingBackground: DEFAULT_SETTINGS.readingBackground,
    readingColorMode: 'system',
    readingLightBackground: 'default',
    readingDarkBackground: 'dark',
    readingFontFamily: DEFAULT_SETTINGS.readingFontFamily,
    readingFontSize: DEFAULT_SETTINGS.readingFontSize,
    readingLineHeight: DEFAULT_SETTINGS.readingLineHeight,
    readingParagraphSpacing: DEFAULT_SETTINGS.readingParagraphSpacing,
    readingWidth: DEFAULT_SETTINGS.readingWidth
  };

  saveSettings(appearanceDefaults);
  renderSettings(currentSettings);
});
