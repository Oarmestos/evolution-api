import React, { useState } from 'react';
import { 
  Bot, 
  Cpu, 
  Layers, 
  MessageSquare, 
  Share2, 
  Mail, 
  Sparkles,
  Plus
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { cn } from '../utils/cn';

const ecosystem = [
  { id: 'openai', name: 'OpenAI', desc: 'GPT-4o y asistentes personalizados.', icon: Cpu, color: '#10a37f', active: true },
  { id: 'dify', name: 'Dify.ai', desc: 'Plataforma LLMOps para aplicaciones.', icon: Layers, color: '#0052D9', active: true },
  { id: 'typebot', name: 'Typebot', desc: 'Constructor de chatbots visual.', icon: MessageSquare, color: '#FF8E21', active: true },
  { id: 'chatwoot', name: 'Chatwoot', desc: 'Bandeja de entrada omnicanal.', icon: Mail, color: '#1f93ff', active: false },
  { id: 'flowise', name: 'Flowise', desc: 'Constructor de IA sin código.', icon: Share2, color: '#4CAF50', active: false },
];

export const AIAgents: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<typeof ecosystem[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      {/* Header Section */}
      <div className="space-y-1">
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">IA & Agentes</h2>
        <p className="text-gray-400 text-sm">Conecta Avri con los mejores motores de inteligencia artificial.</p>
      </div>

      {/* Empty State / Active Agents Preview */}
      <div className="bg-[#16171d] border border-dashed border-white/10 rounded-2xl py-12 text-center space-y-4">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2">
          <Bot className="w-8 h-8 text-gray-600" />
        </div>
        <h3 className="text-xl font-bold text-white">No tienes agentes activos</h3>
        <p className="text-gray-500 text-sm max-w-xs mx-auto">
          Potencia tus canales de WhatsApp conectando un proveedor del ecosistema.
        </p>
      </div>

      {/* Ecosystem Grid */}
      <div className="space-y-6">
        <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Ecosistema Disponible
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ecosystem.map((agent) => (
            <div 
              key={agent.id}
              onClick={() => {
                if (agent.active) {
                  setSelectedAgent(agent);
                  setIsModalOpen(true);
                }
              }}
              className={cn(
                "bg-[#16171d] p-8 rounded-3xl border border-white/[0.03] flex flex-col items-center text-center transition-all duration-300 group relative",
                agent.active ? "cursor-pointer hover:bg-[#1c1e26] hover:border-white/10" : "opacity-40 cursor-not-allowed"
              )}
            >
              <div className="w-16 h-16 rounded-2xl bg-[#0f1016] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300 shadow-lg">
                <agent.icon className="w-8 h-8" style={{ color: agent.color }} />
              </div>

              <h4 className="text-lg font-bold text-white mb-2 uppercase tracking-tight">{agent.name}</h4>
              <p className="text-gray-500 text-[10px] leading-relaxed px-2 mb-6">{agent.desc}</p>
              
              <span className={cn(
                "text-[9px] font-black tracking-[0.2em] px-3 py-1 rounded-full uppercase mt-auto",
                agent.active ? "bg-primary/10 text-primary" : "bg-white/5 text-gray-600"
              )}>
                {agent.active ? 'Activo' : 'Próximamente'}
              </span>
            </div>
          ))}

          <div className="bg-[#16171d] border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center p-8 text-center hover:bg-white/5 cursor-pointer group transition-all">
            <div className="w-12 h-12 rounded-full bg-[#0f1016] flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-black transition-all">
              <Plus className="w-5 h-5 text-gray-600 group-hover:text-inherit" />
            </div>
            <h3 className="font-bold text-sm text-white">Solicitar Motor</h3>
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Configurar ${selectedAgent?.name}`}
      >
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400 ml-1">API Key / Token</label>
            <input 
              type="password" 
              placeholder="sk-..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-primary/50 transition-all text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400 ml-1">Prompt del Sistema</label>
            <textarea 
              placeholder="Ej: Eres un asistente experto en ventas..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-primary/50 transition-all resize-none text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400 ml-1">Asignar a Canal</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer text-white">
              <option value="" className="bg-[#0b0d14]">Selecciona una instancia...</option>
              <option value="none" className="bg-[#0b0d14] text-gray-500">No hay instancias activas</option>
            </select>
          </div>

          <button type="submit" className="w-full btn-primary py-4 text-lg font-black uppercase tracking-widest mt-4">
            Activar Agente
          </button>
        </form>
      </Modal>
    </div>
  );
};
