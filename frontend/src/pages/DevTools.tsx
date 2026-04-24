import React from 'react';
import { Key, Globe, Terminal, Copy, ExternalLink } from 'lucide-react';

export const DevTools: React.FC = () => {
  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Desarrollador</h2>
        <p className="text-gray-400 text-sm">Integra Avri en tus propias aplicaciones mediante API y Webhooks.</p>
      </div>

      {/* API Key Section */}
      <div className="bg-[#16171d] p-8 rounded-3xl border border-white/[0.03] space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Key className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-white uppercase tracking-tight">Global API Key</h3>
        </div>
        
        <p className="text-gray-500 text-xs max-w-2xl leading-relaxed">
          Utiliza esta clave para autenticar tus peticiones a la API. Mantén esta clave en secreto y no la compartas en entornos públicos.
        </p>

        <div className="flex gap-4">
          <div className="flex-1 bg-[#0f1016] border border-white/5 rounded-xl px-6 py-4 flex items-center justify-between group">
            <code className="text-primary font-mono text-sm tracking-widest">****************************************</code>
            <button className="text-gray-500 hover:text-white transition-colors">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <button className="px-6 py-4 bg-white/5 hover:bg-white/10 rounded-xl font-black uppercase tracking-widest text-[10px] border border-white/5 transition-all">
            Regenerar Clave
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Webhooks */}
        <div className="bg-[#16171d] p-8 rounded-3xl border border-white/[0.03] space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Globe className="w-5 h-5 text-secondary" />
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Webhooks</h3>
          </div>
          <p className="text-gray-500 text-[10px] leading-relaxed">Recibe notificaciones en tiempo real cuando ocurran eventos en tus instancias.</p>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">URL de Destino</label>
              <input type="text" placeholder="https://tu-dominio.com/webhook" className="w-full bg-[#0f1016] border border-white/5 rounded-xl py-3 px-4 text-xs focus:outline-none focus:border-primary/30" />
            </div>
            <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl font-black uppercase tracking-widest text-[10px] border border-white/5 transition-all">
              Guardar Configuración
            </button>
          </div>
        </div>

        {/* Documentation */}
        <div className="bg-[#16171d] p-8 rounded-3xl border border-white/[0.03] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Terminal className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Documentación API</h3>
            </div>
            <p className="text-gray-500 text-[10px] leading-relaxed">Explora nuestra referencia técnica completa con ejemplos en múltiples lenguajes.</p>
          </div>
          
          <div className="pt-6">
            <button className="w-full btn-primary flex items-center justify-center gap-2 py-4">
              <span className="font-black uppercase tracking-widest text-xs">Abrir Referencia</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
