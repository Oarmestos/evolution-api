import React from 'react';
import { Layout } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface TemplateSectionProps {
  currentTemplate: string;
  onApplyTemplate: (id: string) => void;
}

export const TemplateSection: React.FC<TemplateSectionProps> = ({ 
  currentTemplate, 
  onApplyTemplate 
}) => {
  const templates = [
    { id: 'moderno', name: 'Moderno (Default)', desc: 'Diseño limpio con enfoque en la claridad.', color: 'bg-indigo-500' },
    { id: 'luxury', name: 'Avri Luxury', desc: 'Diseño exclusivo Glassmorphic de ultra-lujo.', color: 'bg-gradient-to-br from-[#00327d] to-[#7b41b3] shadow-[0_0_15px_rgba(0,50,125,0.4)]' },
    { id: 'minimalista', name: 'Minimalista', desc: 'Sin distracciones. Ideal para marcas de lujo.', color: 'bg-black border border-white/20' },
    { id: 'divertido', name: 'Divertido', desc: 'Muchos emojis, fuentes amigables y un tono cercano.', color: 'bg-pink-500' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Layout className="w-4 h-4" />
        <h3 className="text-sm font-black uppercase tracking-widest">Plantillas de Tienda</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => onApplyTemplate(tpl.id)}
            className={cn(
              "relative p-6 rounded-3xl border transition-all text-left group",
              currentTemplate === tpl.id 
                ? "bg-white/10 border-primary shadow-[0_0_20px_rgba(0,242,255,0.1)]" 
                : "bg-[#16171d] border-white/5 hover:border-white/10"
            )}
          >
            <div className={cn("w-10 h-10 rounded-xl mb-4", tpl.color)} />
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase text-white">{tpl.name}</h4>
              <p className="text-[9px] text-gray-500 leading-tight">{tpl.desc}</p>
            </div>
            {currentTemplate === tpl.id && (
              <div className="absolute top-4 right-4 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-black rounded-full" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
