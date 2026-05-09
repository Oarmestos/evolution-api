import { RotateCcw, Save, Globe, Smartphone, Layout } from 'lucide-react';

interface AppearanceHeaderProps {
  onSave: () => void;
  onReset: () => void;
  onPreview: () => void;
  onMobilePreview: () => void;
  onOpenBuilder: () => void;
  saving: boolean;
}

export const AppearanceHeader: React.FC<AppearanceHeaderProps> = ({ 
  onSave, 
  onReset, 
  onPreview,
  onMobilePreview,
  onOpenBuilder,
  saving 
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-1">
        <h2 className="text-3xl font-black text-white uppercase tracking-tight italic">Apariencia y Temas</h2>
        <p className="text-gray-400 text-sm">Personaliza cómo se ve tu tienda virtual y tus mensajes en WhatsApp.</p>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={onOpenBuilder}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#00daf3] to-[#00327d] text-white hover:opacity-90 transition-all font-black uppercase tracking-widest text-[10px] shadow-lg shadow-cyan-500/20"
        >
          <Layout className="w-4 h-4" />
          Constructor Visual
        </button>
        <button 
          onClick={onMobilePreview}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all font-bold uppercase tracking-widest text-[10px]"
          title="Vista previa móvil"
        >
          <Smartphone className="w-4 h-4" />
          Vista Móvil
        </button>
        <button 
          onClick={onPreview}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all font-bold uppercase tracking-widest text-[10px]"
          title="Ver previsualización en el navegador"
        >
          <Globe className="w-4 h-4" />
          Navegador
        </button>
        <button 
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all font-bold uppercase tracking-widest text-[10px]"
        >
          <RotateCcw className="w-4 h-4" />
          Restablecer
        </button>
        <button 
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary text-black hover:opacity-90 transition-all font-bold uppercase tracking-widest text-[10px] disabled:opacity-50 shadow-lg shadow-primary/20"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
};
