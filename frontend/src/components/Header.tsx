import React from 'react';
import { Sun, Moon, Monitor, User as UserIcon, ChevronDown, Check } from 'lucide-react';

import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useInstanceStore } from '../store/useInstanceStore';
import type { ThemePreference } from '../store/useThemeStore';
import { cn } from '../utils/cn';

export const Header: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { instances, activeInstance, setActiveInstance } = useInstanceStore();
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

  const [isInstanceMenuOpen, setIsInstanceMenuOpen] = React.useState(false);

  return (
    <header className="theme-header h-20 flex items-center justify-between px-12 shrink-0">
      <div className="flex items-center gap-4">
        {/* Selector de Instancia */}
        <div className="relative">
          <button 
            onClick={() => setIsInstanceMenuOpen(!isInstanceMenuOpen)}
            className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
          >
            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center overflow-hidden border border-white/5">
              {activeInstance?.profilePicUrl ? (
                <img src={activeInstance.profilePicUrl} alt={activeInstance.instanceName} className="w-full h-full object-cover" />
              ) : (
                <Check className="w-4 h-4 text-primary" />
              )}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Instancia Activa</p>
              <p className="text-xs font-bold text-white uppercase tracking-tight">{activeInstance?.instanceName || 'Sin Instancia'}</p>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", isInstanceMenuOpen && "rotate-180")} />
          </button>

          {isInstanceMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsInstanceMenuOpen(false)} />
              <div className="absolute top-full mt-2 left-0 w-64 bg-[#16171d] border border-white/10 rounded-[30px] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="p-4 border-b border-white/5">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Mis Instancias</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {instances.map((instance) => (
                    <button
                      key={instance.instanceId}
                      onClick={() => {
                        setActiveInstance(instance);
                        setIsInstanceMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-left group",
                        activeInstance?.instanceId === instance.instanceId && "bg-primary/5"
                      )}
                    >
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5">
                        {instance.profilePicUrl ? (
                          <img src={instance.profilePicUrl} alt={instance.instanceName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-primary/20" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-xs font-bold truncate transition-colors",
                          activeInstance?.instanceId === instance.instanceId ? "text-primary" : "text-white"
                        )}>
                          {instance.instanceName}
                        </p>
                        <p className="text-[9px] text-gray-500 truncate">{instance.number || 'Sin número'}</p>
                      </div>
                      {activeInstance?.instanceId === instance.instanceId && (
                        <Check className="w-3 h-3 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

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
