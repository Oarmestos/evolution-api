import { create } from 'zustand';
import axios from 'axios';

export interface Chat {
  id: string;
  remoteJid: string;
  pushName: string;
  profilePicUrl?: string;
  lastMessage?: {
    message?: string | any;
    messageTimestamp?: number;
  };
  unreadCount: number;
  controlMode: 'AI' | 'HUMAN';
  updatedAt: string;
}

export interface Message {
  id: string;
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  pushName?: string;
  messageType: string;
  message: any;
  messageTimestamp: number;
  status?: string;
}

export interface InternalNote {
  id: string;
  content: string;
  createdAt: string;
  User: {
    name: string;
    email: string;
  };
}

interface ChatState {
  chats: Chat[];
  messages: Message[];
  notes: InternalNote[];
  loadingChats: boolean;
  loadingMessages: boolean;
  selectedChat: Chat | null;
  fetchChats: (instanceName: string) => Promise<void>;
  fetchMessages: (instanceName: string, remoteJid: string) => Promise<void>;
  fetchNotes: (instanceName: string, remoteJid: string) => Promise<void>;
  updateControlMode: (instanceName: string, remoteJid: string, mode: 'AI' | 'HUMAN') => Promise<void>;
  createInternalNote: (instanceName: string, remoteJid: string, content: string) => Promise<void>;
  sendMessage: (instanceName: string, remoteJid: string, text: string) => Promise<void>;
  setSelectedChat: (chat: Chat | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  messages: [],
  notes: [],
  loadingChats: false,
  loadingMessages: false,
  selectedChat: null,

  setSelectedChat: (chat) => set({ selectedChat: chat, messages: [], notes: [] }),

  fetchChats: async (instanceName) => {
    const token = localStorage.getItem('avri_token');
    set({ loadingChats: true });
    try {
      const response = await axios.post(`/chat/findChats/${instanceName}`, {}, {
        headers: { apikey: token }
      });
      set({ chats: response.data, loadingChats: false });
    } catch (error) {
      console.error('Error fetching chats:', error);
      set({ loadingChats: false });
    }
  },

  fetchMessages: async (instanceName, remoteJid) => {
    const token = localStorage.getItem('avri_token');
    set({ loadingMessages: true });
    try {
      const response = await axios.post(`/chat/findMessages/${instanceName}`, {
        where: { key: { remoteJid } }
      }, {
        headers: { apikey: token }
      });
      // Evolution API returns messages in { messages: { records: [...] } }
      const records = response.data?.messages?.records || [];
      set({ messages: records.reverse(), loadingMessages: false });
    } catch (error) {
      console.error('Error fetching messages:', error);
      set({ loadingMessages: false });
    }
  },

  fetchNotes: async (instanceName, remoteJid) => {
    const token = localStorage.getItem('avri_token');
    try {
      const response = await axios.get(`/chat/fetchInternalNotes/${instanceName}?remoteJid=${remoteJid}`, {
        headers: { apikey: token }
      });
      set({ notes: response.data });
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  },

  updateControlMode: async (instanceName, remoteJid, mode) => {
    const token = localStorage.getItem('avri_token');
    try {
      await axios.post(`/chat/updateControlMode/${instanceName}`, { remoteJid, mode }, {
        headers: { apikey: token }
      });
      set((state) => ({
        chats: state.chats.map((c) => c.remoteJid === remoteJid ? { ...c, controlMode: mode } : c),
        selectedChat: state.selectedChat?.remoteJid === remoteJid ? { ...state.selectedChat, controlMode: mode } : state.selectedChat
      }));
    } catch (error) {
      console.error('Error updating control mode:', error);
    }
  },

  createInternalNote: async (instanceName, remoteJid, content) => {
    const token = localStorage.getItem('avri_token');
    try {
      const response = await axios.post(`/chat/createInternalNote/${instanceName}`, { remoteJid, content }, {
        headers: { apikey: token }
      });
      set((state) => ({ notes: [response.data, ...state.notes] }));
    } catch (error) {
      console.error('Error creating internal note:', error);
    }
  },

  sendMessage: async (instanceName, remoteJid, text) => {
    const token = localStorage.getItem('avri_token');
    try {
      await axios.post(`/message/sendText/${instanceName}`, {
        number: remoteJid,
        text,
        delay: 0,
        linkPreview: true
      }, {
        headers: { apikey: token }
      });
      // Optionally re-fetch messages or optimistically update
      get().fetchMessages(instanceName, remoteJid);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
}));
