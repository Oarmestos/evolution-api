import React, { useEffect } from 'react';
import { Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { useThemeConfigStore } from '../store/useThemeConfigStore';
import { useInstanceStore } from '../store/useInstanceStore';
import { config } from '../components/Appearance/VisualBuilder/PuckConfig';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Plus, 
  Undo2, 
  Redo2, 
  List, 
  Eye, 
  PanelRightOpen,
  ChevronDown
} from 'lucide-react';
import '../styles/builder.css';

export const AppearanceBuilder: React.FC = () => {
  const { theme, updateTheme, saveTheme, fetchTheme, saving } = useThemeConfigStore();
  const { activeInstance } = useInstanceStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  const handleSave = async (data: any) => {
    const { root } = data;
    updateTheme({ 
      layout: data,
      primaryColor: root?.primaryColor || theme.primaryColor,
      storeName: root?.storeName || theme.storeName,
      fontFamily: root?.fontFamily || theme.fontFamily,
      logoUrl: root?.logoUrl || theme.logoUrl,
    });
    
    try {
      await saveTheme();
      toast.success('Diseño publicado correctamente');
    } catch (error) {
      toast.error('Error al publicar el diseño');
    }
  };

  if (!activeInstance) {
    return (
      <div className="h-screen flex items-center justify-center bg-puck-surface text-puck-on-surface">
        <p className="font-bold uppercase tracking-widest">Selecciona una instancia para comenzar</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-puck-surface text-puck-on-surface font-outfit">
      {/* Custom Top Bar based on user screenshot */}
      {/* WordPress Style Header */}
      <header className="h-14 bg-white border-b border-puck-outline-variant/30 flex items-center justify-between px-4 z-[100] shadow-sm">
        
        {/* Left Actions */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => navigate('/appearance')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-700"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="w-[1px] h-6 bg-gray-200 mx-2" />

          <button className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-700" title="Añadir bloque">
            <Plus className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-400 cursor-not-allowed" title="Deshacer">
            <Undo2 className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-400 cursor-not-allowed" title="Rehacer">
            <Redo2 className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-700" title="Vista de lista">
            <List className="w-5 h-5" />
          </button>
        </div>

        {/* Center Indicator */}
        <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg cursor-default group">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            {activeInstance.instanceName}
          </span>
          <span className="text-[11px] text-gray-300 font-black">•</span>
          <span className="text-[11px] font-black text-gray-800 uppercase tracking-tighter flex items-center gap-1">
            Editor Visual
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.open(`/store/${activeInstance.instanceName}`, '_blank')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-700 flex items-center gap-2"
            title="Previsualizar"
          >
            <Eye className="w-5 h-5" />
            <span className="text-[11px] font-bold uppercase tracking-wider hidden md:block">Vista previa</span>
          </button>

          <button className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-700" title="Ajustes">
            <PanelRightOpen className="w-5 h-5 text-puck-primary" />
          </button>

          <div className="w-[1px] h-6 bg-gray-200 mx-2" />

          <button 
            onClick={() => (document.querySelector('button[type="submit"]') as HTMLButtonElement)?.click()}
            className="bg-[#00E5FF] hover:bg-[#00c2d8] text-[#001946] px-8 py-2 rounded-md font-black text-[11px] uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,229,255,0.2)] active:scale-95 disabled:opacity-50"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <Puck 
          config={config} 
          data={theme.layout || { 
            content: [], 
            root: { 
              props: {
                storeName: theme.storeName,
                primaryColor: theme.primaryColor,
                fontFamily: theme.fontFamily,
                logoUrl: theme.logoUrl
              }
            } 
          }} 
          onPublish={handleSave}
          overrides={{
            header: () => null, // We use our own header
          }}
        />
      </div>
    </div>
  );
};

export default AppearanceBuilder;
