import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeState {
  preference: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  setTheme: (preference: ThemePreference) => void;
  updateResolvedTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      preference: 'dark',
      resolvedTheme: 'dark',
      setTheme: (preference) => {
        set({ preference });
        get().updateResolvedTheme();
      },
      updateResolvedTheme: () => {
        const { preference } = get();
        const resolved = 
          preference === 'system'
            ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            : preference;
        
        set({ resolvedTheme: resolved });
        
        // Update DOM
        if (resolved === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }),
    {
      name: 'theme-preference',
    }
  )
);
