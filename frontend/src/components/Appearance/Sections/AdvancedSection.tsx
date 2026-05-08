import React from 'react';
import { Send } from 'lucide-react';

interface AdvancedSectionProps {
  theme: any;
  updateTheme: (updates: any) => void;
}

export const AdvancedSection: React.FC<AdvancedSectionProps> = ({ 
  theme, 
  updateTheme 
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Send className="w-4 h-4" />
        <h3 className="text-sm font-black uppercase tracking-widest">Configuraciones Avanzadas</h3>
      </div>
      <div className="theme-surface-alt p-8 rounded-[40px] border border-white/5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">Sincronizar con WhatsApp</h4>
            <p className="text-xs text-gray-500">Aplica automáticamente estos colores a los mensajes enviados por IA.</p>
          </div>
          <label className="inline-flex items-center cursor-pointer relative">
            <input 
              type="checkbox" 
              checked={theme.syncWhatsapp} 
              onChange={(e) => updateTheme({ syncWhatsapp: e.target.checked })}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white/40 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-black"></div>
          </label>
        </div>
      </div>
    </div>
  );
};
