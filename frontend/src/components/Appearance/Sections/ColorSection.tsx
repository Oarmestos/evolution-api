import React from 'react';
import { Palette, RotateCcw } from 'lucide-react';

interface ColorSectionProps {
  theme: any;
  updateTheme: (updates: any) => void;
  resetToDefault: (key: string) => void;
}

export const ColorSection: React.FC<ColorSectionProps> = ({ 
  theme, 
  updateTheme, 
  resetToDefault 
}) => {
  const colorConfigs = [
    { label: 'Color Primario', key: 'primaryColor', desc: 'Botones y destacados' },
    { label: 'Color de Fondo', key: 'bgColor', desc: 'Fondo de la tienda' },
    { label: 'Color de Botones', key: 'buttonColor', desc: 'CTA y acciones' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Palette className="w-4 h-4" />
        <h3 className="text-sm font-black uppercase tracking-widest">Colores de Marca</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {colorConfigs.map((config) => (
          <div key={config.key} className="theme-surface-alt p-6 rounded-[32px] border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {config.label}
              </label>
              <button 
                onClick={() => resetToDefault(config.key)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-primary"
                title="Restablecer este color"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-2xl border-2 border-white/10 shadow-lg shrink-0 relative overflow-hidden"
                style={{ backgroundColor: theme[config.key] }}
              >
                <input 
                  type="color" 
                  value={theme[config.key]} 
                  onChange={(e) => updateTheme({ [config.key]: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer scale-150"
                />
              </div>
              <div className="flex-1">
                <input 
                  type="text" 
                  value={theme[config.key]} 
                  onChange={(e) => updateTheme({ [config.key]: e.target.value })}
                  className="w-full bg-transparent text-sm font-mono font-bold text-white outline-none"
                />
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">{config.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
