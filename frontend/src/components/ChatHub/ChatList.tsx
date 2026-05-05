import React, { useState } from 'react';
import { Search, Filter, Bot } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useThemeStore } from '../../store/useThemeStore';
import { cn } from '../../utils/cn';

export const ChatList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { chats, loadingChats, selectedChat, setSelectedChat } = useChatStore();
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);

  const filteredChats = chats.filter(chat => 
    chat.pushName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.remoteJid.includes(searchTerm)
  );

  return (
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
                  ? "theme-surface-alt border-l-primary shadow-lg" 
                  : "hover:bg-surface-hover"
              )}
            >
              <div className="relative shrink-0">
                <div className={cn(
                  "w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border border-border-soft",
                  resolvedTheme === 'dark' ? "bg-[#2a2b2e]" : "bg-gray-100"
                )}>
                  {chat.profilePicUrl ? (
                    <img src={chat.profilePicUrl} alt={chat.pushName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-xs font-bold text-gray-500">{chat.pushName?.substring(0, 2).toUpperCase() || '??'}</div>
                  )}
                </div>
                {chat.controlMode === 'AI' && (
                  <div className={cn(
                    "absolute -bottom-1 -right-1 p-1 bg-primary rounded-full border-2 shadow-sm",
                    resolvedTheme === 'dark' ? "border-[#0f1012]" : "border-white"
                  )}>
                    <Bot className="w-2 h-2 text-dark" />
                  </div>
                )}
              </div>
              <div className="flex-1 text-left min-w-0 pt-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm text-theme-text truncate pr-2">
                    {chat.pushName}
                  </h4>
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
  );
};
