import React, { useState } from 'react';
import { Search, Layout, Type, Image as ImageIcon, MousePointer2, Columns, Layers } from 'lucide-react';
import { useAvriBuilderStore } from '../../../store/useAvriBuilderStore';

export const SidePanel: React.FC = () => {
  const { activePanel, addBlock } = useAvriBuilderStore();
  const [search, setSearch] = useState('');

  const blocks = [
    { type: 'Container', label: '1 Column', icon: Layout },
    { type: 'Grid2', label: '2 Columns', icon: Columns },
    { type: 'Heading', label: 'Heading', icon: Type },
    { type: 'Text', label: 'Text', icon: MousePointer2 },
    { type: 'Image', label: 'Image', icon: ImageIcon },
    { type: 'Section', label: 'Section', icon: Layers },
  ];

  const filteredBlocks = blocks.filter(b => b.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-[280px] bg-[#0f1016] border-r border-white/5 flex flex-col animate-in slide-in-from-left duration-300">
      <div className="p-4 border-b border-white/5">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4">
          {activePanel === 'blocks' ? 'Biblioteca de Bloques' : (activePanel === 'layers' ? 'Capas del Diseño' : 'Ajustes Globales')}
        </h3>

        {activePanel === 'blocks' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input 
              type="text"
              placeholder="Buscar bloques..."
              className="w-full bg-black/40 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-[11px] font-medium focus:border-[#00E5FF]/40 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activePanel === 'blocks' && (
          <div className="grid grid-cols-2 gap-3">
            {filteredBlocks.map((block) => (
              <button
                key={block.label}
                onClick={() => addBlock(block.type)}
                className="flex flex-col items-center justify-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/5 transition-all group"
              >
                <block.icon className="w-5 h-5 text-gray-500 group-hover:text-[#00E5FF] transition-all" />
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-all text-center">
                  {block.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {activePanel === 'layers' && (
          <div className="flex flex-col items-center justify-center h-40 text-gray-600 text-[10px] font-black uppercase tracking-widest text-center">
            Próximamente:<br/>Árbol de Capas
          </div>
        )}
      </div>
    </div>
  );
};
