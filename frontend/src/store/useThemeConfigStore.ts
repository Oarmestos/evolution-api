import { create } from 'zustand';
import axios from 'axios';
import { useInstanceStore } from './useInstanceStore';

export interface ThemeConfig {
  template: string;
  storeName: string;
  logoUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  footerText: string;
  primaryColor: string;
  buttonColor: string;
  bgColor: string;
  fontFamily: string;
  ctaText: string;
  borderRadius: number;
  instagramUrl: string;
  tiktokUrl: string;
  syncWhatsapp: boolean;
}

interface ThemeState {
  theme: ThemeConfig;
  loading: boolean;
  saving: boolean;
  error: string | null;
  fetchTheme: () => Promise<void>;
  updateTheme: (data: Partial<ThemeConfig>) => void;
  saveTheme: () => Promise<void>;
  uploadLogo: (file: File) => Promise<string | null>;
  uploadHeroImage: (file: File) => Promise<string | null>;
  resetToDefaults: () => void;
  applyTemplate: (templateName: string) => void;
}

const DEFAULT_THEME: ThemeConfig = {
  template: 'moderno',
  storeName: 'Mi Tienda',
  logoUrl: '',
  heroTitle: 'Tu Tienda Online',
  heroSubtitle: 'Los mejores productos al alcance de un clic',
  heroImageUrl: '',
  footerText: '© 2024 Avri. Todos los derechos reservados.',
  primaryColor: '#6366f1',
  buttonColor: '#000000',
  bgColor: '#f8fafc',
  fontFamily: 'Inter',
  ctaText: 'Ver Detalles',
  borderRadius: 12,
  instagramUrl: '',
  tiktokUrl: '',
  syncWhatsapp: false,
};

const TEMPLATES: Record<string, Partial<ThemeConfig>> = {
  moderno: {
    primaryColor: '#6366f1',
    buttonColor: '#000000',
    bgColor: '#f8fafc',
    fontFamily: 'Inter',
    borderRadius: 12,
  },
  minimalista: {
    primaryColor: '#000000',
    buttonColor: '#000000',
    bgColor: '#ffffff',
    fontFamily: 'Montserrat',
    borderRadius: 0,
  },
  divertido: {
    primaryColor: '#ec4899',
    buttonColor: '#be185d',
    bgColor: '#fef2f2',
    fontFamily: 'Poppins',
    borderRadius: 24,
  },
};

export const useThemeConfigStore = create<ThemeState>((set, get) => ({
  theme: DEFAULT_THEME,
  loading: false,
  saving: false,
  error: null,

  fetchTheme: async () => {
    const token = localStorage.getItem('avri_token');
    const activeInstance = useInstanceStore.getState().activeInstance;
    if (!token || !activeInstance) return;

    set({ loading: true, error: null });
    try {
      const response = await axios.get('/theme/fetch', {
        headers: { apikey: token },
        params: { instanceId: activeInstance.instanceId }
      });
      if (response.data) {
        set({ theme: { ...DEFAULT_THEME, ...response.data }, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (err: unknown) {
      set({ error: (err as any).response?.data?.error || (err as Error).message, loading: false });
    }
  },

  updateTheme: (data) => {
    set((state) => ({
      theme: { ...state.theme, ...data }
    }));
  },

  saveTheme: async () => {
    const token = localStorage.getItem('avri_token');
    const activeInstance = useInstanceStore.getState().activeInstance;
    if (!token || !activeInstance) return;

    set({ saving: true, error: null });
    try {
      const { theme } = get();
      await axios.put('/theme/update', {
        ...theme,
        instanceId: activeInstance.instanceId
      }, {
        headers: { apikey: token }
      });
      set({ saving: false });
    } catch (err: unknown) {
      set({ error: (err as any).response?.data?.error || (err as Error).message, saving: false });
    }
  },

  uploadLogo: async (file: File) => {
    const token = localStorage.getItem('avri_token');
    const activeInstance = useInstanceStore.getState().activeInstance;
    if (!token || !activeInstance) return null;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('instanceId', activeInstance.instanceId);

    try {
      const response = await axios.post('/theme/logo', formData, {
        headers: { 
          apikey: token,
          'Content-Type': 'multipart/form-data'
        }
      });
      const logoUrl = response.data.logoUrl;
      set((state) => ({
        theme: { ...state.theme, logoUrl }
      }));
      return logoUrl;
    } catch (err: unknown) {
      set({ error: (err as any).response?.data?.error || (err as Error).message });
      return null;
    }
  },

  uploadHeroImage: async (file: File) => {
    const token = localStorage.getItem('avri_token');
    const activeInstance = useInstanceStore.getState().activeInstance;
    if (!token || !activeInstance) return null;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('instanceId', activeInstance.instanceId);

    try {
      const response = await axios.post('/theme/hero-image', formData, {
        headers: { 
          apikey: token,
          'Content-Type': 'multipart/form-data'
        }
      });
      const heroImageUrl = response.data.heroImageUrl;
      set((state) => ({
        theme: { ...state.theme, heroImageUrl }
      }));
      return heroImageUrl;
    } catch (err: unknown) {
      set({ error: (err as any).response?.data?.error || (err as Error).message });
      return null;
    }
  },

  resetToDefaults: () => {
    set({ theme: DEFAULT_THEME });
  },

  applyTemplate: (templateName) => {
    const templateData = TEMPLATES[templateName];
    if (templateData) {
      set((state) => ({
        theme: { ...state.theme, ...templateData, template: templateName }
      }));
    }
  },
}));
