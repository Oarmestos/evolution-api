import React, { useEffect } from 'react';
import { useThemeConfigStore } from '../store/useThemeConfigStore';
import { useInstanceStore } from '../store/useInstanceStore';
import { useNavigate } from 'react-router-dom';
import { 
  Palette, 
  Layout, 
  Settings, 
  ChevronRight, 
  Sparkles,
  Smartphone,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { WebPreview } from '../components/Appearance/VisualBuilder/WebPreview';

export const Appearance: React.FC = () => {
  const { activeInstance } = useInstanceStore();
  const { theme, fetchTheme } = useThemeConfigStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme, activeInstance]);

  const handlePreviewInBrowser = () => {
    if (activeInstance?.instanceName) {
      const url = `${window.location.origin}/store/${activeInstance.instanceName}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="p-8 space-y-12 animate-in fade-in duration-700 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Apariencia de Tienda</h2>
          <p className="text-gray-400 font-medium">Gestiona la identidad visual de tu tienda de WhatsApp.</p>
        </div>
        <button 
          onClick={handlePreviewInBrowser}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold text-white transition-all"
        >
          Ver Tienda en Vivo
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Theme Management */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Active Theme Card */}
          <div className="theme-surface rounded-[40px] border border-white/5 overflow-hidden group">
            <div className="p-8 bg-gradient-to-br from-[#00E5FF]/10 to-transparent">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#00E5FF] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.3)]">
                    <Layout className="text-[#001946] w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00E5FF] mb-1 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      Tema Activo
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Avri Luxury</h3>
                  </div>
                </div>
                <div className="bg-[#00E5FF]/20 text-[#00E5FF] px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-[#00E5FF]/30">
                  <CheckCircle2 className="w-3 h-3" />
                  Publicado
                </div>
              </div>

              <div className="aspect-video w-full rounded-3xl bg-[#0a0b0d] border border-white/10 relative overflow-hidden group-hover:border-[#00E5FF]/20 transition-all duration-500">
                <div className="absolute inset-0 opacity-100">
                   <WebPreview layout={theme.layout} />
                </div>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <button 
                    onClick={() => navigate('/appearance/builder')}
                    className="px-10 py-5 bg-[#00E5FF] text-[#001946] font-black uppercase tracking-widest text-sm rounded-full shadow-[0_0_40px_rgba(0,229,255,0.4)] flex items-center gap-4 hover:scale-105 transition-all"
                  >
                    Editar Diseño Visual
                    <Palette className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-white/5 flex flex-wrap gap-4 items-center justify-between">
              <p className="text-sm text-gray-500 font-medium max-w-md">
                Usa el constructor visual para arrastrar y soltar bloques, cambiar colores y personalizar cada detalle de tu tienda sin tocar código.
              </p>
              <button 
                onClick={() => navigate('/appearance/builder')}
                className="flex items-center gap-2 text-[#00E5FF] font-black uppercase tracking-widest text-xs group/btn"
              >
                Abrir Constructor
                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>

        {/* Sidebar info */}
        <div className="lg:col-span-4 space-y-8">
          <div className="theme-surface p-8 rounded-[40px] border border-white/5 h-fit">
            <h4 className="text-lg font-black text-white uppercase tracking-tight mb-6">Estado de la Tienda</h4>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                   <CheckCircle2 className="text-green-500 w-5 h-5" />
                </div>
                <div>
                   <div className="text-[10px] font-black uppercase text-gray-500">Visibilidad</div>
                   <div className="text-sm font-bold text-white">Tienda Pública</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="w-10 h-10 bg-[#00E5FF]/10 rounded-xl flex items-center justify-center">
                   <Smartphone className="text-[#00E5FF] w-5 h-5" />
                </div>
                <div>
                   <div className="text-[10px] font-black uppercase text-gray-500">Responsividad</div>
                   <div className="text-sm font-bold text-white">Optimizada para Móvil</div>
                </div>
              </div>
            </div>

            {/* Technical Settings (Moved here) */}
            <div 
              onClick={() => navigate('/appearance/settings')}
              className="mt-8 p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all cursor-pointer flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                <Settings className="text-gray-400 w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-white">Configuración Técnica</h4>
                <p className="text-[10px] text-gray-500">Logo, CSS y ajustes.</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </div>

            <div className="mt-8 p-6 bg-gradient-to-br from-[#54118a]/20 to-[#0047ab]/20 rounded-3xl border border-white/5">
              <h5 className="text-xs font-black text-white uppercase mb-2">Consejo de Diseño</h5>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">
                "Menos es más. Mantén un diseño limpio con el tema **Avri Luxury** para que tus productos sean los verdaderos protagonistas."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appearance;
