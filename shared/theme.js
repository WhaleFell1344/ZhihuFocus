// Shared by the content scripts and popup so they resolve the same appearance.
const ZhihuFocusTheme = (() => {
  const BACKGROUND_COLORS = {
    default: null,
    warm: { page: '#F1EDE4', surface: '#F8F4EB' },
    gray: { page: '#E9ECEF', surface: '#F3F4F5' },
    green: { page: '#E8EFE6', surface: '#F2F6F0' },
    blue: { page: '#E8EEF4', surface: '#F2F6FA' },
    lavender: { page: '#EEEAF2', surface: '#F7F4F9' },
    dark: { page: '#15181D', surface: '#20242B' },
    'dark-blue': { page: '#101923', surface: '#192735' },
    'dark-warm': { page: '#1C1815', surface: '#29231E' }
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
  const MODES = new Set(['system', 'light', 'dark']);
  const isDarkBackground = background => Object.hasOwn(DARK_THEME_COLORS, background);
  const isLightBackground = background => Object.hasOwn(BACKGROUND_COLORS, background)
    && !isDarkBackground(background);

  function normalize(settings) {
    // Keep the old selection as that mode's palette when upgrading.
    const legacy = settings.readingBackground;
    return {
      readingColorMode: MODES.has(settings.readingColorMode)
        ? settings.readingColorMode : 'system',
      readingLightBackground: isLightBackground(settings.readingLightBackground)
        ? settings.readingLightBackground : (isLightBackground(legacy) ? legacy : 'default'),
      readingDarkBackground: isDarkBackground(settings.readingDarkBackground)
        ? settings.readingDarkBackground : (isDarkBackground(legacy) ? legacy : 'dark')
    };
  }

  function resolve(settings, systemDark) {
    const preferences = normalize(settings);
    const dark = preferences.readingColorMode === 'dark'
      || (preferences.readingColorMode === 'system' && systemDark);
    const background = dark
      ? preferences.readingDarkBackground : preferences.readingLightBackground;
    return {
      ...preferences,
      colorScheme: dark ? 'dark' : 'light',
      background,
      colors: BACKGROUND_COLORS[background],
      darkColors: DARK_THEME_COLORS[background]
    };
  }

  function apply(root, appearance) {
    root.dataset.zfReadingColorMode = appearance.readingColorMode;
    root.dataset.zfReadingBackground = appearance.background;
    root.dataset.zfColorScheme = appearance.colorScheme;
    for (const [key, property] of Object.entries({
      page: '--zf-page-background', surface: '--zf-surface-background'
    })) {
      if (appearance.colors) root.style.setProperty(property, appearance.colors[key]);
      else root.style.removeProperty(property);
    }
    for (const [key, property] of Object.entries({
      text: '--zf-text', secondary: '--zf-secondary-text', link: '--zf-link',
      border: '--zf-border', accent: '--zf-accent-background',
      accentBorder: '--zf-accent-border', solid: '--zf-accent-solid',
      hover: '--zf-hover-background', heading: '--zf-heading'
    })) {
      if (appearance.darkColors) root.style.setProperty(property, appearance.darkColors[key]);
      else root.style.removeProperty(property);
    }
  }

  return { normalize, resolve, apply, isDarkBackground, isLightBackground };
})();
