import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { useThemeConfigStore } from '../store/useThemeConfigStore';
import { useInstanceStore } from '../store/useInstanceStore';
import { toast } from 'react-hot-toast';
import { Modal } from '../components/Modal';

// Subcomponentes
import { LivePreview } from '../components/Appearance/LivePreview';
import { AppearanceHeader } from '../components/Appearance/AppearanceHeader';
import { TemplateSection } from '../components/Appearance/Sections/TemplateSection';
import { ColorSection } from '../components/Appearance/Sections/ColorSection';
import { TypographySection } from '../components/Appearance/Sections/TypographySection';
import { StyleSection } from '../components/Appearance/Sections/StyleSection';
import { MediaSection } from '../components/Appearance/Sections/MediaSection';
import { AdvancedSection } from '../components/Appearance/Sections/AdvancedSection';

export const Appearance: React.FC = () => {
  const { activeInstance } = useInstanceStore();
  const { 
    theme, 
    updateTheme, 
    fetchTheme, 
    saveTheme: saveThemeToStore, 
    resetToDefaults,
    applyTemplate,
    saving 
  } = useThemeConfigStore();

  const [previewProduct, setPreviewProduct] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme, activeInstance]);

  useEffect(() => {
    const fetchPreviewProduct = async () => {
      if (!activeInstance?.instanceName) return;
      try {
        const token = localStorage.getItem('avri_token');
        const response = await axios.get(`/product/${activeInstance.instanceName}`, {
          headers: { apikey: token },
        });
        if (response.data && response.data.length > 0) {
          setPreviewProduct(response.data[0]);
        }
      } catch (error) {
        console.error('Error fetching products for preview:', error);
      }
    };
    fetchPreviewProduct();
  }, [activeInstance?.instanceName]);

  const handleUpload = (type: 'logo' | 'hero') => {
    if (type === 'logo') logoRef.current?.click();
    else heroRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'hero') => {
    const file = e.target.files?.[0];
    if (!file || !activeInstance?.instanceName) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('avri_token');
      const response = await axios.post(`/theme/upload/${activeInstance.instanceName}`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          apikey: token 
        },
      });

      if (type === 'logo') updateTheme({ logoUrl: response.data.url });
      else updateTheme({ heroImageUrl: response.data.url });
      
      toast.success('Imagen subida correctamente');
    } catch (error) {
      toast.error('Error al subir la imagen');
      console.error(error);
    }
  };

  const saveTheme = async () => {
    if (!activeInstance?.instanceName) return;
    try {
      await saveThemeToStore();
      toast.success('Apariencia guardada correctamente');
    } catch (error) {
      toast.error('Error al guardar la configuración');
    }
  };

  const resetToDefault = useCallback((key: string) => {
    const defaults: any = {
      primaryColor: '#00f2ff',
      bgColor: '#0f1016',
      buttonColor: '#00f2ff',
      textColor: '#ffffff',
      fontFamily: 'Inter',
      borderRadius: 12
    };
    if (defaults[key]) {
      updateTheme({ [key]: defaults[key] });
      toast.success('Color restablecido');
    }
  }, [updateTheme]);

  const handlePreviewInBrowser = () => {
    if (activeInstance?.instanceName) {
      const url = `${window.location.origin}/store/${activeInstance.instanceName}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="p-8 space-y-12 animate-in fade-in duration-700 max-w-7xl mx-auto">
      
      <AppearanceHeader 
        onSave={saveTheme}
        onReset={resetToDefaults}
        onPreview={handlePreviewInBrowser}
        onMobilePreview={() => setShowPreviewModal(true)}
        saving={saving}
      />

      {/* Grid de Configuración Full-Width */}
      <div className="space-y-12 pb-20">
        
        {/* Sección de Plantillas - Impacto Visual */}
        <div className="theme-surface p-8 rounded-[40px] border border-white/5">
          <TemplateSection 
            currentTemplate={theme.template} 
            onApplyTemplate={applyTemplate} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Colores */}
          <div className="theme-surface p-8 rounded-[40px] border border-white/5 h-full">
            <ColorSection 
              theme={theme} 
              updateTheme={updateTheme} 
              resetToDefault={resetToDefault} 
            />
          </div>

          {/* Tipografía */}
          <div className="theme-surface p-8 rounded-[40px] border border-white/5 h-full">
            <TypographySection 
              theme={theme} 
              updateTheme={updateTheme} 
              resetToDefault={resetToDefault} 
            />
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Multimedia (Logo/Hero) - Ocupa más espacio */}
          <div className="lg:col-span-8 theme-surface p-8 rounded-[40px] border border-white/5">
            <MediaSection 
              theme={theme}
              onUpload={handleUpload}
              logoRef={logoRef}
              heroRef={heroRef}
              onFileChange={onFileChange}
            />
          </div>

          {/* Estilos y Avanzado - Columna lateral */}
          <div className="lg:col-span-4 space-y-8">
            <div className="theme-surface p-8 rounded-[40px] border border-white/5">
              <StyleSection 
                theme={theme} 
                updateTheme={updateTheme} 
              />
            </div>
            <div className="theme-surface p-8 rounded-[40px] border border-white/5">
              <AdvancedSection 
                theme={theme} 
                updateTheme={updateTheme} 
              />
            </div>
          </div>

        </div>

      </div>

      {/* Modal de Vista Previa Móvil */}
      {showPreviewModal && (
        <Modal 
          isOpen={showPreviewModal} 
          onClose={() => setShowPreviewModal(false)}
          title="Previsualización de tu Tienda"
        >
          <div className="flex items-center justify-center py-10 bg-[#0a0b0d] rounded-b-[40px]">
             <div className="transform scale-[0.9] md:scale-100">
                <LivePreview theme={theme} previewProduct={previewProduct} />
             </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Appearance;
