import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Send, 
  Search, 
  MoreVertical, 
  Smile, 
  Paperclip, 
  Check, 
  CheckCheck,
  User,
  Phone,
  Mail,
  Tag as TagIcon,
  MessageSquare,
  Clock,
  ChevronLeft,
  X,
  Plus,
  Loader2,
  AlertCircle,
  ExternalLink,
  Edit,
  Save,
  Trash2,
  ShoppingCart,
  Zap,
  Layout,
  Filter
} from 'lucide-react';
import { useInstanceStore } from '../store/useInstanceStore';
import { useChatStore } from '../store/useChatStore';
import { cn } from '../utils/cn';

const ChatHub: React.FC = () => {
  const { instances, activeInstance } = useInstanceStore();
  const { 
    chats, 
    messages, 
    loading, 
    activeChat,
    activeInstance: storeActiveInstance,
    fetchChats, 
    fetchMessages, 
    sendMessage,
    setActiveChat,
    upsertChatWithLatestMessage
  } = useChatStore();

  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showContactInfo, setShowContactInfo] = useState(true);
  const [isEditingContact, setIsEditingContact] = useState(false);
  
  // State for manual contact editing
  const [editInfo, setEditInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Unified Polling & Initial Load
  useEffect(() => {
    if (activeInstance) {
      // Initial fetch
      fetchChats();
      
      // Polling for chats (every 10s)
      const chatInterval = setInterval(() => {
        fetchChats();
      }, 10000);

      return () => clearInterval(chatInterval);
    }
  }, [activeInstance?.instanceName]); // Only depend on name to avoid re-renders

  // 2. Message Polling for Active Chat
  useEffect(() => {
    if (activeInstance && activeChat) {
      fetchMessages(activeChat.remoteJid);
      
      const msgInterval = setInterval(() => {
        fetchMessages(activeChat.remoteJid);
      }, 5000);

      return () => clearInterval(msgInterval);
    }
  }, [activeInstance?.instanceName, activeChat?.remoteJid]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update editInfo when activeChat changes or when data arrives
  useEffect(() => {
    if (activeChat) {
      setEditInfo(prev => ({
        ...prev,
        // Only update if current is empty or looks like a technical JID
        name: (!prev.name || prev.name.includes('@')) ? (activeChat.name || activeChat.remoteJid.split('@')[0]) : prev.name,
        phone: !prev.phone ? activeChat.remoteJid.split('@')[0] : prev.phone,
        email: activeChat.email || prev.email || ''
      }));
    }
  }, [activeChat?.remoteJid, activeChat?.name]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChat) return;

    const text = messageText;
    setMessageText('');
    await sendMessage(activeChat.remoteJid, text);
  };

  const filteredChats = useMemo(() => {
    return chats.filter(chat => 
      (chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       chat.remoteJid.includes(searchQuery))
    );
  }, [chats, searchQuery]);

  const handleSaveContact = () => {
    // Logic to save contact info (Prisma update) would go here
    setIsEditingContact(false);
  };

  // Helper to format JID for display
  const formatJid = (jid: string) => {
    if (!jid) return '';
    return jid.split('@')[0];
  };

  if (!activeInstance) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center p-8 space-y-6">
        <div className="w-24 h-24 bg-primary/10 rounded-[40px] flex items-center justify-center text-primary animate-bounce">
          <Zap size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Centro de Mensajería</h2>
          <p className="text-gray-400 max-w-md mx-auto">Selecciona una instancia activa en el panel superior para comenzar a gestionar tus conversaciones en tiempo real.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] bg-[#0f1016] rounded-[40px] overflow-hidden border border-white/[0.03] shadow-2xl">
      {/* Sidebar: Chat List */}
      <div className="w-96 flex flex-col border-r border-white/[0.03] bg-[#111113]">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Conversaciones</h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-white/5 rounded-xl text-gray-500 transition-all">
                <Filter size={18} />
              </button>
              <button className="p-2 hover:bg-white/5 rounded-xl text-gray-500 transition-all">
                <Plus size={18} />
              </button>
            </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o número..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#16171d] border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-primary/20 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
          {loading && chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Sincronizando chats...</p>
            </div>
          ) : filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <button
                key={chat.remoteJid}
                onClick={() => setActiveChat(chat)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-3xl transition-all group relative",
                  activeChat?.remoteJid === chat.remoteJid 
                    ? "bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5" 
                    : "hover:bg-white/[0.03] border border-transparent"
                )}
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5">
                    {chat.profilePicUrl ? (
                      <img src={chat.profilePicUrl} alt={chat.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-gray-700" />
                    )}
                  </div>
                  {chat.unreadMessages > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-black text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#111113]">
                      {chat.unreadMessages}
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={cn(
                      "text-sm font-bold truncate transition-colors",
                      activeChat?.remoteJid === chat.remoteJid ? "text-primary" : "text-white"
                    )}>
                      {chat.name || formatJid(chat.remoteJid)}
                    </h3>
                    <span className="text-[9px] text-gray-500 font-medium">10:45 AM</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate leading-relaxed">
                    {chat.lastMessage || 'Empieza a chatear...'}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-gray-700">
                <MessageSquare size={24} />
              </div>
              <p className="text-xs text-gray-500 italic">No se encontraron chats.</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Chat Window */}
      <div className="flex-1 flex flex-col bg-[#0b0c10]">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="h-24 flex items-center justify-between px-8 border-b border-white/[0.03] bg-[#111113]/50 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5">
                  {activeChat.profilePicUrl ? (
                    <img src={activeChat.profilePicUrl} alt={activeChat.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-gray-700" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight">{activeChat.name || formatJid(activeChat.remoteJid)}</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">En Línea</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowContactInfo(!showContactInfo)}
                  className={cn(
                    "p-3 rounded-2xl transition-all border",
                    showContactInfo ? "bg-primary/10 border-primary/20 text-primary" : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/10"
                  )}
                >
                  <Layout size={20} />
                </button>
                <button className="p-3 bg-white/5 border border-white/5 rounded-2xl text-gray-500 hover:bg-white/10 transition-all">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[url('https://i.pinimg.com/originals/85/ec/da/85ecda1afc97779f22530182650009ec.png')] bg-fixed opacity-95">
              {messages.map((msg, idx) => {
                const isMe = msg.key.fromMe;
                return (
                  <div key={idx} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[70%] space-y-1",
                      isMe ? "items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "p-4 rounded-[28px] text-sm shadow-xl relative",
                        isMe 
                          ? "bg-primary text-black font-medium rounded-tr-none" 
                          : "bg-[#16171d] text-white/90 border border-white/5 rounded-tl-none"
                      )}>
                        <p className="leading-relaxed">{msg.message?.conversation || msg.message?.extendedTextMessage?.text || 'Mensaje de sistema'}</p>
                        <div className={cn(
                          "flex items-center gap-1.5 mt-2",
                          isMe ? "justify-end" : "justify-start"
                        )}>
                          <span className={cn(
                            "text-[8px] font-bold uppercase tracking-widest",
                            isMe ? "text-black/40" : "text-gray-500"
                          )}>10:45 AM</span>
                          {isMe && <CheckCheck size={12} className="text-black/40" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-6 bg-[#111113]/80 backdrop-blur-2xl border-t border-white/[0.03]">
              <form onSubmit={handleSend} className="flex items-center gap-4 bg-[#16171d] border border-white/5 rounded-[30px] p-2 pl-6 focus-within:border-primary/20 transition-all shadow-lg shadow-black/20">
                <button type="button" className="text-gray-500 hover:text-primary transition-colors">
                  <Smile size={22} />
                </button>
                <button type="button" className="text-gray-500 hover:text-primary transition-colors">
                  <Paperclip size={22} />
                </button>
                <input 
                  type="text" 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Escribe tu respuesta aquí..."
                  className="flex-1 bg-transparent border-none py-4 text-sm text-white focus:outline-none placeholder:text-gray-600 font-medium"
                />
                <button 
                  type="submit"
                  disabled={!messageText.trim()}
                  className="w-12 h-12 bg-primary rounded-[22px] flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:grayscale"
                >
                  <Send size={20} className="translate-x-0.5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
            <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center text-gray-700 animate-pulse">
              <MessageSquare size={48} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Selecciona un Chat</h2>
              <p className="text-gray-500 max-w-sm">Haz clic en una conversación para ver los mensajes y responder a tus clientes.</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar: Contact Info */}
      {showContactInfo && activeChat && (
        <div className="w-96 flex flex-col border-l border-white/[0.03] bg-[#111113] animate-in slide-in-from-right duration-500">
          <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
            {/* Profile Header */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-[48px] bg-white/5 flex items-center justify-center overflow-hidden border-2 border-white/5 p-1">
                  <div className="w-full h-full rounded-[40px] overflow-hidden bg-primary/20 flex items-center justify-center">
                    {activeChat.profilePicUrl ? (
                      <img src={activeChat.profilePicUrl} alt={activeChat.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={48} className="text-gray-700" />
                    )}
                  </div>
                </div>
                <button className="absolute -bottom-2 -right-2 p-3 bg-primary text-black rounded-2xl shadow-xl hover:scale-110 transition-all">
                  <Edit size={16} />
                </button>
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">{activeChat.name || formatJid(activeChat.remoteJid)}</h3>
                <p className="text-xs font-black text-primary uppercase tracking-widest mt-1">Lead Calificado</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: ShoppingCart, label: 'Orden', color: 'bg-green-500/10 text-green-500' },
                { icon: TagIcon, label: 'Ticket', color: 'bg-blue-500/10 text-blue-500' },
                { icon: Zap, label: 'Flujo', color: 'bg-primary/10 text-primary' },
              ].map((action, i) => (
                <button key={i} className={cn("flex flex-col items-center gap-2 p-4 rounded-3xl border border-white/5 hover:bg-white/[0.03] transition-all group")}>
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", action.color)}>
                    <action.icon size={20} />
                  </div>
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{action.label}</span>
                </button>
              ))}
            </div>

            {/* Details Form */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Información de Contacto</h4>
                <button 
                  onClick={() => isEditingContact ? handleSaveContact() : setIsEditingContact(true)}
                  className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                >
                  {isEditingContact ? 'Guardar' : 'Editar'}
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { icon: User, label: 'Nombre Completo', value: editInfo.name, field: 'name' },
                  { icon: Phone, label: 'Teléfono WhatsApp', value: editInfo.phone, field: 'phone' },
                  { icon: Mail, label: 'Correo Electrónico', value: editInfo.email, field: 'email' },
                ].map((item, i) => (
                  <div key={i} className="group">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2 ml-1">
                      <item.icon size={12} className="text-primary" />
                      {item.label}
                    </label>
                    {isEditingContact ? (
                      <input 
                        type="text"
                        value={item.value}
                        onChange={(e) => setEditInfo({ ...editInfo, [item.field]: e.target.value })}
                        className="w-full bg-[#16171d] border border-white/5 rounded-2xl py-3 px-4 text-xs text-white focus:outline-none focus:border-primary/20"
                      />
                    ) : (
                      <div className="w-full bg-white/[0.02] border border-white/[0.03] rounded-2xl py-3 px-4 text-xs text-white/70 font-medium">
                        {item.value || 'No especificado'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stats/History */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Actividad Reciente</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-white/[0.02] rounded-3xl border border-white/[0.03]">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Clock size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white">Última interacción</p>
                    <p className="text-[9px] text-gray-500">Hace 5 minutos vía WhatsApp</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHub;
