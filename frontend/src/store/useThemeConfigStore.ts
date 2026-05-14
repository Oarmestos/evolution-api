import { create } from 'zustand';
import axios from 'axios';
import { useInstanceStore } from './useInstanceStore';
import { AVRI_LUXURY_LAYOUT } from './defaultLayout';

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
  textColor: string;
  ctaText: string;
  borderRadius: number;
  instagramUrl: string;
  tiktokUrl: string;
  syncWhatsapp: boolean;
  layout?: any;
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
  template: 'luxury',
  storeName: 'Mi Tienda',
  logoUrl: '',
  heroTitle: 'Tu Tienda Online',
  heroSubtitle: 'Los mejores productos al alcance de un clic',
  heroImageUrl: '',
  footerText: '© 2026 Avri. Todos los derechos reservados.',
  primaryColor: '#00E5FF',
  buttonColor: '#00E5FF',
  bgColor: '#0f1016',
  fontFamily: 'Inter',
  textColor: '#ffffff',
  ctaText: 'Ver Detalles',
  borderRadius: 12,
  instagramUrl: '',
  tiktokUrl: '',
  syncWhatsapp: false,
  layout: null, // Set to null initially to detect "not loaded" state
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
  luxury: {
    primaryColor: '#00327d',
    buttonColor: '#00327d',
    bgColor: '#fcf9f8',
    fontFamily: 'Montserrat',
    textColor: '#1c1b1b',
    borderRadius: 16,
  },
};

export const useThemeConfigStore = create<ThemeState>((set, get) => ({
  theme: DEFAULT_THEME,
  loading: !!localStorage.getItem('avri_token'),
  saving: false,
  error: null,

  fetchTheme: async () => {
    const token = localStorage.getItem('avri_token');
    const activeInstance = useInstanceStore.getState().activeInstance;
    
    // If we have a token but no instance yet, stay in loading state
    if (!token) {
      set({ loading: false });
      return;
    }
    
    if (!activeInstance) {
      // Still waiting for instance
      return;
    }

    set({ loading: true, error: null });
    try {
      const response = await axios.get('/theme/fetch', {
        headers: { apikey: token },
        params: { instanceId: activeInstance.instanceId }
      });
      
      if (response.data) {
        const serverLayout = response.data.layout;
        const hasContent = serverLayout && (
          (Array.isArray(serverLayout.content) && serverLayout.content.length > 0) ||
          (Array.isArray(serverLayout.children) && serverLayout.children.length > 0) ||
          (serverLayout.id === 'root' && serverLayout.type === 'Container')
        );
        
        set({ 
          theme: { 
            ...DEFAULT_THEME, 
            ...response.data, 
            layout: hasContent ? serverLayout : AVRI_LUXURY_LAYOUT 
          }, 
          loading: false 
        });
      } else {
        // No theme found, use defaults with default luxury layout
        set({ 
          theme: { ...DEFAULT_THEME, layout: AVRI_LUXURY_LAYOUT },
          loading: false 
        });
      }
    } catch (err: unknown) {
      set({ 
        error: (err as any).response?.data?.error || (err as Error).message, 
        loading: false,
        theme: { ...DEFAULT_THEME, layout: AVRI_LUXURY_LAYOUT } // Fallback on error
      });
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
      
      // Only send fields that match StoreThemeDto — exclude DB-only fields
      // like id, createdAt, updatedAt, Instance that come from server responses
      const payload = {
        instanceId: activeInstance.instanceId,
        template: theme.template,
        storeName: theme.storeName,
        logoUrl: theme.logoUrl,
        heroTitle: theme.heroTitle,
        heroSubtitle: theme.heroSubtitle,
        heroImageUrl: theme.heroImageUrl,
        footerText: theme.footerText,
        primaryColor: theme.primaryColor,
        buttonColor: theme.buttonColor,
        bgColor: theme.bgColor,
        fontFamily: theme.fontFamily,
        textColor: theme.textColor,
        ctaText: theme.ctaText,
        borderRadius: theme.borderRadius,
        instagramUrl: theme.instagramUrl,
        tiktokUrl: theme.tiktokUrl,
        syncWhatsapp: theme.syncWhatsapp,
        layout: theme.layout,
      };
      
      await axios.put('/theme/update', payload, {
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

// Subscribe to instance changes to trigger theme fetch
useInstanceStore.subscribe((state, prevState) => {
  if (state.activeInstance && state.activeInstance !== prevState.activeInstance) {
    useThemeConfigStore.getState().fetchTheme();
  }
});
