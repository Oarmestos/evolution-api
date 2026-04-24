import React from 'react';
import { User, Shield, Bell, Palette, Save } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../utils/cn';

export const Settings: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Configuración</h2>
        <p className="text-gray-400 text-sm">Personaliza tu perfil, preferencias de seguridad y de la plataforma.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Tabs (Vertical) */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { name: 'Perfil', icon: User, active: true },
            { name: 'Seguridad', icon: Shield, active: false },
            { name: 'Notificaciones', icon: Bell, active: false },
            { name: 'Apariencia', icon: Palette, active: false },
          ].map((tab) => (
            <button 
              key={tab.name}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px]",
                tab.active ? "bg-primary text-black" : "text-gray-500 hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#16171d] p-10 rounded-3xl border border-white/[0.03] space-y-8">
            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Información Personal</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nombre Completo</label>
                <input 
                  type="text" 
                  defaultValue={user?.name || ''}
                  className="w-full bg-[#0f1016] border border-white/5 rounded-xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  defaultValue={user?.email || ''}
                  className="w-full bg-[#0f1016] border border-white/5 rounded-xl py-4 px-6 text-sm text-white focus:outline-none focus:border-primary/30"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button className="btn-primary flex items-center gap-3 px-8 py-4">
                <Save className="w-4 h-4" />
                <span className="font-black uppercase tracking-widest text-xs">Guardar Cambios</span>
              </button>
            </div>
          </div>

          <div className="bg-[#16171d] p-10 rounded-3xl border border-white/[0.03] space-y-6">
            <h3 className="text-xl font-bold text-red-500 uppercase tracking-tight">Zona de Peligro</h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, asegúrate de haber respaldado tus datos.
            </p>
            <button className="px-6 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all">
              Eliminar mi Cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
