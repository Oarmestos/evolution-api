import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Bot, 
  Settings, 
  CreditCard, 
  LogOut,
  Zap,
  Code2
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuthStore } from '../store/useAuthStore';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: MessageSquare, label: 'Instancias', path: '/channels' },
  { icon: Bot, label: 'IA & Agentes', path: '/ai' },
  { icon: Zap, label: 'Flujos', path: '/flows' },
  { icon: Code2, label: 'Desarrollador', path: '/dev' },
  { icon: CreditCard, label: 'Suscripción', path: '/billing' },
  { icon: Settings, label: 'Configuración', path: '/settings' },
];

export const Sidebar: React.FC = () => {
  const logout = useAuthStore((state) => state.logout);

  return (
    <aside className="w-64 bg-dark/50 backdrop-blur-xl border-r border-white/5 flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="p-8">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-widest uppercase">
          Avri
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(0,242,255,0.1)]" 
                  : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
              )
            }
          >
            <item.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-white/5">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-300 group"
        >
          <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
