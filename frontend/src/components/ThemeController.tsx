import { useEffect } from 'react';

import { subscribeToSystemThemeChanges, useThemeStore } from '../store/useThemeStore';

export const ThemeController = () => {
  const preference = useThemeStore((state) => state.preference);
  const setTheme = useThemeStore((state) => state.setTheme);
  const syncSystemTheme = useThemeStore((state) => state.syncSystemTheme);

  useEffect(() => {
    // Re-apply the persisted preference when the app mounts.
    setTheme(preference);
  }, [preference, setTheme]);

  useEffect(() => {
    return subscribeToSystemThemeChanges(syncSystemTheme);
  }, [syncSystemTheme]);

  return null;
};
