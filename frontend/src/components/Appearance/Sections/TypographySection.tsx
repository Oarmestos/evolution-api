import React from 'react';
import { Type, RotateCcw } from 'lucide-react';

interface TypographySectionProps {
  theme: any;
  updateTheme: (updates: any) => void;
  resetToDefault: (key: string) => void;
}

export const TypographySection: React.FC<TypographySectionProps> = ({ 
  theme, 
  updateTheme, 
  resetToDefault 
}) => {
  const fonts = [
    { id: 'Inter', name: 'Inter (Moderna)' },
    { id: 'Outfit', name: 'Outfit (Luxury)' },
    { id: 'Poppins', name: 'Poppins (Soft)' },
    { id: 'Roboto', name: 'Roboto (Clean)' },
    { id: 'Playfair Display', name: 'Playfair (Elegant)' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Type className="w-4 h-4" />
        <h3 className="text-sm font-black uppercase tracking-widest">Tipografía y Textos</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Fuente */}
        <div className="theme-surface-alt p-6 rounded-[32px] border border-white/5 space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Fuente Principal</label>
          <select 
            value={theme.fontFamily}
            onChange={(e) => updateTheme({ fontFamily: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary/20"
          >
            {fonts.map(f => <option key={f.id} value={f.id} className="bg-[#1a1b21]">{f.name}</option>)}
          </select>
        </div>

        {/* Color de Texto */}
        <div className="theme-surface-alt p-6 rounded-[32px] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Color de Texto</label>
            <button 
              onClick={() => resetToDefault('textColor')}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-primary"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl border-2 border-white/10 shadow-lg shrink-0 relative overflow-hidden"
              style={{ backgroundColor: theme.textColor }}
            >
              <input 
                type="color" 
                value={theme.textColor} 
                onChange={(e) => updateTheme({ textColor: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer scale-150"
              />
            </div>
            <div className="flex-1">
              <input 
                type="text" 
                value={theme.textColor} 
                onChange={(e) => updateTheme({ textColor: e.target.value })}
                className="w-full bg-transparent text-sm font-mono font-bold text-white outline-none"
              />
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter italic">Lectura y legibilidad</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
