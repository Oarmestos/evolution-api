import { create } from 'zustand';
import axios from 'axios';

export interface Instance {
  instanceName: string;
  instanceId: string;
  owner?: string;
  profileName?: string;
  profilePicUrl?: string;
  number?: string;
  status: 'open' | 'close' | 'connecting';
}

interface InstanceState {
  instances: Instance[];
  loading: boolean;
  error: string | null;
  fetchInstances: () => Promise<void>;
  createInstance: (name: string) => Promise<void>;
  deleteInstance: (name: string) => Promise<void>;
}

export const useInstanceStore = create<InstanceState>((set) => ({
  instances: [],
  loading: false,
  error: null,
  fetchInstances: async () => {
    const token = localStorage.getItem('avri_token');
    if (!token) return;

    set({ loading: true, error: null });
    try {
      const response = await axios.get('/instance/fetchInstances', {
        headers: { apikey: token }
      });
      set({ instances: response.data, loading: false });
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

    set({ loading: true, error: null });
    try {
      await axios.post('/instance/create', { instanceName: name }, {
        headers: { apikey: token }
      });
      const response = await axios.get('/instance/fetchInstances', {
        headers: { apikey: token }
      });
      set({ instances: response.data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  deleteInstance: async (name: string) => {
    const token = localStorage.getItem('avri_token');
    if (!token) return;

    set({ loading: true, error: null });
    try {
      await axios.delete(`/instance/delete/${name}`, {
        headers: { apikey: token }
      });
      const response = await axios.get('/instance/fetchInstances', {
        headers: { apikey: token }
      });
      set({ instances: response.data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  }
}));
