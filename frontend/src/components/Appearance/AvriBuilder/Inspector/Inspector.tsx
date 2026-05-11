import React from 'react';
import { useAvriBuilderStore } from '../../../../store/useAvriBuilderStore';
import { Settings2, Trash2, Layout, Palette } from 'lucide-react';
import { SpecificSettingsPanel, LayoutPanel, GeneralPanel } from './SpecificPanel';
import { TypographyPanel } from './TypographyPanel';
import { SizePanel } from './SizePanel';
import { SpacePanel } from './SpacePanel';
import { StylePanel } from './StylePanel';

export const Inspector: React.FC = () => {
  const { selectedBlockId, blocks, deleteBlock } = useAvriBuilderStore();

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

  if (!block) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-300">
        <div className="p-5 bg-gray-50 rounded-full mb-4">
          <Settings2 className="w-10 h-10 text-gray-200" />
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-[#001946]">Selecciona un elemento</p>
        <p className="text-[10px] font-medium mt-2 leading-relaxed">Haz clic en cualquier bloque para editar.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
      {/* Header Inspector */}
      <div className="p-4 px-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
            <Layout className="w-4 h-4 text-[#00E5FF]" />
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#001946] leading-none">
              {block.type}
            </h3>
            <span className="text-[9px] font-mono font-bold text-gray-400">#{block.id.slice(0, 8)}</span>
          </div>
        </div>
        
        <button 
          onClick={() => deleteBlock(block.id)}
          className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Panels List - STRICT ALPHABETICAL ORDER */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
        
        {/* 1. Background & Borders (StylePanel) */}
        <StylePanel block={block} />

        {/* 2. General Information */}
        <GeneralPanel block={block} />

        {/* 3. Layout & Position */}
        <LayoutPanel block={block} />

        {/* 4. Size Control */}
        <SizePanel block={block} />

        {/* 5. Space (Padding/Margin) */}
        <SpacePanel block={block} />

        {/* 6. Specific Configuration (Hero settings, Button text, etc.) */}
        <SpecificSettingsPanel block={block} />

        {/* 7. Typography (Only for text-based blocks) */}
        {(block.type === 'Heading' || block.type === 'Text' || block.type === 'Button' || block.type === 'Label') && (
          <TypographyPanel block={block} />
        )}

        <div className="p-6 text-center border-t border-gray-50 opacity-40">
          <div className="flex items-center justify-center gap-2 text-gray-300 text-[10px] font-black uppercase tracking-widest">
            <Palette className="w-3.5 h-3.5" />
            Diseño Profesional
          </div>
        </div>
      </div>
    </div>
  );
};
