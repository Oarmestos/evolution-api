import React from 'react';
import { Undo2, Redo2, Eye, Save, Layout, Type, Image as ImageIcon, ArrowLeft, Monitor, Tablet, Smartphone } from 'lucide-react';
import { useAvriBuilderStore } from '../../../store/useAvriBuilderStore';

export const Toolbar: React.FC = () => {
  const { undo, redo, addBlock, historyIndex, history } = useAvriBuilderStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

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

        <div className="flex items-center bg-gray-50 p-1 rounded-lg border border-gray-100 mr-4">
          <button 
            onClick={() => addBlock('Container')}
            className="p-2 hover:bg-white rounded-md transition-colors text-gray-400 hover:text-[#00E5FF] group relative shadow-sm hover:shadow-md"
            title="Añadir Contenedor"
          >
            <Layout className="w-4 h-4" />
          </button>
          <button 
            onClick={() => addBlock('Heading')}
            className="p-2 hover:bg-white rounded-md transition-colors text-gray-400 hover:text-[#00E5FF] shadow-sm hover:shadow-md"
            title="Añadir Título"
          >
            <Type className="w-4 h-4" />
          </button>
          <button 
            onClick={() => addBlock('Image')}
            className="p-2 hover:bg-white rounded-md transition-colors text-gray-400 hover:text-[#00E5FF] shadow-sm hover:shadow-md"
            title="Añadir Imagen"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="h-4 w-[1px] bg-gray-100 mx-2" />

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
        {[
          { id: 'desktop', icon: Monitor },
          { id: 'tablet', icon: Tablet },
          { id: 'mobile', icon: Smartphone }
        ].map(device => (
          <button
            key={device.id}
            className="p-2 hover:bg-white rounded-lg transition-all text-gray-400 hover:text-[#00E5FF] active:scale-95 hover:shadow-sm"
            title={device.id.charAt(0).toUpperCase() + device.id.slice(1)}
          >
            <device.icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Right Actions: Final Controls */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-all text-[11px] font-bold uppercase tracking-wider">
          <Eye className="w-4 h-4 text-[#00E5FF]" />
          Vista Previa
        </button>
        
        <button className="flex items-center gap-2 px-5 py-2 bg-[#00E5FF] text-[#001946] rounded-lg font-black uppercase tracking-widest text-[11px] hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all active:scale-95 border border-[#00E5FF]">
          <Save className="w-4 h-4" />
          Guardar
        </button>
      </div>
    </div>
  );
};
