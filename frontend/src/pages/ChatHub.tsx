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
  Users
} from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useInstanceStore } from '../store/useInstanceStore';
import { cn } from '../utils/cn';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (activeInstance && selectedChat) {
      fetchMessages(activeInstance, selectedChat.remoteJid);
      fetchNotes(activeInstance, selectedChat.remoteJid);
      
      const interval = setInterval(() => {
        fetchMessages(activeInstance, selectedChat.remoteJid);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeInstance, selectedChat, fetchMessages, fetchNotes]);

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

  const filteredChats = chats.filter(chat => 
    chat.pushName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.remoteJid.includes(searchTerm)
  );

  return (
    <div className="theme-surface h-[calc(100vh-140px)] flex gap-0.5 overflow-hidden rounded-3xl">
      {/* Column 1: Chat List */}
      <div className="theme-surface-deep w-[320px] flex flex-col border-r border-white/5">
        <div className="p-4 space-y-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="theme-input w-full rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary/50 transition-all"
            />
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{chats.length} conversas</span>
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
                    <div className="absolute -bottom-1 -right-1 p-1 bg-primary rounded-full border-2 border-[#0f1012]">
                      <Bot className="w-2 h-2 text-dark" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0 pt-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-gray-200 truncate pr-2">{chat.pushName || chat.remoteJid.split('@')[0]}</h4>
                    <span className="text-[10px] text-gray-600 font-medium">Agora</span>
                  </div>
                  <p className={cn(
                    "text-xs mt-0.5 truncate",
                    chat.unreadCount > 0 ? "text-white font-medium" : "text-gray-500"
                  )}>
                    {chat.lastMessage?.message || 'Sem mensagens'}
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
      <div className="flex-1 flex flex-col relative">
        {!selectedChat ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-gray-800" />
            </div>
            <p className="text-gray-600 text-sm font-bold uppercase tracking-widest">Selecione uma conversa</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="theme-surface-deep h-16 px-6 border-b border-white/5 flex items-center justify-between backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2a2b2e] flex items-center justify-center text-xs font-bold text-gray-400 border border-white/5">
                  {selectedChat.pushName?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm leading-tight">{selectedChat.pushName}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-500">cliente-alpha</span>
                    <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                    <span className="text-[10px] text-gray-500">Status: Em andamento</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="p-2 text-gray-500 hover:text-white transition-colors"><MoreVertical className="w-5 h-5" /></button>
                <button 
                  onClick={() => setSelectedChat(null)}
                  className="p-2 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')]">
              {loadingMessages && messages.length === 0 ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <>
                  <div className="flex justify-center">
                    <span className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Início da conversa</span>
                  </div>
                  
                  {messages.map((msg, i) => {
                    const fromMe = msg.key.fromMe;
                    return (
                      <div key={msg.id || i} className={cn("flex", fromMe ? "justify-end" : "justify-start")}>
                        <div className="max-w-[80%] flex flex-col gap-1">
                          <div className={cn(
                            "rounded-2xl px-4 py-3 text-sm shadow-xl",
                            fromMe 
                              ? "bg-primary text-dark font-medium rounded-tr-none" 
                              : "theme-surface-alt text-gray-100 border border-white/5 rounded-tl-none"
                          )}>
                            {msg.message?.conversation || msg.message?.extendedTextMessage?.text || "[Tipo de mensagem não suportado]"}
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

            {/* Input Area */}
            <div className="theme-surface-deep p-6 border-t border-white/5">
              <div className="max-w-4xl mx-auto space-y-4">
                {/* Tabs */}
                <div className="flex gap-4 px-2">
                  <button 
                    onClick={() => setInputTab('reply')}
                    className={cn(
                      "text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all pb-2 border-b-2",
                      inputTab === 'reply' ? "text-primary border-primary" : "text-gray-600 border-transparent hover:text-gray-400"
                    )}
                  >
                    <div className={cn("w-2 h-2 rounded-full", inputTab === 'reply' ? "bg-primary" : "bg-gray-800")}></div>
                    Resposta
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

                {/* Input Field */}
                <form onSubmit={handleSend} className="relative group">
                  <div className="flex items-center gap-2 absolute left-4 top-1/2 -translate-y-1/2">
                    <button type="button" className="p-2 text-gray-600 hover:text-white transition-colors"><Paperclip className="w-5 h-5" /></button>
                    <button type="button" className="p-2 text-gray-600 hover:text-white transition-colors"><Smile className="w-5 h-5" /></button>
                  </div>
                  <input 
                    type="text" 
                    placeholder={inputTab === 'reply' ? "Digite sua mensagem... (digite / para respostas prontas)" : "Digite uma nota interna..."}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className={cn(
                      "theme-input w-full rounded-2xl py-4 pl-24 pr-16 text-sm focus:ring-1 transition-all",
                      inputTab === 'reply' ? "focus:ring-primary/30" : "focus:ring-secondary/30"
                    )}
                  />
                  <div className="flex items-center gap-2 absolute right-4 top-1/2 -translate-y-1/2">
                    <button type="button" className="p-2 text-gray-600 hover:text-white transition-colors"><Mic className="w-5 h-5" /></button>
                    <button 
                      type="submit"
                      className={cn(
                        "p-2 rounded-xl transition-all active:scale-90",
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
              <h3 className="text-lg font-bold text-white">{selectedChat.pushName}</h3>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Online</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 font-mono bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
              +{selectedChat.remoteJid.split('@')[0]}
            </div>
          </div>

          <div className="space-y-4">
            {/* Mode Switch */}
            <div className="theme-surface-alt rounded-2xl p-4 space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 flex items-center gap-2">
                <Bot className="w-3.5 h-3.5" /> Controle de Fluxo
              </h4>
              <div className="theme-chip flex p-1 rounded-xl">
                <button 
                  onClick={() => activeInstance && updateControlMode(activeInstance, selectedChat.remoteJid, 'AI')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all",
                    selectedChat.controlMode === 'AI' ? "bg-primary text-dark" : "text-gray-500 hover:text-gray-300"
                  )}
                >
                  Inteligência
                </button>
                <button 
                  onClick={() => activeInstance && updateControlMode(activeInstance, selectedChat.remoteJid, 'HUMAN')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all",
                    selectedChat.controlMode === 'HUMAN' ? "bg-secondary text-dark" : "text-gray-500 hover:text-gray-300"
                  )}
                >
                  Humano
                </button>
              </div>
            </div>

            {/* Info Sections */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-500 group-hover:text-primary" />
                  <span className="text-xs font-bold text-gray-400">Informações do Contato</span>
                </div>
                <MoreVertical className="w-4 h-4 text-gray-700" />
              </div>
              
              <div className="theme-surface-alt rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5" /> Ventas / Leads
                  </h4>
                </div>
                <div className="space-y-3">
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase">Estado del Lead</p>
                      <p className="text-xs font-bold text-white mt-0.5">Nuevo Prospecto</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <button className="w-full py-2.5 bg-primary text-dark text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                    Convertir a Lead
                  </button>
                </div>
              </div>

              {/* Internal Notes Preview */}
              <div className="theme-surface-alt rounded-2xl p-4 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 flex items-center gap-2">
                  <StickyNote className="w-3.5 h-3.5" /> Notas Recentes
                </h4>
                <div className="space-y-2">
                  {notes.slice(0, 2).map(note => (
                    <div key={note.id} className="theme-chip p-3 rounded-xl">
                      <p className="text-[10px] text-gray-400 line-clamp-2">{note.content}</p>
                      <div className="flex justify-between mt-2">
                        <span className="text-[8px] font-bold text-primary uppercase">{note.User?.name}</span>
                        <span className="text-[8px] text-gray-700">{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
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
