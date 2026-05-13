import React, { useState } from 'react';
import { Undo2, Redo2, Eye, Save, ArrowLeft, Monitor, Tablet, Smartphone, Loader2, Layers, Settings } from 'lucide-react';
import { useAvriBuilderStore } from '../../../store/useAvriBuilderStore';
import { useInstanceStore } from '../../../store/useInstanceStore';
import toast from 'react-hot-toast';

export const Toolbar: React.FC = () => {
  const { undo, redo, historyIndex, history, device, setDevice, save } = useAvriBuilderStore();
  const { activeInstance } = useInstanceStore();
  const [isSaving, setIsSaving] = useState(false);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleSave = async () => {
    setIsSaving(true);
    const success = await save();
    setIsSaving(false);
    
    if (success) {
      toast.success('Diseño guardado correctamente');
    } else {
      toast.error('Error al guardar el diseño');
    }
  };

  const handlePreview = () => {
    if (activeInstance?.instanceName) {
      window.open(`/store/${activeInstance.instanceName}`, '_blank');
    } else {
      toast.error('No hay una instancia activa para previsualizar');
    }
  };

  const devices = [
    { id: 'desktop' as const, icon: Monitor, label: 'Desktop' },
    { id: 'tablet' as const, icon: Tablet, label: 'Tablet' },
    { id: 'mobile' as const, icon: Smartphone, label: 'Mobile' }
  ];

  return (
    <header className="h-12 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-4 z-50 fixed top-0 left-0 right-0 shadow-sm">
      {/* Left: Back + Branding + Actions */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => window.history.back()}
          className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:text-[#0f172a] transition-colors active:scale-95"
          title="Volver"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>

        <div className="flex items-center gap-1.5 text-[#00E5FF]">
          <Layers className="w-5 h-5" style={{ fill: '#00E5FF' }} />
        </div>

        <div className="flex items-center gap-0.5 ml-2">
          <button 
            onClick={undo}
            disabled={!canUndo}
            className={`w-8 h-8 flex items-center justify-center rounded-sm transition-colors ${canUndo ? 'text-[#64748b] hover:bg-[#f1f5f9]' : 'text-[#cbd5e1] cursor-not-allowed'}`}
            title="Deshacer"
          >
            <Undo2 className="w-[18px] h-[18px]" />
          </button>
          <button 
            onClick={redo}
            disabled={!canRedo}
            className={`w-8 h-8 flex items-center justify-center rounded-sm transition-colors ${canRedo ? 'text-[#64748b] hover:bg-[#f1f5f9]' : 'text-[#cbd5e1] cursor-not-allowed'}`}
            title="Rehacer"
          >
            <Redo2 className="w-[18px] h-[18px]" />
          </button>
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-sm text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
            title="Ajustes"
          >
            <Settings className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      {/* Center: Device Selector */}
      <div className="flex items-center bg-[#f1f5f9] rounded-xl p-1">
        {devices.map(d => {
          const Icon = d.icon;
          const isActive = device === d.id;
          return (
            <button
              key={d.id}
              onClick={() => setDevice(d.id)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-95 ${
                isActive 
                  ? 'bg-white text-[#00E5FF] shadow-sm border border-[#e2e8f0]' 
                  : 'text-[#64748b] hover:bg-white/50'
              }`}
              title={d.label}
            >
              <Icon className="w-[18px] h-[18px]" />
            </button>
          );
        })}
      </div>

      {/* Right: Preview + Save */}
      <div className="flex items-center gap-3">
        <button 
          onClick={handlePreview}
          className="flex items-center gap-1.5 px-2 py-1 text-[#64748b] hover:text-[#0f172a] transition-colors active:scale-95"
        >
          <Eye className="w-[18px] h-[18px]" />
          <span className="text-[12px] font-medium tracking-wide">Preview</span>
        </button>
        
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-1.5 h-8 px-4 bg-[#00E5FF] text-[#00363d] rounded-sm text-[12px] font-semibold tracking-wide transition-all active:scale-95 shadow-sm ${
            isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#00cce6]'
          }`}
        >
          {isSaving ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Save className="w-[18px] h-[18px]" />}
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </header>
  );
};
