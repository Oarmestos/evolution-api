import React from 'react';
import { Zap, Play, Workflow, Plus, MessageSquare, Clock } from 'lucide-react';
import { cn } from '../utils/cn';

export const Flows: React.FC = () => {
  const templates = [
    { name: 'Bienvenida Automática', desc: 'Responde instantáneamente a nuevos leads.', icon: MessageSquare, color: 'text-primary' },
    { name: 'Recordatorio de Cita', desc: 'Envía notificaciones antes de un evento.', icon: Clock, color: 'text-secondary' },
    { name: 'Filtro de Calificación', desc: 'Pregunta y segmenta a tus prospectos.', icon: Zap, color: 'text-accent' },
  ];

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">Constructor de Flujos</h2>
          <p className="text-gray-400 text-sm">Crea automatizaciones visuales sin necesidad de programar.</p>
        </div>
        <button className="btn-primary flex items-center gap-3 px-6 py-4">
          <Plus className="w-5 h-5" />
          <span className="font-black uppercase tracking-widest text-xs">Nuevo Flujo</span>
        </button>
      </div>

      {/* Empty State / Active Flows */}
      <div className="bg-[#16171d] border border-dashed border-white/10 rounded-2xl py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2">
          <Workflow className="w-8 h-8 text-gray-600" />
        </div>
        <h3 className="text-xl font-bold text-white">No tienes flujos activos</h3>
        <p className="text-gray-500 text-sm max-w-xs mx-auto">
          Comienza usando una plantilla o crea un flujo desde cero para automatizar tu negocio.
        </p>
      </div>

      {/* Templates Section */}
      <div className="space-y-6 pt-4">
        <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
          <Play className="w-4 h-4 fill-primary" />
          Plantillas Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.name} className="bg-[#16171d] p-8 rounded-3xl border border-white/[0.03] hover:border-white/10 transition-all cursor-pointer group">
              <div className="w-14 h-14 bg-[#0f1016] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <template.icon className={cn("w-7 h-7", template.color)} />
              </div>
              <h4 className="text-lg font-bold text-white mb-2 uppercase tracking-tight">{template.name}</h4>
              <p className="text-gray-500 text-[10px] leading-relaxed mb-6">{template.desc}</p>
              <button className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">
                Usar Plantilla
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
