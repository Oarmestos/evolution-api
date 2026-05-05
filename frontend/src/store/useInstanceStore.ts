import { create } from 'zustand';
import axios from 'axios';

export interface Instance {
  instanceName: string;
  instanceId: string;
  profileName?: string;
  profilePicUrl?: string;
  number?: string;
  integration?: string;
  connectionStatus: 'open' | 'close' | 'connecting' | string;
}

interface InstanceState {
  instances: Instance[];
  activeInstance: Instance | null;
  loading: boolean;
  error: string | null;
  lastQrCodeBase64: string | null;
  lastCreatedInstanceName: string | null;
  setActiveInstance: (instance: Instance | null) => void;
  clearLastQrCode: () => void;
  fetchInstances: () => Promise<void>;
  createInstance: (name: string) => Promise<void>;
  connectInstance: (name: string) => Promise<string | null>;
  logoutInstance: (name: string) => Promise<void>;
  deleteInstance: (name: string) => Promise<void>;
}

type InstanceApiModel = {
  id?: string;
  name?: string;
  instanceId?: string;
  instanceName?: string;
  ownerJid?: string | null;
  profileName?: string | null;
  profilePicUrl?: string | null;
  number?: string | null;
  integration?: string | null;
  connectionStatus?: string | null;
};

function normalizeInstances(data: unknown): Instance[] {
  if (!Array.isArray(data)) return [];
  return (data as InstanceApiModel[])
    .filter(Boolean)
    .map((raw) => {
      const instanceId = raw.id ?? raw.instanceId ?? '';
      const instanceName = raw.name ?? raw.instanceName ?? '';
      const numberFallback =
        raw.ownerJid && typeof raw.ownerJid === 'string' ? raw.ownerJid.split('@')?.[0] : undefined;
      return {
        instanceId,
        instanceName,
        profileName: raw.profileName ?? undefined,
        profilePicUrl: raw.profilePicUrl ?? undefined,
        number: raw.number ?? numberFallback,
        integration: raw.integration ?? undefined,
        connectionStatus: raw.connectionStatus ?? 'close',
      };
    })
    .filter((i) => i.instanceId && i.instanceName);
}

const getStoredActiveInstance = (): Instance | null => {
  const stored = localStorage.getItem('avri_active_instance');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
};

export const useInstanceStore = create<InstanceState>((set, get) => ({
  instances: [],
  activeInstance: getStoredActiveInstance(),
  loading: false,
  error: null,
  lastQrCodeBase64: null,
  lastCreatedInstanceName: null,
  setActiveInstance: (instance) => {
    set({ activeInstance: instance });
    if (instance) {
      localStorage.setItem('avri_active_instance', JSON.stringify(instance));
    } else {
      localStorage.removeItem('avri_active_instance');
    }
  },
  clearLastQrCode: () => set({ lastQrCodeBase64: null, lastCreatedInstanceName: null }),
  fetchInstances: async () => {
    const token = localStorage.getItem('avri_token');
    if (!token) return;

    set({ loading: true, error: null });
    try {
      const response = await axios.get('/instance/fetchInstances', {
        headers: { apikey: token }
      });
      const normalized = normalizeInstances(response.data);
      set({ instances: normalized, loading: false });

      // Auto-set active instance if none or if current one not in list.
      // IMPORTANT: Only call setActiveInstance when strictly necessary to avoid
      // creating a new object reference on every poll, which would cascade into
      // re-renders and interval restarts across the whole app.
      const currentActive = get().activeInstance;
      if (normalized.length > 0) {
        const matchInList = currentActive
          ? normalized.find((i) => i.instanceId === currentActive.instanceId)
          : null;

        if (!currentActive || !matchInList) {
          // No active instance or it was deleted — select the first one.
          get().setActiveInstance(normalized[0]);
        } else if (
          matchInList.connectionStatus !== currentActive.connectionStatus ||
          matchInList.profilePicUrl !== currentActive.profilePicUrl ||
          matchInList.profileName !== currentActive.profileName ||
          matchInList.number !== currentActive.number
        ) {
          // Silently update only the fields that changed without resetting the whole object reference.
          set((state) => ({
            activeInstance: state.activeInstance ? { ...state.activeInstance, ...matchInList } : matchInList,
          }));
          localStorage.setItem('avri_active_instance', JSON.stringify({ ...currentActive, ...matchInList }));
        }
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        import('../store/useAuthStore').then(m => m.useAuthStore.getState().logout());
      } else {
        set({ error: err.message, loading: false });
      }
    }
  },
  createInstance: async (name: string) => {
    const token = localStorage.getItem('avri_token');
    if (!token) return;

    set({ loading: true, error: null, lastQrCodeBase64: null, lastCreatedInstanceName: null });
    try {
      const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

      const createRes = await axios.post(
        '/instance/create',
        { instanceName: name, integration: 'WHATSAPP-BAILEYS', qrcode: true },
        {
        headers: { apikey: token }
        },
      );

      let qrBase64: string | null = createRes?.data?.qrcode?.base64 ?? null;

      // The backend may return before qrcode base64 is ready (it is generated async).
      // Poll /instance/connect/:instanceName until the QR base64 appears.
      if (!qrBase64) {
        for (let i = 0; i < 15; i++) {
          await wait(1000);
          try {
            // Primary route: /instance/connect/:instanceName
            const connectRes = await axios.get(`/instance/connect/${encodeURIComponent(name)}`, {
              headers: { apikey: token },
            });
            qrBase64 = connectRes?.data?.base64 ?? connectRes?.data?.qrcode?.base64 ?? null;
            if (qrBase64) break;
          } catch {
            // Fallback: some deployments may use query-based connect
            try {
              const connectRes2 = await axios.get(`/instance/connect`, {
                headers: { apikey: token },
                params: { instanceName: name },
              });
              qrBase64 = connectRes2?.data?.base64 ?? connectRes2?.data?.qrcode?.base64 ?? null;
              if (qrBase64) break;
            } catch {
              // keep polling; connect may fail briefly while instance is initializing
            }
          }
        }
      }

      set({ lastQrCodeBase64: qrBase64, lastCreatedInstanceName: name });
      const response = await axios.get('/instance/fetchInstances', {
        headers: { apikey: token }
      });
      set({ instances: normalizeInstances(response.data), loading: false });
    } catch (err: any) {
      if (err.response?.status === 401) {
        import('../store/useAuthStore').then((m) => m.useAuthStore.getState().logout());
      } else {
        set({ error: err.message, loading: false });
      }
    }
  },
  connectInstance: async (name: string) => {
    const token = localStorage.getItem('avri_token');
    if (!token) return null;

    try {
      const connectRes = await axios.get(`/instance/connect/${encodeURIComponent(name)}`, {
        headers: { apikey: token },
      });

      const base64 = connectRes?.data?.base64 ?? connectRes?.data?.qrcode?.base64 ?? null;
      if (base64) set({ lastQrCodeBase64: base64, lastCreatedInstanceName: name });
      return base64;
    } catch (err: any) {
      if (err.response?.status === 401) {
        import('../store/useAuthStore').then((m) => m.useAuthStore.getState().logout());
        return null;
      }
      // Fallback query-based route
      try {
        const connectRes2 = await axios.get(`/instance/connect`, {
          headers: { apikey: token },
          params: { instanceName: name },
        });
        const base64 = connectRes2?.data?.base64 ?? connectRes2?.data?.qrcode?.base64 ?? null;
        if (base64) set({ lastQrCodeBase64: base64, lastCreatedInstanceName: name });
        return base64;
      } catch (err2: any) {
        set({ error: err2.message ?? err.message });
        return null;
      }
    }
  },
  logoutInstance: async (name: string) => {
    const token = localStorage.getItem('avri_token');
    if (!token) return;

    set({ loading: true, error: null });
    try {
      await axios.delete(`/instance/logout/${encodeURIComponent(name)}`, {
        headers: { apikey: token },
      });

      const response = await axios.get('/instance/fetchInstances', {
        headers: { apikey: token },
      });
      set({ instances: normalizeInstances(response.data), loading: false, lastQrCodeBase64: null, lastCreatedInstanceName: null });
    } catch (err: any) {
      if (err.response?.status === 401) {
        import('../store/useAuthStore').then((m) => m.useAuthStore.getState().logout());
      } else {
        set({ error: err.message, loading: false });
      }
    }
  },
  deleteInstance: async (name: string) => {
    const token = localStorage.getItem('avri_token');
    if (!token) return;

    set({ loading: true, error: null });
    try {
      await axios.delete(`/instance/delete/${encodeURIComponent(name)}`, {
        headers: { apikey: token }
      });
      const response = await axios.get('/instance/fetchInstances', {
        headers: { apikey: token }
      });
      set({ instances: normalizeInstances(response.data), loading: false });
    } catch (err: any) {
      if (err.response?.status === 401) {
        import('../store/useAuthStore').then((m) => m.useAuthStore.getState().logout());
      } else {
        const apiMessage =
          err.response?.data?.message ||
          err.response?.data?.response?.message ||
          err.response?.data?.error ||
          null;
        set({ error: apiMessage ? String(apiMessage) : err.message, loading: false });
      }
    }
  }
}));
