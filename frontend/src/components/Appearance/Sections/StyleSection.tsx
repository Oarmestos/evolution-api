import React from 'react';
import { MousePointer2 } from 'lucide-react';

interface StyleSectionProps {
  theme: any;
  updateTheme: (updates: any) => void;
}

export const StyleSection: React.FC<StyleSectionProps> = ({ 
  theme, 
  updateTheme 
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <MousePointer2 className="w-4 h-4" />
        <h3 className="text-sm font-black uppercase tracking-widest">Estilos y Formas</h3>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {/* Bordes */}
        <div className="theme-surface-alt p-8 rounded-[32px] border border-white/5 space-y-6">
          <div className="flex justify-between items-end">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Radio de Bordes</label>
            <span className="text-xl font-black text-white italic">{theme.borderRadius}px</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="30" 
            value={theme.borderRadius}
            onChange={(e) => updateTheme({ borderRadius: parseInt(e.target.value) })}
            className="w-full accent-primary bg-white/5 h-2 rounded-full appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[8px] font-black uppercase text-gray-600 tracking-widest">
            <span>Recto</span>
            <span>Redondeado</span>
          </div>
        </div>

        {/* Estilo de Botón */}
        <div className="theme-surface-alt p-8 rounded-[32px] border border-white/5 space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Texto de Botones</label>
          <div className="grid grid-cols-2 gap-3">
            {['uppercase', 'none'].map((style) => (
              <button
                key={style}
                onClick={() => updateTheme({ buttonStyle: style })}
                className={`py-4 rounded-2xl border transition-all font-bold text-[10px] tracking-widest ${
                  theme.buttonStyle === style 
                    ? "bg-primary text-black border-primary" 
                    : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                }`}
              >
                {style === 'uppercase' ? 'MAYÚSCULAS' : 'Normal'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
