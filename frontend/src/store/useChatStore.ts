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
    // Only show the loading skeleton on the very first fetch (no chats yet).
    // On subsequent polling cycles, update silently to avoid re-render flashes.
    const isFirstLoad = useChatStore.getState().chats.length === 0;
    if (isFirstLoad) set({ loadingChats: true });
    try {
      const response = await axios.post(`/chat/findChats/${instanceName}`, {}, {
        headers: { apikey: token }
      });
      const chats = normalizeChats(response.data);
      set((state) => {
        // Deep-merge the refreshed chat data into selectedChat, preserving
        // non-empty existing values so that pushName / contact info is never
        // overwritten by an empty payload from the backend.
        let nextSelectedChat = state.selectedChat;
        if (state.selectedChat) {
          const freshChat = chats.find((c) => c.remoteJid === state.selectedChat!.remoteJid);
          if (freshChat) {
            // Only update selectedChat if something meaningful actually changed
            // to avoid creating a new object reference on every poll.
            const hasChanges =
              freshChat.pushName !== state.selectedChat.pushName ||
              freshChat.unreadCount !== state.selectedChat.unreadCount ||
              freshChat.controlMode !== state.selectedChat.controlMode ||
              freshChat.lastMessage?.message !== state.selectedChat.lastMessage?.message;

            if (hasChanges) {
              nextSelectedChat = {
                ...state.selectedChat,
                ...freshChat,
                // Prefer non-empty values from the existing state
                pushName: (freshChat.pushName && freshChat.pushName !== freshChat.remoteJid)
                  ? freshChat.pushName
                  : (state.selectedChat!.pushName || freshChat.pushName),
                profilePicUrl: freshChat.profilePicUrl || state.selectedChat!.profilePicUrl,
                phoneNumber: freshChat.phoneNumber || state.selectedChat!.phoneNumber,
                email: freshChat.email || state.selectedChat!.email,
              };
            }
          }
        }
        return { chats, loadingChats: false, selectedChat: nextSelectedChat };
      });
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
      const remoteJid = String(raw.remoteJid ?? '');

      // Extract display name: prefer pushName, then Contact name.
      const rawPushName = raw.pushName || raw.name || '';
      
      // Use real phone number from the record if available; avoid showing LID
      const phoneNumber: string | undefined =
        raw.phoneNumber ??
        (isRealPhoneJid(remoteJid) ? jidToNumber(remoteJid) : undefined);

      // Determine the best display name. 
      // If rawPushName exists and isn't just the JID, use it.
      // Otherwise, use the formatted phone number.
      // Final fallback is a generic label to avoid showing technical LIDs.
      let displayName = rawPushName;
      if (!displayName || displayName === remoteJid || displayName === jidToNumber(remoteJid)) {
        displayName = phoneNumber ? `+${phoneNumber}` : 'Contacto sin nombre';
      }

      return {
        id: String(raw.id ?? remoteJid ?? crypto.randomUUID()),
        remoteJid,
        pushName: String(displayName),
        profilePicUrl: raw.profilePicUrl ?? undefined,
        lastMessage: raw.lastMessage
          ? {
              message: extractMessagePreview(raw.lastMessage.message),
              messageTimestamp: normalizeTimestamp(raw.lastMessage.messageTimestamp),
            }
          : undefined,
        unreadCount: Number(raw.unreadCount ?? raw.unreadMessages ?? 0),
        controlMode,
        phoneNumber,
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

  // Match by exact remoteJid first, then by normalized base (handles @lid vs @s.whatsapp.net mismatch)
  const existingChat =
    chats.find((c) => c.remoteJid === message.key.remoteJid) ??
    chats.find((c) => jidToNumber(c.remoteJid) === jidToNumber(message.key.remoteJid) && jidToNumber(c.remoteJid) !== '');
  
  // Build only the fields that change when a new message is sent.
  // Spread existingChat first so ALL existing contact data (phoneNumber, email,
  // profilePicUrl, pushName, etc.) is preserved and never lost.
  const source = existingChat ?? selectedChat;

  // Preserve the existing remoteJid (e.g. @lid) if found \u2014 do NOT replace it
  // with the message's JID which may use a different suffix (@s.whatsapp.net).
  const canonicalRemoteJid = existingChat?.remoteJid ?? message.key.remoteJid;

  const baseChat: Chat = {
    ...(source ?? {}),
    id: source?.id ?? canonicalRemoteJid,
    remoteJid: canonicalRemoteJid,
    // Determine best pushName: prefer source name (if it's not a JID/LID/Placeholder),
    // then message pushName, then formatted phone number.
    pushName: (() => {
      const currentName = source?.pushName;
      const isPlaceholder = !currentName || currentName === 'Contacto sin nombre' || currentName === source?.remoteJid || currentName === jidToNumber(source?.remoteJid || '');
      
      if (!isPlaceholder) return currentName;
      if (message.pushName) return message.pushName;
      if (source?.phoneNumber) return `+${source.phoneNumber}`;
      if (isRealPhoneJid(canonicalRemoteJid)) return `+${jidToNumber(canonicalRemoteJid)}`;
      return 'Contacto sin nombre';
    })(),
    profilePicUrl: source?.profilePicUrl,
    phoneNumber: source?.phoneNumber,
    email: source?.email,
    lastMessage: {
      message: preview,
      messageTimestamp: timestamp,
    },
    unreadCount: 0,
    controlMode: source?.controlMode ?? 'AI',
    updatedAt: new Date(timestamp * 1000).toISOString(),
  };

  const updated = existingChat
    ? chats.map((chat) => chat.remoteJid === existingChat.remoteJid ? { ...chat, ...baseChat } : chat)
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
  return `${jidToNumber(message.key.remoteJid)}:${message.key.id || message.id}`;
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

// \u2500\u2500\u2500 JID Utilities \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

/**
 * Extracts only the numeric/alphanumeric base from a WhatsApp JID.
 * e.g. "176957652254939@lid" \u2192 "176957652254939"
 *      "573001234567@s.whatsapp.net" \u2192 "573001234567"
 *      "120363@g.us" \u2192 "120363"
 */
function jidToNumber(jid: string): string {
  return jid ? jid.split('@')[0] : '';
}

/**
 * Returns true if the JID corresponds to a real E.164 phone number.
 * LID JIDs (e.g. @lid) and group JIDs (@g.us) are excluded.
 * Real phone JIDs end with @s.whatsapp.net and have a purely numeric base.
 */
function isRealPhoneJid(jid: string): boolean {
  if (!jid) return false;
  const [base, suffix] = jid.split('@');
  if (!suffix) return false;
  // Groups end with g.us, LIDs end with lid
  if (suffix === 'g.us' || suffix === 'lid') return false;
  // Broadcast list
  if (suffix === 'broadcast') return false;
  // Must be all digits (E.164 without +)
  if (!/^\d+$/.test(base)) return false;
  // LIDs typically have 15 digits and start with 1. Real phone numbers are usually shorter
  // or don't match the LID pattern precisely.
  if (base.length === 15 && base.startsWith('1')) return false;
  
  return true;
}
