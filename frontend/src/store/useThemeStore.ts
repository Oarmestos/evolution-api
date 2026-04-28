import { create } from 'zustand';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'avri_theme';
const MEDIA_QUERY = '(prefers-color-scheme: dark)';

function canUseDOM() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function getStoredTheme(): ThemePreference {
  if (!canUseDOM()) {
    return 'system';
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  return isThemePreference(storedTheme) ? storedTheme : 'system';
}

function getSystemTheme(): ResolvedTheme {
  if (!canUseDOM() || typeof window.matchMedia !== 'function') {
    return 'dark';
  }

  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light';
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === 'system' ? getSystemTheme() : preference;
}

function applyResolvedTheme(preference: ThemePreference): ResolvedTheme {
  const resolvedTheme = resolveTheme(preference);

  if (!canUseDOM()) {
    return resolvedTheme;
  }

  const root = document.documentElement;
  root.dataset.theme = resolvedTheme;
  root.dataset.themePreference = preference;
  root.style.colorScheme = resolvedTheme;
  root.classList.toggle('dark', resolvedTheme === 'dark');
  root.classList.toggle('light', resolvedTheme === 'light');

  return resolvedTheme;
}

export function initializeTheme() {
  const preference = getStoredTheme();
  const resolvedTheme = applyResolvedTheme(preference);

  return { preference, resolvedTheme };
}

type ThemeState = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (preference: ThemePreference) => void;
  syncSystemTheme: () => void;
};

const initialTheme = initializeTheme();

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: initialTheme.preference,
  resolvedTheme: initialTheme.resolvedTheme,
  setTheme: (preference) => {
    if (canUseDOM()) {
      window.localStorage.setItem(STORAGE_KEY, preference);
    }

    set({
      preference,
      resolvedTheme: applyResolvedTheme(preference),
    });
  },
  syncSystemTheme: () => {
    if (get().preference !== 'system') {
      return;
    }

    set({
      resolvedTheme: applyResolvedTheme('system'),
    });
  },
}));

export function subscribeToSystemThemeChanges(callback: () => void) {
  if (!canUseDOM() || typeof window.matchMedia !== 'function') {
    return () => {};
  }

  const mediaQuery = window.matchMedia(MEDIA_QUERY);
  const handleThemeChange = () => callback();

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }

  mediaQuery.addListener(handleThemeChange);
  return () => mediaQuery.removeListener(handleThemeChange);
}
