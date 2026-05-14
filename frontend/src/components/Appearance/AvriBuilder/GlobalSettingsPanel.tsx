import React, { useRef } from 'react';
import { useAvriBuilderStore } from '../../../store/useAvriBuilderStore';
import { useThemeConfigStore } from '../../../store/useThemeConfigStore';
import { 
  Settings, 
  Globe, 
  Maximize, 
  Type, 
  Image as ImageIcon, 
  Upload, 
  Palette, 
  Smartphone, 
  Code 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const GlobalSettingsPanel: React.FC = () => {
  const { globalSettings, updateGlobalSettings } = useAvriBuilderStore();
  const { uploadLogo, uploadHeroImage } = useThemeConfigStore();
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'hero') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const promise = type === 'logo' ? uploadLogo(file) : uploadHeroImage(file);
    
    toast.promise(promise, {
      loading: `Subiendo ${type}...`,
      success: (url) => {
        if (url) {
          updateGlobalSettings({ [type === 'logo' ? 'logoUrl' : 'heroImageUrl']: url });
          return `${type === 'logo' ? 'Logo' : 'Banner'} actualizado`;
        }
        throw new Error('Error al obtener la URL');
      },
      error: `Error al subir el ${type}`,
    });
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
      <div className="mb-6">
        <h3 className="text-[14px] font-bold text-[#0f172a] flex items-center gap-2 mb-1">
          <Settings className="w-4 h-4 text-[#00E5FF]" />
          Ajustes Globales
        </h3>
        <p className="text-[11px] text-[#64748b]">Configura los cimientos de tu sitio.</p>
      </div>

      {/* Site Name */}
      <div className="mb-6">
        <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-2">
          <Globe className="w-3.5 h-3.5" />
          Nombre del Sitio
        </label>
        <input 
          type="text"
          value={globalSettings.siteName}
          onChange={(e) => updateGlobalSettings({ siteName: e.target.value })}
          className="w-full bg-white border border-[#e2e8f0] rounded-md h-9 px-3 text-[13px] text-[#0f172a] focus:border-[#00E5FF] focus:ring-0 transition-colors outline-none"
          placeholder="Ej. Mi Tienda Online"
        />
      </div>

      {/* Logo & Banner Section */}
      <div className="mb-6 space-y-4">
        <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-2">
          <ImageIcon className="w-3.5 h-3.5" />
          Identidad Visual
        </label>
        
        {/* Logo Upload */}
        <div 
          onClick={() => logoInputRef.current?.click()}
          className="relative h-24 bg-white border border-[#e2e8f0] border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#00E5FF]/40 transition-all overflow-hidden group"
        >
          {globalSettings.logoUrl ? (
            <img src={globalSettings.logoUrl} alt="Logo" className="h-full object-contain p-4" />
          ) : (
            <>
              <Upload className="w-4 h-4 text-[#94a3b8]" />
              <span className="text-[10px] text-[#64748b] font-bold uppercase">Logo de Tienda</span>
            </>
          )}
          <input 
            type="file" 
            ref={logoInputRef} 
            onChange={(e) => handleFileUpload(e, 'logo')} 
            className="hidden" 
            accept="image/*" 
          />
        </div>

        {/* Hero Upload */}
        <div 
          onClick={() => heroInputRef.current?.click()}
          className="relative h-24 bg-white border border-[#e2e8f0] border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#00E5FF]/40 transition-all overflow-hidden group"
        >
          {globalSettings.heroImageUrl ? (
            <img src={globalSettings.heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
          ) : (
            <>
              <Upload className="w-4 h-4 text-[#94a3b8]" />
              <span className="text-[10px] text-[#64748b] font-bold uppercase">Banner Principal</span>
            </>
          )}
          <input 
            type="file" 
            ref={heroInputRef} 
            onChange={(e) => handleFileUpload(e, 'hero')} 
            className="hidden" 
            accept="image/*" 
          />
        </div>
      </div>

      {/* Colors & Style */}
      <div className="mb-6">
        <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-2">
          <Palette className="w-3.5 h-3.5" />
          Color de Marca
        </label>
        <div className="flex gap-2">
          <input 
            type="color"
            value={globalSettings.primaryColor}
            onChange={(e) => updateGlobalSettings({ primaryColor: e.target.value })}
            className="w-10 h-10 p-0 border-0 bg-transparent cursor-pointer"
          />
          <input 
            type="text"
            value={globalSettings.primaryColor}
            onChange={(e) => updateGlobalSettings({ primaryColor: e.target.value })}
            className="flex-1 bg-white border border-[#e2e8f0] rounded-md h-10 px-3 text-[13px] text-[#0f172a] uppercase"
          />
        </div>
      </div>

      {/* Max Content Width */}
      <div className="mb-6">
        <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-2">
          <Maximize className="w-3.5 h-3.5" />
          Ancho del Contenido ({globalSettings.maxWidth}px)
        </label>
        <input 
          type="range"
          min="800"
          max="1600"
          step="50"
          value={globalSettings.maxWidth}
          onChange={(e) => updateGlobalSettings({ maxWidth: parseInt(e.target.value) })}
          className="w-full h-1.5 bg-[#f1f5f9] rounded-lg appearance-none cursor-pointer accent-[#00E5FF]"
        />
      </div>

      {/* Global Font */}
      <div className="mb-6">
        <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-2">
          <Type className="w-3.5 h-3.5" />
          Tipografía Global
        </label>
        <select 
          value={globalSettings.primaryFont}
          onChange={(e) => updateGlobalSettings({ primaryFont: e.target.value })}
          className="w-full bg-white border border-[#e2e8f0] rounded-md h-9 px-3 text-[13px] text-[#0f172a] outline-none cursor-pointer"
        >
          <option value="Inter">Inter (Sugerida)</option>
          <option value="Roboto">Roboto</option>
          <option value="Montserrat">Montserrat</option>
          <option value="Outfit">Outfit</option>
          <option value="Poppins">Poppins</option>
        </select>
      </div>

      {/* WhatsApp Sync */}
      <div className="mb-6 p-4 bg-white border border-[#e2e8f0] rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5 text-[#25D366]" />
            <span className="text-[11px] font-bold text-[#0f172a] uppercase tracking-wider">Sync WhatsApp</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={globalSettings.syncWhatsapp}
              onChange={(e) => updateGlobalSettings({ syncWhatsapp: e.target.checked })}
              className="sr-only peer" 
            />
            <div className="w-8 h-4 bg-[#e2e8f0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#25D366]"></div>
          </label>
        </div>
        <p className="text-[10px] text-[#64748b] mt-2 leading-tight">
          Aplica automáticamente tus colores de marca a los mensajes de la IA.
        </p>
      </div>

      {/* Custom CSS */}
      <div className="mb-6">
        <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-2">
          <Code className="w-3.5 h-3.5" />
          CSS Personalizado
        </label>
        <textarea 
          value={globalSettings.customCss}
          onChange={(e) => updateGlobalSettings({ customCss: e.target.value })}
          className="w-full bg-[#0f172a] border border-white/10 rounded-md p-3 text-[12px] text-[#00E5FF] font-mono outline-none min-h-[120px]"
          placeholder="/* Escribe tus estilos CSS aquí */"
        />
      </div>

      {/* SEO Info Card */}
      <div className="p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg border-dashed">
        <p className="text-[11px] text-[#64748b] italic leading-relaxed">
          <span className="font-bold text-[#0f172a] not-italic">Pro Tip:</span> Los ajustes de SEO avanzados y scripts personalizados estarán disponibles en la versión Pro.
        </p>
      </div>
    </div>
  );
};
