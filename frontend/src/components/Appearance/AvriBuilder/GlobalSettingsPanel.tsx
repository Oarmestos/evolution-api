import React from 'react';
import { useAvriBuilderStore } from '../../../store/useAvriBuilderStore';
import { Settings, Globe, Maximize, Type } from 'lucide-react';

export const GlobalSettingsPanel: React.FC = () => {
  const { globalSettings, updateGlobalSettings } = useAvriBuilderStore();

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
        <div className="flex justify-between mt-2 text-[10px] text-[#94a3b8] font-medium">
          <span>800px</span>
          <span>1200px</span>
          <span>1600px</span>
        </div>
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
          className="w-full bg-white border border-[#e2e8f0] rounded-md h-9 px-3 text-[13px] text-[#0f172a] focus:border-[#00E5FF] focus:ring-0 transition-colors outline-none cursor-pointer"
        >
          <option value="Inter">Inter (Sugerida)</option>
          <option value="Roboto">Roboto</option>
          <option value="Montserrat">Montserrat</option>
          <option value="Outfit">Outfit</option>
          <option value="Poppins">Poppins</option>
        </select>
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
