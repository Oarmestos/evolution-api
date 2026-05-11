import React from 'react';
import { useAvriBuilderStore } from '../../../store/useAvriBuilderStore';
import { Settings2, Type, Palette, Trash2 } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { selectedBlockId, blocks, updateBlockProps, deleteBlock } = useAvriBuilderStore();

  const findBlock = (id: string, blocks: any[]): any => {
    for (const b of blocks) {
      if (b.id === id) return b;
      if (b.children) {
        const found = findBlock(id, b.children);
        if (found) return found;
      }
    }
    return null;
  };

  const block = selectedBlockId ? findBlock(selectedBlockId, blocks) : null;

  if (!block) return null;

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-[#00E5FF]" />
          <h3 className="text-xs font-black uppercase tracking-widest">Propiedades</h3>
        </div>
        <button 
          onClick={() => deleteBlock(block.id)}
          className="p-2 text-gray-500 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">ID del Bloque</label>
          <div className="bg-white/5 px-3 py-2 rounded-lg text-[10px] font-mono text-gray-400 border border-white/5 truncate">
            {block.id}
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Type className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[11px] font-black uppercase tracking-widest">Contenido</span>
          </div>
          
          {block.type === 'Heading' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500">Texto del Título</label>
              <textarea 
                className="w-full bg-[#050505] border border-white/10 rounded-lg p-3 text-sm focus:border-[#00E5FF]/50 transition-all outline-none resize-none"
                value={block.props.text || ''}
                onChange={(e) => updateBlockProps(block.id, { text: e.target.value })}
                rows={3}
                placeholder="Ingresa el título..."
              />
            </div>
          )}
        </div>

        {/* Style Section */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[11px] font-black uppercase tracking-widest">Estilos</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500">Color Texto</label>
              <input 
                type="color" 
                className="w-full h-10 bg-[#050505] border border-white/10 rounded-lg p-1 cursor-pointer"
                onChange={(e) => updateBlockProps(block.id, { style: { ...block.props.style, color: e.target.value } })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500">Tamaño Fuente</label>
              <select 
                className="w-full bg-[#050505] border border-white/10 rounded-lg px-2 py-2 text-[10px] font-bold outline-none"
                onChange={(e) => updateBlockProps(block.id, { style: { ...block.props.style, fontSize: e.target.value } })}
              >
                <option value="1rem">Pequeño</option>
                <option value="2rem">Normal</option>
                <option value="4rem">Grande</option>
                <option value="6rem">Extra</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
