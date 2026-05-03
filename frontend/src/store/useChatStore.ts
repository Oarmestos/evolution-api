import { create } from 'zustand';
import axios from 'axios';

type MessageKey = {
  remoteJid: string;
  fromMe: boolean;
  id: string;
};

type RawMessage = {
  id?: string;
  key?: Partial<MessageKey>;
  pushName?: string;
  messageType?: string;
  message?: Record<string, any>;
  messageTimestamp?: number | string;
  status?: string;
  MessageUpdate?: Array<{ status?: string }>;
};

export interface Chat {
  id: string;
  remoteJid: string;
  pushName: string;
  profilePicUrl?: string;
  lastMessage?: {
    message?: string;
    messageTimestamp?: number;
  };
  unreadCount: number;
  controlMode: 'AI' | 'HUMAN';
  phoneNumber?: string;
  email?: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  key: MessageKey;
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
  updateContact: (instanceName: string, remoteJid: string, data: { pushName?: string; phoneNumber?: string; email?: string }) => Promise<void>;
  setSelectedChat: (chat: Chat | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
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
      const chats = normalizeChats(response.data);
      set((state) => ({
        chats,
        loadingChats: false,
        selectedChat: state.selectedChat
          ? chats.find((chat) => chat.remoteJid === state.selectedChat?.remoteJid) ?? state.selectedChat
          : null
      }));
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
      const messages = records.map(normalizeMessage).reverse();
      set((state) => ({
        messages: mergeMessages(messages, state.messages.filter((message) => isLocalOnlyMessage(message))),
        loadingMessages: false
      }));
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
      const response = await axios.post(`/message/sendText/${instanceName}`, {
        number: remoteJid,
        text,
        delay: 0,
        linkPreview: true
      }, {
        headers: { apikey: token }
      });

      const sentMessage = normalizeMessage(response.data, {
        remoteJid,
        fallbackText: text,
      });

      set((state) => {
        const updatedChats = upsertChatWithLatestMessage(state.chats, state.selectedChat, sentMessage);
        const selectedChat = state.selectedChat?.remoteJid === remoteJid
          ? updatedChats.find((chat) => chat.remoteJid === remoteJid) ?? state.selectedChat
          : state.selectedChat;

        return {
          chats: updatedChats,
          selectedChat,
          messages: mergeMessages(state.messages, [sentMessage]),
        };
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  },
 
  updateContact: async (instanceName, remoteJid, data) => {
    const token = localStorage.getItem('avri_token');
    try {
      const response = await axios.patch(`/chat/updateContact/${instanceName}`, { remoteJid, ...data }, {
        headers: { apikey: token }
      });
      const updatedContact = response.data;
      set((state) => ({
        chats: state.chats.map((c) => c.remoteJid === remoteJid ? { 
          ...c, 
          pushName: updatedContact.pushName || c.pushName,
          phoneNumber: updatedContact.phoneNumber || c.phoneNumber,
          email: updatedContact.email || c.email
        } : c),
        selectedChat: state.selectedChat?.remoteJid === remoteJid ? { 
          ...state.selectedChat, 
          pushName: updatedContact.pushName || state.selectedChat.pushName,
          phoneNumber: updatedContact.phoneNumber || state.selectedChat.phoneNumber,
          email: updatedContact.email || state.selectedChat.email
        } : state.selectedChat
      }));
    } catch (error) {
      console.error('Error updating contact:', error);
    }
  }
}));

function normalizeChats(data: unknown): Chat[] {
  if (!Array.isArray(data)) return [];

  return data
    .filter(Boolean)
    .map((raw: any) => {
      const controlMode: Chat['controlMode'] = raw.controlMode === 'HUMAN' ? 'HUMAN' : 'AI';

      return {
        id: String(raw.id ?? raw.remoteJid ?? crypto.randomUUID()),
        remoteJid: String(raw.remoteJid ?? ''),
        pushName: String(raw.pushName ?? raw.remoteJid ?? ''),
        profilePicUrl: raw.profilePicUrl ?? undefined,
        lastMessage: raw.lastMessage
          ? {
              message: extractMessagePreview(raw.lastMessage.message),
              messageTimestamp: normalizeTimestamp(raw.lastMessage.messageTimestamp),
            }
          : undefined,
        unreadCount: Number(raw.unreadCount ?? raw.unreadMessages ?? 0),
        controlMode,
        phoneNumber: raw.phoneNumber ?? undefined,
        email: raw.email ?? undefined,
        updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
      };
    })
    .filter((chat) => chat.remoteJid);
}

function normalizeMessage(raw: RawMessage, options?: { remoteJid?: string; fallbackText?: string }): Message {
  const keyId = raw?.key?.id ?? raw?.id ?? `local-${Date.now()}`;
  const remoteJid = raw?.key?.remoteJid ?? options?.remoteJid ?? '';
  const message = raw?.message ?? createFallbackMessage(options?.fallbackText);

  return {
    id: raw?.id ?? keyId,
    key: {
      remoteJid,
      fromMe: Boolean(raw?.key?.fromMe),
      id: keyId,
    },
    pushName: raw?.pushName ?? undefined,
    messageType: raw?.messageType ?? inferMessageType(message),
    message,
    messageTimestamp: normalizeTimestamp(raw?.messageTimestamp),
    status: raw?.status ?? raw?.MessageUpdate?.[0]?.status,
  };
}

function upsertChatWithLatestMessage(chats: Chat[], selectedChat: Chat | null, message: Message): Chat[] {
  const preview = extractMessagePreview(message.message);
  const timestamp = message.messageTimestamp;
  const existingChat = chats.find((c) => c.remoteJid === message.key.remoteJid);
  
  const baseChat: Chat = {
    id: existingChat?.id ?? selectedChat?.id ?? message.key.remoteJid,
    remoteJid: message.key.remoteJid,
    pushName: existingChat?.pushName ?? selectedChat?.pushName ?? message.key.remoteJid.split('@')[0],
    profilePicUrl: existingChat?.profilePicUrl ?? selectedChat?.profilePicUrl,
    lastMessage: {
      message: preview,
      messageTimestamp: timestamp,
    },
    unreadCount: 0,
    controlMode: existingChat?.controlMode ?? selectedChat?.controlMode ?? 'AI',
    updatedAt: new Date(timestamp * 1000).toISOString(),
  };

  const updated = existingChat
    ? chats.map((chat) => chat.remoteJid === message.key.remoteJid ? { ...chat, ...baseChat } : chat)
    : [baseChat, ...chats];

  return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

function mergeMessages(existing: Message[], incoming: Message[]): Message[] {
  const byId = new Map<string, Message>();

  [...existing, ...incoming].forEach((message) => {
    byId.set(getMessageIdentity(message), message);
  });

  return [...byId.values()].sort((a, b) => a.messageTimestamp - b.messageTimestamp);
}

function getMessageIdentity(message: Message): string {
  return `${message.key.remoteJid}:${message.key.id || message.id}`;
}

function isLocalOnlyMessage(message: Message): boolean {
  return message.id.startsWith('local-');
}

function normalizeTimestamp(value?: number | string): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return Math.floor(Date.now() / 1000);
}

function inferMessageType(message: Record<string, any>): string {
  const types = Object.keys(message ?? {}).filter((key) => key !== 'messageContextInfo');
  return types[0] ?? 'conversation';
}

function createFallbackMessage(text?: string): Record<string, any> {
  return text ? { conversation: text } : {};
}

function extractMessagePreview(message: Record<string, any> | undefined): string {
  if (!message) return '';

  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    message.documentMessage?.caption ||
    message.documentWithCaptionMessage?.caption ||
    message.pollCreationMessage?.name ||
    '[Tipo de mensaje no soportado]'
  );
}
