import React, { useEffect, useState, useRef } from 'react';
import { 
  Search, 
  Bot, 
  User, 
  Send, 
  MoreVertical, 
  StickyNote,
  MessageSquare,
  CheckCheck,
  Hash,
  Paperclip,
  Smile,
  Mic,
  Filter,
  X,
  Users,
  ChevronDown,
  Package,
  ShoppingCart,
  Plus
} from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useInstanceStore } from '../store/useInstanceStore';
import { cn } from '../utils/cn';
import axios from 'axios';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';

export const ChatHub: React.FC = () => {
  const { instances, fetchInstances } = useInstanceStore();
  const { 
    chats, 
    messages, 
    notes, 
    loadingChats, 
    loadingMessages, 
    selectedChat,
    fetchChats, 
    fetchMessages, 
    fetchNotes,
    updateControlMode,
    createInternalNote,
    sendMessage,
    setSelectedChat 
  } = useChatStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [inputText, setInputText] = useState('');
  const [activeInstance, setActiveInstance] = useState<string | null>(null);
  const [inputTab, setInputTab] = useState<'reply' | 'note'>('reply');
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [editInfo, setEditInfo] = useState<{ pushName: string; phoneNumber: string; email: string }>({
    pushName: '',
    phoneNumber: '',
    email: ''
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Track which chat is open so we only reset editInfo when the chat actually changes
  const activeChatJid = useRef<string | null>(null);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<{ product: any, quantity: number }[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMoreOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const token = localStorage.getItem('avri_token');

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  useEffect(() => {
    if (instances.length > 0 && !activeInstance) {
      setActiveInstance(instances[0].instanceName);
    }
  }, [instances, activeInstance]);

  useEffect(() => {
    if (activeInstance) {
      fetchChats(activeInstance);
      const interval = setInterval(() => fetchChats(activeInstance), 10000);
      return () => clearInterval(interval);
    }
  }, [activeInstance, fetchChats]);

  // Effect 1: fires when the selected chat changes (new conversation opened)
  // Resets editInfo and fetches notes only when the remoteJid actually changes.
  useEffect(() => {
    if (!activeInstance || !selectedChat) return;
    if (activeChatJid.current !== selectedChat.remoteJid) {
      activeChatJid.current = selectedChat.remoteJid;
      fetchMessages(activeInstance, selectedChat.remoteJid);
      fetchNotes(activeInstance, selectedChat.remoteJid);
      setEditInfo({
        pushName: selectedChat.pushName || '',
        phoneNumber: selectedChat.phoneNumber || selectedChat.remoteJid.split('@')[0],
        email: selectedChat.email || ''
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeInstance, selectedChat?.remoteJid]);

  // Effect 2: message polling — refresh every 5s without touching editInfo
  useEffect(() => {
    if (!activeInstance || !selectedChat) return;
    const interval = setInterval(() => {
      fetchMessages(activeInstance, selectedChat.remoteJid);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeInstance, selectedChat?.remoteJid, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeInstance || !selectedChat) return;

    if (inputTab === 'reply') {
      await sendMessage(activeInstance, selectedChat.remoteJid, inputText);
    } else {
      await createInternalNote(activeInstance, selectedChat.remoteJid, inputText);
    }
    setInputText('');
  };

  const handleConvertToLead = async () => {
    if (!activeInstance || !selectedChat || !token) return;
    try {
      const funnelsRes = await axios.get(`/lead/funnels/${activeInstance}`, {
        headers: { apikey: token }
      });
      
      const funnels = funnelsRes.data;
      if (!funnels || funnels.length === 0) {
        alert('No hay embudos creados. Por favor, crea uno en la sección de Ventas.');
        return;
      }

      const funnel = funnels[0];
      const defaultStageId = funnel?.Stages?.[0]?.id;

      if (!defaultStageId) {
        alert('El embudo no tiene etapas. Por favor, configura las etapas en la sección de Ventas.');
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
      
      alert('¡Lead creado exitosamente!');
    } catch (err) {
      console.error('Error al convertir lead:', err);
      alert('Error al conectar con el servidor de leads.');
    }
  };
 
  const handleUpdateContact = async () => {
    if (!activeInstance || !selectedChat) return;
    try {
      await useChatStore.getState().updateContact(activeInstance, selectedChat.remoteJid, editInfo);
      alert('Información del contacto actualizada');
    } catch (err) {
      console.error('Error al actualizar contacto:', err);
      alert('Error al actualizar contacto');
    }
  };

  const fetchProducts = async () => {
    if (!activeInstance) return;
    try {
      const { data } = await axios.get(`/product/${activeInstance}`, {
        headers: { apikey: token }
      });
      setAllProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const sendProduct = async (product: any) => {
    if (!activeInstance || !selectedChat) return;
    const text = `*${product.name}*\n${product.description || ''}\n\n*Precio:* $${product.price.toLocaleString()}\n\n¿Te gustaría que te ayude con el pedido?`;
    await sendMessage(activeInstance, selectedChat.remoteJid, text);
    setShowProductSelector(false);
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const sendCartToClient = async () => {
    if (!activeInstance || !selectedChat || cart.length === 0) return;
    const total = cart.reduce((acc, curr) => acc + (curr.product.price * curr.quantity), 0);
    let text = `🛒 *Resumen de tu pedido:*\n\n`;
    cart.forEach(item => {
      text += `▪ ${item.quantity}x ${item.product.name} - $${(item.product.price * item.quantity).toLocaleString()}\n`;
    });
    text += `\n*Total a pagar: $${total.toLocaleString()}*`;
    
    await sendMessage(activeInstance, selectedChat.remoteJid, text);
    setShowOrderModal(false);
  };

  const registerOrder = async () => {
    if (!activeInstance || !selectedChat || cart.length === 0) return;
    try {
      await axios.post(`/order/${activeInstance}`, {
        remoteJid: selectedChat.remoteJid,
        items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity })),
        status: 'PAID'
      }, {
        headers: { apikey: token }
      });
      alert('¡Venta registrada con éxito!');
      setShowOrderModal(false);
      setCart([]);
    } catch (err) {
      console.error('Error registering order:', err);
      alert('Error al registrar la venta');
    }
  };

  useEffect(() => {
    if (activeInstance) fetchProducts();
  }, [activeInstance]);

  const filteredChats = chats.filter(chat => 
    chat.pushName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.remoteJid.includes(searchTerm)
  );

  return (
    <>
      <div className="theme-surface h-[calc(100vh-140px)] flex gap-0.5 overflow-hidden rounded-3xl border border-white/5 shadow-2xl">
      {/* Column 1: Chat List */}
      <div className="theme-surface-deep w-[320px] flex flex-col border-r border-white/5">
        <div className="p-4 space-y-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar conversaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="theme-input w-full rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary/50 transition-all outline-none"
            />
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{chats.length} conversaciones</span>
            <div className="flex gap-2">
              <button className="text-[10px] font-bold text-gray-400 flex items-center gap-1 hover:text-white transition-colors">
                <Filter className="w-3 h-3" /> Filtros
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loadingChats && chats.length === 0 ? (
            <div className="flex flex-col gap-2 p-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-12 h-12 bg-white/5 rounded-full"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-2 bg-white/5 rounded w-3/4"></div>
                    <div className="h-2 bg-white/5 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            filteredChats.map((chat) => (
              <button
                key={chat.remoteJid}
                onClick={() => setSelectedChat(chat)}
                className={cn(
                  "w-full p-4 flex items-start gap-3 transition-all border-l-4 border-transparent",
                  selectedChat?.remoteJid === chat.remoteJid 
                    ? "theme-surface-alt border-l-primary" 
                    : "hover:bg-white/[0.02]"
                )}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#2a2b2e] overflow-hidden flex items-center justify-center border border-white/5">
                    {chat.profilePicUrl ? (
                      <img src={chat.profilePicUrl} alt={chat.pushName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-xs font-bold text-gray-500">{chat.pushName?.substring(0, 2).toUpperCase() || '??'}</div>
                    )}
                  </div>
                  {chat.controlMode === 'AI' && (
                    <div className="absolute -bottom-1 -right-1 p-1 bg-primary rounded-full border-2 border-[#0f1012] shadow-[0_0_8px_rgba(0,255,136,0.5)]">
                      <Bot className="w-2 h-2 text-dark" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0 pt-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-gray-200 truncate pr-2">{chat.pushName || (chat.phoneNumber ? `+${chat.phoneNumber}` : chat.remoteJid.split('@')[0])}</h4>
                    <span className="text-[10px] text-gray-600 font-medium">Reciente</span>
                  </div>
                  <p className={cn(
                    "text-xs mt-0.5 truncate",
                    chat.unreadCount > 0 ? "text-white font-medium" : "text-gray-500"
                  )}>
                    {chat.lastMessage?.message || 'Sin mensajes'}
                  </p>
                </div>
                {chat.unreadCount > 0 && (
                  <div className="mt-2 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(0,255,136,0.5)]"></div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Column 2: Chat View */}
      <div className="flex-1 flex flex-col relative bg-[#0f1012]">
        {!selectedChat ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-50">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-gray-800" />
            </div>
            <p className="text-gray-600 text-sm font-bold uppercase tracking-widest">Selecciona una conversación</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="theme-surface-deep h-16 px-6 border-b border-white/5 flex items-center justify-between backdrop-blur-md relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2a2b2e] overflow-hidden flex items-center justify-center border border-white/5 shrink-0">
                  {selectedChat.profilePicUrl ? (
                    <img src={selectedChat.profilePicUrl} alt={selectedChat.pushName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-xs font-bold text-gray-500">{selectedChat.pushName?.substring(0, 2).toUpperCase()}</div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm leading-tight">{selectedChat.pushName}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-primary/70 font-bold uppercase tracking-tighter">
                      {selectedChat.phoneNumber ? `+${selectedChat.phoneNumber}` : selectedChat.remoteJid.split('@')[0]}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                    <span className="text-[10px] text-gray-500">Activo</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative" ref={menuRef}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMoreOptions(!showMoreOptions);
                    }}
                    className="p-2 text-gray-500 hover:text-white transition-colors hover:bg-white/5 rounded-lg active:scale-95"
                    title="Más opciones"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {showMoreOptions && (
                    <div className="absolute right-0 mt-2 w-48 theme-surface-alt border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[100] py-2 animate-in fade-in slide-in-from-top-2">
                      <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
                        <User size={14} /> Ver Detalles
                      </button>
                      <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2">
                        <Bot size={14} /> Silenciar Chat
                      </button>
                      <div className="h-px bg-white/5 my-2"></div>
                      <button 
                        onClick={() => {
                          setSelectedChat(null);
                          setShowMoreOptions(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                      >
                        <X size={14} /> Cerrar Chat
                      </button>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setSelectedChat(null)}
                  className="p-2 text-gray-500 hover:text-white transition-colors hover:bg-white/5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')] relative">
              <div className="absolute inset-0 bg-[#0f1012]/40 pointer-events-none"></div>
              <div className="relative z-10 space-y-6">
                {loadingMessages && messages.length === 0 ? (
                  <div className="flex justify-center p-4">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center">
                      <span className="theme-chip px-3 py-1 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Inicio de la conversación</span>
                    </div>
                    
                    {messages.map((msg, i) => {
                      const fromMe = msg.key.fromMe;
                      return (
                        <div key={msg.id || i} className={cn("flex", fromMe ? "justify-end" : "justify-start")}>
                          <div className="max-w-[80%] flex flex-col gap-1">
                            <div className={cn(
                              "rounded-2xl px-4 py-3 text-sm shadow-xl transition-all",
                              fromMe 
                                ? "bg-primary text-dark font-medium rounded-tr-none" 
                                : "theme-surface-alt text-gray-100 border border-white/5 rounded-tl-none hover:border-white/10"
                            )}>
                              {msg.message?.conversation || msg.message?.extendedTextMessage?.text || "[Tipo de mensaje no soportado]"}
                            </div>
                            <div className={cn("flex items-center gap-2 px-1", fromMe ? "justify-end" : "justify-start")}>
                              <span className="text-[10px] text-gray-600 font-bold">
                                {new Date(msg.messageTimestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {fromMe && <CheckCheck className="w-3.5 h-3.5 text-primary opacity-50" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="theme-surface-deep p-6 border-t border-white/5 relative z-10">
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex gap-4 px-2">
                  <button 
                    onClick={() => setInputTab('reply')}
                    className={cn(
                      "text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all pb-2 border-b-2",
                      inputTab === 'reply' ? "text-primary border-primary" : "text-gray-600 border-transparent hover:text-gray-400"
                    )}
                  >
                    <div className={cn("w-2 h-2 rounded-full", inputTab === 'reply' ? "bg-primary" : "bg-gray-800")}></div>
                    Respuesta
                  </button>
                  <button 
                    onClick={() => setInputTab('note')}
                    className={cn(
                      "text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all pb-2 border-b-2",
                      inputTab === 'note' ? "text-secondary border-secondary" : "text-gray-600 border-transparent hover:text-gray-400"
                    )}
                  >
                    <div className={cn("w-2 h-2 rounded-full", inputTab === 'note' ? "bg-secondary" : "bg-gray-800")}></div>
                    Nota Privada
                  </button>
                </div>

                <form onSubmit={handleSend} className="relative group">
                  {showEmojiPicker && (
                    <div className="absolute bottom-[110%] left-0 mb-2 z-50 shadow-2xl">
                      <EmojiPicker 
                        theme={Theme.DARK}
                        onEmojiClick={(emojiData: EmojiClickData) => {
                          setInputText((prev) => prev + emojiData.emoji);
                          setShowEmojiPicker(false);
                        }}
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-1 absolute left-3 top-1/2 -translate-y-1/2 z-10">
                    <button 
                      type="button" 
                      onClick={() => document.getElementById('file-upload')?.click()}
                      className="p-2 text-gray-500 hover:text-primary transition-all hover:bg-primary/10 rounded-xl"
                      title="Adjuntar archivo"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowProductSelector(true)}
                      className="p-2 text-gray-500 hover:text-primary transition-all hover:bg-primary/10 rounded-xl"
                      title="Catálogo de Productos"
                    >
                      <Package className="w-5 h-5" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 text-gray-500 hover:text-yellow-500 transition-all hover:bg-yellow-500/10 rounded-xl"
                      title="Emojis"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    <input 
                      type="file" 
                      id="file-upload" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) alert(`Archivo seleccionado: ${file.name}`);
                      }} 
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder={inputTab === 'reply' ? "Escribe un mensaje aquí..." : "Escribe una nota interna para el equipo..."}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className={cn(
                      "theme-input w-full rounded-2xl py-5 pl-[140px] pr-[100px] text-sm focus:ring-2 transition-all outline-none border-white/5",
                      inputTab === 'reply' ? "focus:ring-primary/20" : "focus:ring-secondary/20"
                    )}
                  />
                  <div className="flex items-center gap-1 absolute right-3 top-1/2 -translate-y-1/2 z-10">
                    <button 
                      type="button" 
                      onClick={() => alert('Grabación de audio (Próximamente)')}
                      className="p-2 text-gray-500 hover:text-red-500 transition-all hover:bg-red-500/10 rounded-xl"
                      title="Grabar nota de voz"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                    <button 
                      type="submit"
                      className={cn(
                        "p-1.5 rounded-xl transition-all active:scale-90",
                        inputTab === 'reply' ? "text-primary hover:bg-primary/10" : "text-secondary hover:bg-secondary/10"
                      )}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Column 3: Context & CRM */}
      {selectedChat && (
        <div className="theme-surface-deep w-[320px] border-l border-white/5 flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-[#2a2b2e] flex items-center justify-center text-2xl font-bold text-primary border-2 border-primary/20 shadow-[0_0_20px_rgba(0,255,136,0.1)]">
              {selectedChat.pushName?.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">{selectedChat.pushName}</h3>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">En Línea</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 font-mono bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 w-full truncate">
              {selectedChat.phoneNumber ? `+${selectedChat.phoneNumber}` : selectedChat.remoteJid.split('@')[0]}
            </div>
          </div>

          <div className="space-y-4">
            <div className="theme-surface-alt rounded-2xl p-4 space-y-3 border border-white/5">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 flex items-center gap-2">
                <Bot className="w-3.5 h-3.5" /> Control de Flujo
              </h4>
              <div className="bg-[#111113] flex p-1 rounded-xl">
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
                className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" />
                  <span className="text-xs font-bold text-gray-400">Información del Contacto</span>
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
                      <label className="text-[10px] font-black text-gray-600 uppercase">Teléfono</label>
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
                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border border-white/5 hover:border-primary/30 text-gray-300 hover:text-primary"
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
              
              <div className="theme-surface-alt rounded-2xl p-5 space-y-5 border border-white/5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 flex items-center gap-2">
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
      )}
    </div>

      {/* Product Selector Modal */}
      {showProductSelector && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => setShowProductSelector(false)}>
          <div className="theme-overlay-card w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Package className="text-primary" /> Seleccionar Producto</h2>
              <button onClick={() => setShowProductSelector(false)} className="text-white/40 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allProducts.filter(p => p.enabled).map(product => (
                  <div 
                    key={product.id}
                    onClick={() => sendProduct(product)}
                    className="theme-surface-alt p-4 rounded-2xl border border-white/5 hover:border-primary/40 cursor-pointer transition-all group flex gap-4"
                  >
                    <div className="w-16 h-16 rounded-xl bg-black/40 overflow-hidden flex-shrink-0">
                      {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/10"><Package size={24} /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{product.name}</h4>
                      <p className="text-[10px] text-white/40 line-clamp-1 mt-1">{product.description}</p>
                      <p className="text-sm font-bold text-primary mt-2">${product.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              {allProducts.length === 0 && (
                <div className="text-center py-10 text-white/20">
                  <Package size={48} className="mx-auto mb-4 opacity-10" />
                  <p>No hay productos registrados en el catálogo.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Registration Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => setShowOrderModal(false)}>
          <div className="theme-overlay-card w-full max-w-md rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white">Registrar Venta</h2>
              <button onClick={() => setShowOrderModal(false)} className="text-white/40 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40 mb-3">Agregar Productos</label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {allProducts.map(product => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <span className="text-xs text-white/60 font-medium">{product.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-primary">${product.price.toLocaleString()}</span>
                        <button 
                          onClick={() => addToCart(product)}
                          className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {cart.length > 0 && (
                <div className="pt-6 border-t border-white/5">
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40 mb-3">Carrito</label>
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.product.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button onClick={() => removeFromCart(item.product.id)} className="text-red-500/40 hover:text-red-500"><X size={14} /></button>
                          <span className="text-xs text-white/80">{item.product.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
                            <button onClick={() => updateQuantity(item.product.id, -1)} className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white rounded-md hover:bg-white/10">-</button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product.id, 1)} className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white rounded-md hover:bg-white/10">+</button>
                          </div>
                          <span className="text-xs font-bold text-white w-16 text-right">${(item.product.price * item.quantity).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 flex justify-between items-center border-t border-white/5">
                      <span className="text-sm font-bold text-white">Total</span>
                      <span className="text-lg font-black text-primary">${cart.reduce((acc, curr) => acc + (curr.product.price * curr.quantity), 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={sendCartToClient}
                  disabled={cart.length === 0}
                  className="flex-1 py-4 bg-white/5 text-white font-bold uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all disabled:opacity-50 text-[10px] flex items-center justify-center gap-2 border border-white/5"
                >
                  <MessageSquare size={14} /> Enviar al Chat
                </button>
                <button 
                  onClick={registerOrder}
                  disabled={cart.length === 0}
                  className="flex-[1.5] py-4 bg-primary text-dark font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:grayscale text-[10px]"
                >
                  Cobrar y Registrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatHub;
