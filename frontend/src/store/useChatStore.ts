import { create } from 'zustand';
import axios from 'axios';
import { useInstanceStore } from './useInstanceStore';

const normalizeJid = (jid: string) => {
  if (!jid) return '';
  return jid.split('@')[0].split(':')[0];
};

const isRealPhoneJid = (jid: string) => {
  return jid.includes('@s.whatsapp.net');
};

const jidToNumber = (jid: string) => {
  if (!jid) return '';
  return jid.split('@')[0].split(':')[0];
};

export interface Message {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message?: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
    [key: string]: any;
  };
  messageTimestamp: number;
}

export interface Chat {
  remoteJid: string;
  name: string | null;
  profilePicUrl: string | null;
  lastMessage: string | null;
  unreadMessages: number;
  email?: string | null;
  phoneNumber?: string | null;
}

interface ChatState {
  chats: Chat[];
  messages: Message[];
  activeChat: Chat | null;
  activeInstance: string | null;
  loading: boolean;
  error: string | null;
  fetchChats: () => Promise<void>;
  fetchMessages: (remoteJid: string) => Promise<void>;
  sendMessage: (remoteJid: string, text: string) => Promise<void>;
  setActiveChat: (chat: Chat | null) => void;
  upsertChatWithLatestMessage: (msg: Message) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  messages: [],
  activeChat: null,
  activeInstance: null,
  loading: false,
  error: null,

  setActiveChat: (chat) => {
    set({ activeChat: chat, messages: [] });
  },

  fetchChats: async () => {
    const token = localStorage.getItem('avri_token');
    const instance = useInstanceStore.getState().activeInstance;
    if (!token || !instance) return;

    // Only set loading on the very first load to avoid flickering during polling
    if (get().chats.length === 0) set({ loading: true });
    
    try {
      const response = await axios.get(`/chat/fetchChats/${instance.instanceName}`, {
        headers: { apikey: token }
      });
      
      const incomingChats = Array.isArray(response.data) ? response.data : [];
      
      set((state) => {
        // Build a map of current chats by normalized number to handle LIDs
        const chatMap = new Map<string, Chat>();
        
        // Strategy: We want to group by phone number. 
        // If we have a real JID (@s.whatsapp.net) and a LID (@lid) for the same number,
        // we should merge them or prioritize the one with better info.
        
        // 1. Load existing state into map (preserving names/pics)
        state.chats.forEach(c => {
          const num = jidToNumber(c.remoteJid);
          chatMap.set(num, c);
        });

        // 2. Process incoming chats
        incomingChats.forEach((chat: any) => {
          const num = jidToNumber(chat.remoteJid);
          const existing = chatMap.get(num);
          
          const normalizedChat: Chat = {
            remoteJid: chat.remoteJid,
            name: chat.name || existing?.name || null,
            profilePicUrl: chat.profilePicUrl || existing?.profilePicUrl || null,
            lastMessage: chat.lastMessage || existing?.lastMessage || null,
            unreadMessages: chat.unreadMessages ?? 0,
            email: chat.Contact?.email || existing?.email || null,
          };

          // If current is LID but incoming is real JID, prefer real JID
          if (existing && !isRealPhoneJid(existing.remoteJid) && isRealPhoneJid(chat.remoteJid)) {
            chatMap.set(num, normalizedChat);
          } else if (!existing) {
            chatMap.set(num, normalizedChat);
          } else {
            // Merge unread and latest info
            chatMap.set(num, {
              ...existing,
              ...normalizedChat,
              unreadMessages: normalizedChat.unreadMessages || existing.unreadMessages
            });
          }
        });

        return { 
          chats: Array.from(chatMap.values()).sort((a, b) => (b.unreadMessages || 0) - (a.unreadMessages || 0)), 
          loading: false,
          activeInstance: instance.instanceName 
        };
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchMessages: async (remoteJid) => {
    const token = localStorage.getItem('avri_token');
    const instance = useInstanceStore.getState().activeInstance;
    if (!token || !instance) return;

    try {
      const response = await axios.get(`/chat/fetchMessages/${instance.instanceName}`, {
        headers: { apikey: token },
        params: { remoteJid }
      });
      
      const newMessages = Array.isArray(response.data) ? response.data : 
                          (response.data?.messages ? response.data.messages : []);
      
      // Only update if content changed to prevent re-renders
      if (JSON.stringify(newMessages) !== JSON.stringify(get().messages)) {
        set({ messages: newMessages });
      }
    } catch (err: any) {
      console.error('Error fetching messages:', err);
    }
  },

  sendMessage: async (remoteJid, text) => {
    const token = localStorage.getItem('avri_token');
    const instance = useInstanceStore.getState().activeInstance;
    if (!token || !instance) return;

    try {
      await axios.post(`/message/sendText/${instance.instanceName}`, {
        number: remoteJid,
        text,
        delay: 1000
      }, {
        headers: { apikey: token }
      });
      
      // Refresh messages immediately
      get().fetchMessages(remoteJid);
    } catch (err: any) {
      console.error('Error sending message:', err);
    }
  },

  upsertChatWithLatestMessage: (msg: Message) => {
    const remoteJid = msg.key.remoteJid;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || 'Nuevo mensaje';
    const num = jidToNumber(remoteJid);

    set((state) => {
      const chatMap = new Map<string, Chat>();
      state.chats.forEach(c => chatMap.set(jidToNumber(c.remoteJid), c));

      const existing = chatMap.get(num);
      if (existing) {
        chatMap.set(num, {
          ...existing,
          lastMessage: text,
          unreadMessages: msg.key.fromMe ? existing.unreadMessages : (existing.unreadMessages + 1)
        });
      } else {
        chatMap.set(num, {
          remoteJid,
          name: msg.pushName || num,
          profilePicUrl: null,
          lastMessage: text,
          unreadMessages: msg.key.fromMe ? 0 : 1
        });
      }

      return { 
        chats: Array.from(chatMap.values()).sort((a, b) => b.unreadMessages - a.unreadMessages) 
      };
    });
  }
}));
