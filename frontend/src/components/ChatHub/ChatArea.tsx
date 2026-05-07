import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, MoreVertical, MessageSquare, CheckCheck, Paperclip, Smile, Mic, X, Package, Store, Check as CheckIcon } from 'lucide-react';
import { useChatStore, extractMessagePreview } from '../../store/useChatStore';
import { useThemeStore } from '../../store/useThemeStore';
import { cn } from '../../utils/cn';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';
import { ProductSelectorModal } from './ProductSelectorModal';

interface ChatAreaProps {
  activeInstance: string | undefined;
  setShowContactInfo: (show: boolean) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ activeInstance, setShowContactInfo }) => {
  const { 
    messages, 
    loadingMessages, 
    selectedChat, 
    setSelectedChat, 
    sendMessage, 
    sendProduct,
    createInternalNote, 
    muteChat, 
    deleteChat 
  } = useChatStore();
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);

  const [inputText, setInputText] = useState('');
  const [inputTab, setInputTab] = useState<'reply' | 'note'>('reply');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [storeCopied, setStoreCopied] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMoreOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleSendProduct = async (productId: string) => {
    if (!activeInstance || !selectedChat) return;
    await sendProduct(activeInstance, selectedChat.remoteJid, productId);
    setShowCatalogModal(false);
  };

  return (
    <div className={cn(
      "flex-1 flex flex-col relative",
      resolvedTheme === 'dark' ? "bg-[#0f1012]" : "bg-white"
    )}>
      {!selectedChat ? (
        <div className="flex-1 flex flex-col items-center justify-center opacity-50">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-10 h-10 text-gray-800" />
          </div>
          <p className="text-gray-600 text-sm font-bold uppercase tracking-widest">Selecciona una conversacion</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="theme-surface-deep h-16 px-6 border-b border-white/5 flex items-center justify-between backdrop-blur-md relative z-10">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border border-border-soft shrink-0",
                resolvedTheme === 'dark' ? "bg-[#2a2b2e]" : "bg-gray-100"
              )}>
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
                    {selectedChat.phoneNumber ? `+${selectedChat.phoneNumber}` : 'Chat de WhatsApp'}
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
                  title="Mas opciones"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {showMoreOptions && (
                  <div className="absolute right-0 mt-2 w-48 theme-surface-alt border border-border-strong rounded-xl shadow-2xl z-[100] py-2 animate-in fade-in slide-in-from-top-2">
                    <button 
                      onClick={() => {
                        setShowContactInfo(true);
                        setShowMoreOptions(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-theme-muted hover:text-theme-text hover:bg-surface-hover transition-colors flex items-center gap-2"
                    >
                      <MoreVertical size={14} /> Ver Detalles
                    </button>
                    <button 
                      onClick={() => {
                        if (activeInstance && selectedChat) {
                          muteChat(activeInstance, selectedChat.remoteJid);
                          setShowMoreOptions(false);
                        }
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-theme-muted hover:text-theme-text hover:bg-surface-hover transition-colors flex items-center gap-2"
                    >
                      <Bot size={14} /> Silenciar Chat
                    </button>
                    <div className="h-px bg-white/5 my-2"></div>
                    <button 
                      onClick={() => {
                        setSelectedChat(null);
                        setShowMoreOptions(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-theme-muted hover:text-theme-text hover:bg-surface-hover transition-colors flex items-center gap-2"
                    >
                      <X size={14} /> Cerrar Chat
                    </button>
                    <button 
                      onClick={() => {
                        if (activeInstance && selectedChat && confirm('Estas seguro de que deseas eliminar este chat? Esta accion no se puede deshacer.')) {
                          deleteChat(activeInstance, selectedChat.remoteJid);
                          setShowMoreOptions(false);
                        }
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                    >
                      <X size={14} /> Eliminar Chat
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
          <div className={cn(
            "flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar relative",
            resolvedTheme === 'dark' 
              ? "bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')]" 
              : "bg-[url('https://www.transparenttextures.com/patterns/pinstripe-light.png')]"
          )}>
            <div className={cn(
              "absolute inset-0 pointer-events-none",
              resolvedTheme === 'dark' ? "bg-[#0f1012]/40" : "bg-white/10"
            )}></div>
            <div className="relative z-10 space-y-6">
              {loadingMessages && messages.length === 0 ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <>
                  <div className="flex justify-center">
                    <span className="theme-chip px-3 py-1 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Inicio de la conversacion</span>
                  </div>
                  
                  {messages.map((msg, i) => {
                    const fromMe = msg.key.fromMe;
                    return (
                      <div key={msg.id || i} className={cn("flex", fromMe ? "justify-end" : "justify-start")}>
                        <div className="max-w-[80%] flex flex-col gap-1">
                          <div className={cn(
                            "rounded-2xl px-4 py-3 text-sm shadow-sm transition-all",
                            fromMe 
                              ? "bg-primary text-black font-medium rounded-tr-none shadow-primary/10" 
                              : "theme-surface-alt text-theme-text border border-border-soft rounded-tl-none hover:border-border-strong shadow-soft/5"
                          )}>
                            {extractMessagePreview(msg.message)}
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
                      theme={resolvedTheme === 'dark' ? Theme.DARK : Theme.LIGHT}
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
                    onClick={() => setShowCatalogModal(true)}
                    className="p-2 text-gray-500 hover:text-primary transition-all hover:bg-primary/10 rounded-xl"
                    title="Catálogo de Productos"
                  >
                    <Package className="w-5 h-5" />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      const storeUrl = `${window.location.origin}/store/${activeInstance}`;
                      navigator.clipboard.writeText(storeUrl).then(() => {
                        setStoreCopied(true);
                        setTimeout(() => setStoreCopied(false), 2000);
                      });
                      window.open(storeUrl, '_blank');
                    }}
                    className={cn(
                      "p-2 transition-all rounded-xl",
                      storeCopied
                        ? "text-green-400 bg-green-500/10"
                        : "text-gray-500 hover:text-green-500 hover:bg-green-500/10"
                    )}
                    title="Abrir Tienda"
                  >
                    {storeCopied ? <CheckIcon className="w-5 h-5" /> : <Store className="w-5 h-5" />}
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
                  placeholder={inputTab === 'reply' ? "Escribe un mensaje aqui..." : "Escribe una nota interna para el equipo..."}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className={cn(
                    "theme-input w-full rounded-2xl py-5 pl-[220px] pr-[100px] text-sm focus:ring-2 transition-all outline-none border-white/5",
                    inputTab === 'reply' ? "focus:ring-primary/20" : "focus:ring-secondary/20"
                  )}
                />
                <div className="flex items-center gap-1 absolute right-3 top-1/2 -translate-y-1/2 z-10">
                  <button 
                    type="button" 
                    onClick={() => alert('Grabacion de audio (Proximamente)')}
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

      {/* Product Selector Modal */}
      {activeInstance && (
        <ProductSelectorModal
          isOpen={showCatalogModal}
          onClose={() => setShowCatalogModal(false)}
          onSelect={handleSendProduct}
          instanceName={activeInstance}
        />
      )}
    </div>
  );
};
