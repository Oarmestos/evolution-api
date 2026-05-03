import React, { useEffect, useState } from 'react';
import { 
  LogOut,
  Smartphone, 
  MessageCircle,
  Image,
  Globe,
  Send,
  Mail,
  Code,
  Search,
  AlertCircle,
  QrCode,
  Trash2
} from 'lucide-react';
import { useInstanceStore } from '../store/useInstanceStore';
import { Modal } from '../components/Modal';
import { cn } from '../utils/cn';

export const Channels: React.FC = () => {
  const {
    instances,
    loading,
    error,
    fetchInstances,
    createInstance,
    connectInstance,
    logoutInstance,
    deleteInstance,
    lastQrCodeBase64,
    lastCreatedInstanceName,
    clearLastQrCode,
  } = useInstanceStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstanceName, setSelectedInstanceName] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  const channelTypes = [
    { id: 'widget', name: 'Widget Web', desc: 'Widget de chat para tu sitio web', icon: MessageCircle, color: 'text-white', active: false },
    { id: 'whatsapp', name: 'WhatsApp', desc: 'Canal de WhatsApp para atención al cliente', icon: Smartphone, color: 'text-green-500', active: true },
    { id: 'instagram', name: 'Instagram', desc: 'Mensajes directos de Instagram', icon: Image, color: 'text-white', active: false },
    { id: 'facebook', name: 'Facebook Messenger', desc: 'Chat de Facebook Messenger', icon: Globe, color: 'text-white', active: false },
    { id: 'telegram', name: 'Telegram', desc: 'Bot de Telegram para soporte automatizado', icon: Send, color: 'text-white', active: false },
    { id: 'sms', name: 'SMS', desc: 'Mensajes de texto SMS', icon: Smartphone, color: 'text-white', active: false },
    { id: 'email', name: 'Email', desc: 'Soporte por correo electrónico', icon: Mail, color: 'text-white', active: false },
    { id: 'api', name: 'API', desc: 'Integración vía API personalizada', icon: Code, color: 'text-white', active: false },
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstanceName.trim()) return;
    await createInstance(newInstanceName);
    setNewInstanceName('');
    setIsModalOpen(false);
  };

  const qrSrc = lastQrCodeBase64
    ? lastQrCodeBase64.startsWith('data:')
      ? lastQrCodeBase64
      : `data:image/png;base64,${lastQrCodeBase64}`
    : null;

  const selected = selectedInstanceName ? instances.find((i) => i.instanceName === selectedInstanceName) : null;

  const openDetails = (name: string) => {
    setSelectedInstanceName(name);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedInstanceName(null);
  };

  const requestQr = async (name: string) => {
    setQrLoading(true);
    try {
      await connectInstance(name);
    } finally {
      setQrLoading(false);
    }
  };

  const statusLabel =
    selected?.connectionStatus === 'open'
      ? 'Conectado'
      : selected?.connectionStatus === 'connecting'
        ? 'Conectando'
        : 'Desconectado';

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Selecciona un tipo de canal</h2>
        <p className="text-gray-400 text-sm">Elige el canal que mejor se adapte a tus necesidades de comunicación.</p>
        
        <div className="relative max-w-md mt-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Buscar canales..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="theme-input w-full rounded-lg py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/30 transition-all"
          />
        </div>
      </div>

      {/* Active Instances Minimal */}
      {instances.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
          {instances.map((inst) => (
            <div
              key={inst.instanceId}
              className="theme-surface p-4 rounded-xl flex items-center justify-between gap-3 hover:border-white/10 hover:bg-[#20222c] transition-colors cursor-pointer"
              onClick={() => openDetails(inst.instanceName)}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Smartphone className={cn("w-5 h-5", inst.connectionStatus === 'open' ? "text-primary" : "text-gray-500")} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{inst.instanceName}</h4>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] uppercase font-black tracking-widest",
                      inst.connectionStatus === 'open'
                        ? "text-[#00ff88]"
                        : inst.connectionStatus === 'connecting'
                          ? "text-[#fbbf24]"
                          : "text-primary"
                    )}>
                      {inst.connectionStatus === 'open'
                        ? 'Conectado'
                        : inst.connectionStatus === 'connecting'
                          ? 'Conectando'
                          : 'Desconectado'}
                    </span>
                    {inst.number && (
                      <span className="text-[10px] text-white/30 font-bold truncate">
                        {inst.number}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  logoutInstance(inst.instanceName);
                }}
                className="text-gray-600 hover:text-red-500 transition-colors flex-shrink-0"
                title="Desconectar"
                type="button"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* QR global removed (now shown inside instance modal) */}

      {/* Details Modal */}
      <Modal
        isOpen={detailsOpen}
        onClose={closeDetails}
        title={selected ? `WhatsApp • ${selected.instanceName}` : 'WhatsApp'}
        className="max-w-3xl"
      >
        {!selected ? (
          <div className="text-sm text-white/50">Instancia no encontrada.</div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Smartphone className={cn("w-6 h-6", selected.connectionStatus === 'open' ? "text-primary" : "text-gray-500")} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg font-black text-white truncate">{selected.instanceName}</div>
                    <div className="text-xs font-black uppercase tracking-widest text-white/40">
                      Estado: <span className="text-white/70">{statusLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Número</div>
                    <div className="text-sm text-white/70 font-bold mt-1">{selected.number || '—'}</div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Perfil</div>
                    <div className="text-sm text-white/70 font-bold mt-1">{selected.profileName || '—'}</div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 sm:col-span-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Integración</div>
                    <div className="text-sm text-white/70 font-bold mt-1">{selected.integration || 'WHATSAPP-BAILEYS'}</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => requestQr(selected.instanceName)}
                    disabled={qrLoading || selected.connectionStatus === 'open'}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary/15 border border-primary/25 hover:bg-primary/20 transition-colors py-3 text-xs font-black uppercase tracking-widest text-primary disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <QrCode className="w-4 h-4" />
                    {selected.connectionStatus === 'open' ? 'Ya conectado' : qrLoading ? 'Generando QR...' : 'Conectar / Ver QR'}
                  </button>
                  <button
                    type="button"
                    onClick={() => logoutInstance(selected.instanceName)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition-colors py-3 text-xs font-black uppercase tracking-widest text-red-300"
                  >
                    <LogOut className="w-4 h-4" />
                    Desconectar
                  </button>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await deleteInstance(selected.instanceName);
                    closeDetails();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors py-3 text-xs font-black uppercase tracking-widest text-white/70"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar instancia
                </button>
              </div>

              <div className="w-full md:w-[320px] flex-shrink-0">
                <div className="theme-surface rounded-3xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/30">QR Code</div>
                    {qrSrc && lastCreatedInstanceName === selected.instanceName && (
                      <button
                        onClick={clearLastQrCode}
                        className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors"
                        type="button"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  {selected.connectionStatus === 'open' ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm text-white/40">
                      Esta instancia ya está conectada. Si quieres cambiar de dispositivo, haz clic en{' '}
                      <span className="text-white/70 font-bold">Desconectar</span> y luego genera un nuevo QR.
                    </div>
                  ) : qrSrc && lastCreatedInstanceName === selected.instanceName ? (
                    <div className="bg-white rounded-2xl p-3">
                      <img src={qrSrc} alt="WhatsApp QR Code" className="w-full aspect-square object-contain" />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm text-white/40">
                      Haz clic en <span className="text-white/70 font-bold">Conectar / Ver QR</span> para generar y mostrar el QR aquí.
                    </div>
                  )}

                  <div className="text-[11px] text-white/35 leading-relaxed">
                    Abre WhatsApp en el celular, ve a <span className="text-white/60 font-bold">Dispositivos vinculados</span> y escanea el QR.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Channels Grid - Compact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {channelTypes.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((channel) => (
          <div 
            key={channel.id}
            onClick={() => { if (channel.active) setIsModalOpen(true); }}
            className={cn(
              "theme-surface p-8 rounded-3xl flex flex-col items-center text-center transition-all duration-300 group relative",
              channel.active ? "cursor-pointer hover:bg-[#1c1e26] hover:border-white/10" : "opacity-40 cursor-not-allowed"
            )}
          >
            <div className="theme-surface-deep w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300 shadow-lg">
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
        title="Nueva conexión"
      >
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Nombre de instancia</label>
            <input 
              autoFocus
              type="text" 
              value={newInstanceName}
              onChange={(e) => setNewInstanceName(e.target.value)}
              placeholder="Ej: ventas_ws"
              className="theme-input w-full rounded-xl py-4 px-6 focus:outline-none focus:border-primary/50 transition-all font-bold"
            />
          </div>
          <button 
            type="submit"
            disabled={loading || !newInstanceName.trim()}
            className="w-full btn-primary py-4 font-black uppercase tracking-widest text-xs"
          >
            {loading ? 'Procesando...' : 'Crear canal'}
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
