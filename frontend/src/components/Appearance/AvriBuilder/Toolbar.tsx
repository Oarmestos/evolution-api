import React, { useState } from 'react';
import { Undo2, Redo2, Eye, Save, ArrowLeft, Monitor, Tablet, Smartphone, Loader2 } from 'lucide-react';
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
    { id: 'desktop' as const, icon: Monitor },
    { id: 'tablet' as const, icon: Tablet },
    { id: 'mobile' as const, icon: Smartphone }
  ];

  return (
    <div className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-50">
      {/* Left Actions: Tools */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => window.history.back()}
          className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-[#001946]"
          title="Volver"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        
        <div className="h-6 w-[1px] bg-gray-100 mx-2" />

        <button 
          onClick={undo}
          disabled={!canUndo}
          className={`p-2 rounded-md transition-all ${canUndo ? 'text-gray-400 hover:bg-gray-100' : 'text-gray-200 cursor-not-allowed'}`}
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button 
          onClick={redo}
          disabled={!canRedo}
          className={`p-2 rounded-md transition-all ${canRedo ? 'text-gray-400 hover:bg-gray-100' : 'text-gray-200 cursor-not-allowed'}`}
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Center: Device Selector */}
      <div className="flex items-center bg-gray-100/50 p-1 rounded-xl border border-gray-200/50 shadow-inner">
        {devices.map(d => {
          const Icon = d.icon;
          const isActive = device === d.id;
          return (
            <button
              key={d.id}
              onClick={() => setDevice(d.id)}
              className={`p-2 rounded-lg transition-all active:scale-95 ${
                isActive 
                  ? 'bg-white text-[#00E5FF] shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title={d.id.charAt(0).toUpperCase() + d.id.slice(1)}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Right Actions: Final Controls */}
      <div className="flex items-center gap-3">
        <button 
          onClick={handlePreview}
          className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-all text-[11px] font-bold uppercase tracking-wider"
        >
          <Eye className="w-4 h-4 text-[#00E5FF]" />
          Vista Previa
        </button>
        
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-5 py-2 bg-[#00E5FF] text-[#001946] rounded-lg font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 border border-[#00E5FF] ${
            isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-[0_0_20px_rgba(0,229,255,0.4)]'
          }`}
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
};
