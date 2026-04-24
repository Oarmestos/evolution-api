import { create } from 'zustand';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name?: string;
  role: 'ADMIN' | 'USER';
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  init: () => void;
}

// Configuración inmediata de axios si el token existe
const initialToken = localStorage.getItem('avri_token');
if (initialToken) {
  axios.defaults.headers.common['apikey'] = initialToken;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: localStorage.getItem('avri_user') ? JSON.parse(localStorage.getItem('avri_user')!) : null,
  token: initialToken,
  loading: false,
  error: null,

  init: () => {
    const token = localStorage.getItem('avri_token');
    if (token) {
      axios.defaults.headers.common['apikey'] = token;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post('/user/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('avri_token', token);
      localStorage.setItem('avri_user', JSON.stringify(user));
      
      axios.defaults.headers.common['apikey'] = token;
      
      set({ token, user, loading: false });
    } catch (err: any) {
      set({ 
        error: err.response?.data?.message || 'Error al iniciar sesión', 
        loading: false 
      });
      throw err;
    }
  },

  register: async (email, password, name) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post('/user/register', { email, password, name });
      const { token, user } = response.data;
      
      localStorage.setItem('avri_token', token);
      localStorage.setItem('avri_user', JSON.stringify(user));
      
      axios.defaults.headers.common['apikey'] = token;
      
      set({ token, user, loading: false });
    } catch (err: any) {
      set({ 
        error: err.response?.data?.message || 'Error al registrarse', 
        loading: false 
      });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('avri_token');
    localStorage.removeItem('avri_user');
    delete axios.defaults.headers.common['apikey'];
    set({ token: null, user: null });
    window.location.href = '/login';
  }
}));
