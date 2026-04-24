import React from 'react';
import { Sun, Moon, Monitor, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const Header: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="h-20 bg-dark-sidebar border-b border-white/5 flex items-center justify-between px-12 shrink-0">
      <div className="flex items-center gap-4">
        {/* Placeholder for future features like breadcrumbs or search */}
      </div>

      <div className="flex items-center gap-8">
        {/* Theme Switcher */}
        <div className="bg-white/5 border border-white/10 rounded-full p-1 flex gap-1">
          <button className="p-2 rounded-full text-primary bg-white/5 border border-white/10 transition-all">
            <Sun className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-full text-gray-500 hover:text-white transition-colors">
            <Moon className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-full text-gray-500 hover:text-white transition-colors">
            <Monitor className="w-4 h-4" />
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-4 pl-8 border-l border-white/10">
          <div className="text-right">
            <p className="text-sm font-black tracking-tight uppercase leading-none mb-1">{user?.name || 'Admin User'}</p>
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
