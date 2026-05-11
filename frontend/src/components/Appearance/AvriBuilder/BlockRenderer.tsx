import React from 'react';
import { useAvriBuilderStore } from '../../../store/useAvriBuilderStore';
import type { Block } from '../../../store/useAvriBuilderStore';
import { cn } from '../../../utils/cn';
import { Trash2, Copy, MoveVertical } from 'lucide-react';

// Placeholder blocks for now
const Container: React.FC<{ block: Block }> = ({ block }) => (
  <div className="w-full min-h-[100px] border border-gray-100 bg-gray-50/30 rounded-2xl p-6 relative">
    {block.children?.length === 0 ? (
      <div className="flex items-center justify-center h-20 text-gray-400 text-[10px] font-black uppercase tracking-widest border border-dashed border-gray-200 rounded-xl">
        Contenedor Vacío
      </div>
    ) : (
      block.children?.map(child => <BlockRenderer key={child.id} block={child} />)
    )}
  </div>
);

const Heading: React.FC<{ block: Block }> = ({ block }) => (
  <h2 className="text-4xl font-black uppercase tracking-tighter text-[#001946]" style={block.props.style}>
    {block.props.text || 'Escribe tu título aquí'}
  </h2>
);

const components: Record<string, React.FC<{ block: Block }>> = {
  Container,
  Heading,
};

export const BlockRenderer: React.FC<{ block: Block }> = ({ block }) => {
  const { selectedBlockId, selectBlock, deleteBlock } = useAvriBuilderStore();
  const isSelected = selectedBlockId === block.id;

  const Component = components[block.type] || (() => <div>Componente no encontrado: {block.type}</div>);

  return (
    <div 
      className={cn(
        "group relative transition-all",
        isSelected ? "ring-2 ring-[#00E5FF] ring-offset-4 ring-offset-white rounded-lg" : "hover:ring-1 hover:ring-gray-100"
      )}
      onClick={(e) => {
        e.stopPropagation();
        selectBlock(block.id);
      }}
    >
      {/* Block Controls (Overlay when selected) */}
      {isSelected && (
        <div className="absolute -top-12 left-0 flex items-center bg-[#00E5FF] text-black rounded-md overflow-hidden shadow-xl z-20">
          <div className="px-3 py-1.5 border-r border-black/10 flex items-center gap-2">
            <MoveVertical className="w-3 h-3 opacity-40 cursor-grab" />
            <span className="text-[10px] font-black uppercase tracking-widest">{block.type}</span>
          </div>
          <button className="p-2 hover:bg-black/10 transition-colors">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => deleteBlock(block.id)}
            className="p-2 hover:bg-red-500 hover:text-white transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="p-2">
        <Component block={block} />
      </div>
    </div>
  );
};
