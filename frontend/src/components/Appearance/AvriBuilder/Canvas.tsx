import React from 'react';
import { useAvriBuilderStore } from '../../../store/useAvriBuilderStore';
import { BlockRenderer } from './BlockRenderer.tsx';
import { Plus } from 'lucide-react';

export const Canvas: React.FC = () => {
  const { blocks, addBlock } = useAvriBuilderStore();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('blockType') as any;
    if (type) {
      addBlock(type);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div 
      className="w-full min-h-full flex flex-col p-4 bg-white"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {blocks.length === 0 ? (
        <div 
          className="flex-1 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center gap-6 p-20 hover:border-[#00E5FF]/30 transition-all group cursor-pointer bg-gray-50/50"
          onClick={(e) => {
            e.stopPropagation();
            addBlock('Container');
          }}
        >
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 group-hover:border-[#00E5FF]/20 transition-all">
            <Plus className="w-8 h-8 text-gray-300 group-hover:text-[#00E5FF] transition-all" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-black uppercase tracking-tighter text-gray-300 group-hover:text-[#001946] transition-all">El Canvas está vacío</h3>
            <p className="text-sm text-gray-400 font-medium">Arrastra un componente aquí o haz clic para empezar.</p>
          </div>
        </div>
      ) : (
        <>
          {blocks.map((block) => (
            <BlockRenderer key={block.id} block={block} />
          ))}
          
          {/* Add block button at the bottom */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              addBlock('Container');
            }}
            onDrop={(e) => {
              e.stopPropagation();
              handleDrop(e);
            }}
            className="w-full py-8 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center gap-3 text-gray-300 hover:text-[#00E5FF] hover:border-[#00E5FF]/20 transition-all mt-4"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">Añadir Sección / Suelta Aquí</span>
          </button>
        </>
      )}
    </div>
  );
};
