import React from 'react';
import { useAvriBuilderStore } from '../../../../store/useAvriBuilderStore';
import { Trash2, Layout, Palette, Monitor, Tablet, Smartphone } from 'lucide-react';
import { SpecificSettingsPanel, LayoutPanel, GeneralPanel } from './SpecificPanel';
import { TypographyPanel } from './TypographyPanel';
import { SizePanel } from './SizePanel';
import { SpacePanel } from './SpacePanel';
import { StylePanel } from './StylePanel';

export const Inspector: React.FC = () => {
  const { selectedBlockId, blocks, deleteBlock, device } = useAvriBuilderStore();

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
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-[#94a3b8]">
        <div className="p-4 bg-[#f1f5f9] rounded-full mb-3">
          <Layout className="w-8 h-8 text-[#cbd5e1]" />
        </div>
        <p className="text-[12px] font-semibold uppercase tracking-wider text-[#0f172a]">Selecciona un elemento</p>
        <p className="text-[11px] mt-1">Haz clic en cualquier bloque para editar.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-sm bg-white flex items-center justify-center text-[#00E5FF] border border-[#e2e8f0] shadow-sm relative group">
            <Layout className="w-4 h-4" />
            <div className="absolute -top-1.5 -right-1.5 bg-white border border-[#e2e8f0] rounded-full p-0.5 text-[#0f172a] shadow-sm flex items-center justify-center" title={`Editando vista: ${device}`}>
              {device === 'desktop' && <Monitor className="w-2.5 h-2.5" />}
              {device === 'tablet' && <Tablet className="w-2.5 h-2.5" />}
              {device === 'mobile' && <Smartphone className="w-2.5 h-2.5" />}
            </div>
          </div>
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-[#0f172a]">
              {block.type}
            </h3>
            <span className="text-[11px] font-mono text-[#64748b]">#{block.id.slice(0, 8)}</span>
          </div>
        </div>
        
        <button 
          onClick={() => deleteBlock(block.id)}
          className="w-8 h-8 flex items-center justify-center rounded-sm text-[#64748b] hover:text-[#ef4444] hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Panels */}
      <div key={block.id} className="flex-1 overflow-y-auto custom-scrollbar pb-16">
        <SpecificSettingsPanel block={block} />
        
        {['Container', 'Hero', 'Navbar', 'Footer', 'Form', 'ProductGrid'].includes(block.type) && (
          <LayoutPanel block={block} />
        )}
        
        {['Heading', 'Text', 'Button', 'Label', 'Input'].includes(block.type) && (
          <TypographyPanel block={block} />
        )}

        {block.type !== 'Spacer' && (
          <StylePanel block={block} />
        )}
        
        <GeneralPanel block={block} />
        
        {!['Heading', 'Text'].includes(block.type) && (
          <SizePanel block={block} />
        )}
        
        <SpacePanel block={block} />
      </div>

      {/* Footer Badge */}
      <div className="p-3 text-center border-t border-[#e2e8f0] bg-[#f8fafc]">
        <span className="text-[11px] text-[#64748b] uppercase tracking-widest flex items-center justify-center gap-1 font-semibold">
          <Palette className="w-3.5 h-3.5" />
          Diseño Profesional
        </span>
      </div>
    </div>
  );
};
