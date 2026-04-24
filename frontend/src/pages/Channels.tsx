import React, { useEffect, useState } from 'react';
import { 
  RefreshCw, 
  Trash2, 
  Smartphone, 
  MessageCircle,
  Image,
  Globe,
  Send,
  Mail,
  Code,
  Search,
  AlertCircle
} from 'lucide-react';
import { useInstanceStore } from '../store/useInstanceStore';
import { Modal } from '../components/Modal';
import { cn } from '../utils/cn';

export const Channels: React.FC = () => {
  const { instances, loading, error, fetchInstances, createInstance, deleteInstance } = useInstanceStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  const channelTypes = [
    { id: 'widget', name: 'Widget Web', desc: 'Widget de chat para seu website', icon: MessageCircle, color: 'text-white', active: false },
    { id: 'whatsapp', name: 'WhatsApp', desc: 'Canal do WhatsApp para atendimento ao cliente', icon: Smartphone, color: 'text-green-500', active: true },
    { id: 'instagram', name: 'Instagram', desc: 'Mensagens diretas do Instagram', icon: Image, color: 'text-white', active: false },
    { id: 'facebook', name: 'Facebook Messenger', desc: 'Chat do Facebook Messenger', icon: Globe, color: 'text-white', active: false },
    { id: 'telegram', name: 'Telegram', desc: 'Bot do Telegram para soporte automatizado', icon: Send, color: 'text-white', active: false },
    { id: 'sms', name: 'SMS', desc: 'Mensagens de texto SMS', icon: Smartphone, color: 'text-white', active: false },
    { id: 'email', name: 'Email', desc: 'Suporte por email', icon: Mail, color: 'text-white', active: false },
    { id: 'api', name: 'API', desc: 'Integração via API personalizada', icon: Code, color: 'text-white', active: false },
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstanceName.trim()) return;
    await createInstance(newInstanceName);
    setNewInstanceName('');
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Selecione um tipo de canal</h2>
        <p className="text-gray-400 text-sm">Escolha o canal que melhor atende às suas necesidades de comunicação.</p>
        
        <div className="relative max-w-md mt-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Buscar canais..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111218] border border-white/5 rounded-lg py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/30 transition-all text-white"
          />
        </div>
      </div>

      {/* Active Instances Minimal */}
      {instances.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
          {instances.map((inst) => (
            <div key={inst.instanceId} className="bg-[#1a1b23] p-4 rounded-xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Smartphone className={cn("w-5 h-5", inst.status === 'open' ? "text-primary" : "text-gray-500")} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{inst.instanceName}</h4>
                  <span className="text-[10px] text-primary uppercase font-black tracking-widest">{inst.status === 'open' ? 'Activo' : 'Desconectado'}</span>
                </div>
              </div>
              <button onClick={() => deleteInstance(inst.instanceName)} className="text-gray-600 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Channels Grid - Compact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {channelTypes.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((channel) => (
          <div 
            key={channel.id}
            onClick={() => { if (channel.active) setIsModalOpen(true); }}
            className={cn(
              "bg-[#16171d] p-8 rounded-3xl border border-white/[0.03] flex flex-col items-center text-center transition-all duration-300 group relative",
              channel.active ? "cursor-pointer hover:bg-[#1c1e26] hover:border-white/10" : "opacity-40 cursor-not-allowed"
            )}
          >
            <div className="w-16 h-16 rounded-2xl bg-[#0f1016] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300 shadow-lg">
              <channel.icon className={cn("w-8 h-8", channel.color)} />
            </div>
            
            <h4 className="text-lg font-bold text-white mb-2">{channel.name}</h4>
            <p className="text-gray-500 text-xs leading-relaxed px-2 mb-6">
              {channel.desc}
            </p>

            {!channel.active && (
              <span className="text-[9px] font-black tracking-[0.2em] text-gray-600 bg-white/5 px-3 py-1 rounded-full uppercase mt-auto">
                Em breve
              </span>
            )}
            
            {channel.active && (
              <span className="text-[9px] font-black tracking-[0.2em] text-primary bg-primary/10 px-3 py-1 rounded-full uppercase mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                Conectar
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Modal Setup */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Nueva Conexión"
      >
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Nombre de Instancia</label>
            <input 
              autoFocus
              type="text" 
              value={newInstanceName}
              onChange={(e) => setNewInstanceName(e.target.value)}
              placeholder="Ej: ventas_ws"
              className="w-full bg-[#0b0c11] border border-white/10 rounded-xl py-4 px-6 focus:outline-none focus:border-primary/50 transition-all text-white font-bold"
            />
          </div>
          <button 
            type="submit"
            disabled={loading || !newInstanceName.trim()}
            className="w-full btn-primary py-4 font-black uppercase tracking-widest text-xs"
          >
            {loading ? 'Procesando...' : 'Criar Canal'}
          </button>
        </form>
      </Modal>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm font-bold">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};
