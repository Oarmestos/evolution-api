import React from 'react';
import { User, ChevronDown, Hash, Users, ShoppingCart, StickyNote, Bot } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useChatStore } from '../../store/useChatStore';
import { useThemeStore } from '../../store/useThemeStore';
import axios from 'axios';

interface ChatSidebarProps {
  activeInstance: string | undefined;
  editInfo: { pushName: string; phoneNumber: string; email: string };
  setEditInfo: React.Dispatch<React.SetStateAction<{ pushName: string; phoneNumber: string; email: string }>>;
  showContactInfo: boolean;
  setShowContactInfo: React.Dispatch<React.SetStateAction<boolean>>;
  setShowOrderModal?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  activeInstance,
  editInfo,
  setEditInfo,
  showContactInfo,
  setShowContactInfo,
  setShowOrderModal = () => {},
}) => {
  const { selectedChat, notes, updateControlMode } = useChatStore();
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const token = localStorage.getItem('avri_token');

  if (!selectedChat) return null;

  const handleUpdateContact = async () => {
    if (!activeInstance || !selectedChat) return;
    try {
      await useChatStore.getState().updateContact(activeInstance, selectedChat.remoteJid, editInfo);
      alert('Informacion del contacto actualizada');
    } catch (err) {
      console.error('Error al actualizar contacto:', err);
      alert('Error al actualizar contacto');
    }
  };

  const handleConvertToLead = async () => {
    if (!activeInstance || !selectedChat || !token) return;
    try {
      const funnelsRes = await axios.get(`/lead/funnels/${activeInstance}`, {
        headers: { apikey: token }
      });
      
      const funnels = funnelsRes.data;
      if (!funnels || funnels.length === 0) {
        alert('No hay embudos creados. Por favor, crea uno en la seccion de Ventas.');
        return;
      }

      const funnel = funnels[0];
      const defaultStageId = funnel?.Stages?.[0]?.id;

      if (!defaultStageId) {
        alert('El embudo no tiene etapas. Por favor, configura las etapas en la seccion de Ventas.');
        return;
      }

      await axios.post(`/lead/${activeInstance}`, {
        contactId: selectedChat.id,
        stageId: defaultStageId,
        value: 0,
        notes: 'Convertido desde Chat'
      }, {
        headers: { apikey: token }
      });
      
      alert('Lead creado exitosamente!');
    } catch (err) {
      console.error('Error al convertir lead:', err);
      alert('Error al conectar con el servidor de leads.');
    }
  };

  return (
    <div className="theme-surface-deep w-[320px] border-l border-border-soft flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-primary border-2 border-primary/20 shadow-lg",
          resolvedTheme === 'dark' ? "bg-[#2a2b2e]" : "bg-white"
        )}>
          {selectedChat.pushName?.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white leading-tight">{selectedChat.pushName}</h3>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">En Linea</span>
          </div>
        </div>
        {selectedChat.phoneNumber && (
          <div className="text-xs text-theme-muted font-mono bg-surface-muted px-3 py-1.5 rounded-lg border border-border-soft w-full truncate">
            +{selectedChat.phoneNumber}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="theme-surface-alt rounded-2xl p-4 space-y-3 border border-white/5">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted flex items-center gap-2">
            <Bot className="w-3.5 h-3.5" /> Control de Flujo
          </h4>
          <div className="bg-surface-deep flex p-1 rounded-xl">
            <button 
              onClick={() => activeInstance && updateControlMode(activeInstance, selectedChat.remoteJid, 'AI')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all",
                selectedChat.controlMode === 'AI' ? "bg-primary text-dark shadow-lg shadow-primary/20" : "text-gray-500 hover:text-gray-300"
              )}
            >
              Inteligencia
            </button>
            <button 
              onClick={() => activeInstance && updateControlMode(activeInstance, selectedChat.remoteJid, 'HUMAN')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all",
                selectedChat.controlMode === 'HUMAN' ? "bg-secondary text-dark shadow-lg shadow-secondary/20" : "text-gray-500 hover:text-gray-300"
              )}
            >
              Humano
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div 
            onClick={() => setShowContactInfo(!showContactInfo)}
            className="flex items-center justify-between p-4 bg-surface-muted rounded-2xl border border-border-soft hover:bg-surface-hover transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" />
              <span className="text-xs font-bold text-gray-400">Informacion del Contacto</span>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-gray-700 transition-transform", showContactInfo && "rotate-180")} />
          </div>

          {showContactInfo && (
            <div className="theme-surface-alt rounded-2xl p-4 space-y-4 border border-white/5 animate-in fade-in slide-in-from-top-2">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-600 uppercase">Nombre</label>
                  <input 
                    type="text" 
                    value={editInfo.pushName}
                    onChange={(e) => setEditInfo({ ...editInfo, pushName: e.target.value })}
                    className="theme-input w-full rounded-lg py-2 px-3 text-xs focus:ring-1 focus:ring-primary/50 outline-none"
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-600 uppercase">Telefono</label>
                  <input 
                    type="text" 
                    value={editInfo.phoneNumber}
                    onChange={(e) => setEditInfo({ ...editInfo, phoneNumber: e.target.value })}
                    className="theme-input w-full rounded-lg py-2 px-3 text-xs focus:ring-1 focus:ring-primary/50 outline-none"
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-600 uppercase">Email</label>
                  <input 
                    type="email" 
                    value={editInfo.email}
                    onChange={(e) => setEditInfo({ ...editInfo, email: e.target.value })}
                    className="theme-input w-full rounded-lg py-2 px-3 text-xs focus:ring-1 focus:ring-primary/50 outline-none"
                  />
               </div>
               <button 
                onClick={handleUpdateContact}
                className="w-full py-2 bg-surface-muted hover:bg-surface-hover text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border border-border-soft hover:border-primary/30 text-theme-muted hover:text-primary"
               >
                Guardar Cambios
               </button>
               <div className="pt-2 border-t border-white/5 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-gray-600 uppercase">Instancia</span>
                    <span className="text-[10px] text-white/50">{activeInstance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-gray-600 uppercase">JID</span>
                    <span className="text-[10px] text-white/50 truncate max-w-[150px]">{selectedChat.remoteJid}</span>
                  </div>
               </div>
            </div>
          )}
          
          <div className="theme-surface-alt rounded-2xl p-5 space-y-5 border border-border-soft">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted flex items-center gap-2">
                <Hash className="w-3.5 h-3.5" /> Ventas / Leads
              </h4>
            </div>
            <div className="space-y-4">
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center justify-between group hover:bg-primary/10 transition-colors">
                <div>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Estado del Lead</p>
                  <p className="text-xs font-bold text-white mt-1">Nuevo Prospecto</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
              </div>
              <button 
                onClick={handleConvertToLead}
                className="w-full py-3.5 bg-primary text-dark text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-primary/10 hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Convertir a Lead
              </button>
              <button 
                onClick={() => setShowOrderModal(true)}
                className="w-full py-3.5 bg-white/5 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl border border-white/5 hover:bg-white/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <ShoppingCart size={14} /> Registrar Venta
              </button>
            </div>
          </div>

          <div className="theme-surface-alt rounded-2xl p-5 space-y-5 border border-white/5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 flex items-center gap-2">
              <StickyNote className="w-3.5 h-3.5" /> Notas Recientes
            </h4>
            <div className="space-y-3">
              {notes.length === 0 ? (
                <p className="text-[10px] text-gray-700 italic">No hay notas registradas</p>
              ) : (
                notes.slice(0, 2).map(note => (
                  <div key={note.id} className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                    <p className="text-[11px] text-white/60 leading-relaxed italic">"{note.content}"</p>
                    <div className="flex justify-between mt-3 items-center">
                      <span className="text-[9px] font-black text-primary uppercase tracking-tighter bg-primary/10 px-2 py-0.5 rounded-md">{note.User?.name}</span>
                      <span className="text-[9px] text-gray-700 font-bold">{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
