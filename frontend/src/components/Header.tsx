import React from 'react';
import { Sun, Moon, Monitor, User as UserIcon } from 'lucide-react';

import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import type { ThemePreference } from '../store/useThemeStore';

export const Header: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const preference = useThemeStore((state) => state.preference);
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const setTheme = useThemeStore((state) => state.setTheme);

  const themeOptions: Array<{
    value: ThemePreference;
    label: string;
    Icon: typeof Sun;
  }> = [
    { value: 'light', label: 'Claro', Icon: Sun },
    { value: 'dark', label: 'Oscuro', Icon: Moon },
    { value: 'system', label: 'Sistema', Icon: Monitor },
  ];

  return (
    <header className="theme-header h-20 flex items-center justify-end px-12 shrink-0">
      <div className="flex items-center gap-8">
        {/* Theme Switcher */}
        <div className="theme-switcher" role="group" aria-label="Selector de tema">
          {themeOptions.map(({ value, label, Icon }) => {
            const isActive = preference === value;
            const activeDescription = value === 'system' ? ` (${resolvedTheme})` : '';

            return (
              <button
                key={value}
                type="button"
                className="theme-switcher-button"
                data-active={isActive}
                aria-pressed={isActive}
                title={`${label}${activeDescription}`}
                onClick={() => setTheme(value)}
              >
                <Icon className="w-4 h-4" />
                <span className="sr-only">{label}</span>
              </button>
            );
          })}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-4 pl-8 border-l theme-border-strong">
          <div className="text-right">
            <p className="text-sm font-black tracking-tight uppercase leading-none mb-1 theme-text">
              {user?.name || 'Admin User'}
            </p>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">{user?.role || 'Plan Pro'}</p>
          </div>
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-black shadow-lg shadow-primary/20 transition-transform hover:scale-105 cursor-pointer">
            <UserIcon className="w-6 h-6" />
          </div>
        </div>
      </div>
    </header>
  );
};
