import React, { useState } from 'react';
import { 
  useAvriBuilderStore,
} from '../../../store/useAvriBuilderStore';
import type { BlockType } from '../../../store/useAvriBuilderStore';
import { 
  Search, 
  Type, 
  Image as ImageIcon, 
  Square, 
  ChevronDown, 
  ChevronRight, 
  Columns, 
  Minus, 
  MapPin, 
  Smile, 
  ClipboardList, 
  MousePointer2, 
  CheckSquare, 
  Circle, 
  Menu, 
  Type as LabelIcon, 
  Video, 
  Monitor 
} from 'lucide-react';

interface BlockDefinition {
  type: BlockType;
  label: string;
  icon: React.ElementType;
  category: 'Basic' | 'Forms' | 'Extra' | 'Layout';
}

const blocks: BlockDefinition[] = [
  // Basic
  { type: 'Container', label: '1 Column', icon: Square, category: 'Basic' },
  { type: 'Container', label: '2 Columns', icon: Columns, category: 'Basic' },
  { type: 'Heading', label: 'Heading', icon: Type, category: 'Basic' },
  { type: 'Text', label: 'Text', icon: Type, category: 'Basic' },
  { type: 'Image', label: 'Image', icon: ImageIcon, category: 'Basic' },
  { type: 'Video', label: 'Video', icon: Video, category: 'Basic' },
  { type: 'Map', label: 'Map', icon: MapPin, category: 'Basic' },
  { type: 'Icon', label: 'Icon', icon: Smile, category: 'Basic' },
  { type: 'Divider', label: 'Divider', icon: Minus, category: 'Basic' },
  
  // Forms
  { type: 'Form', label: 'Form', icon: ClipboardList, category: 'Forms' },
  { type: 'Input', label: 'Input', icon: MousePointer2, category: 'Forms' },
  { type: 'Button', label: 'Button', icon: MousePointer2, category: 'Forms' },
  { type: 'Checkbox', label: 'Checkbox', icon: CheckSquare, category: 'Forms' },
  { type: 'Radio', label: 'Radio', icon: Circle, category: 'Forms' },
  { type: 'Label', label: 'Label', icon: LabelIcon, category: 'Forms' },

  // Extra
  { type: 'Navbar', label: 'Navbar', icon: Menu, category: 'Extra' },

  // Layout (Specific structures)
  { 
    type: 'Container', 
    label: '1 Column', 
    icon: () => <div className="w-6 h-4 border-2 border-current rounded-[2px]" />, 
    category: 'Layout' 
  },
  { 
    type: 'Container', 
    label: '2 Cols 50/50', 
    icon: () => (
      <div className="flex gap-1 w-6 h-4">
        <div className="flex-1 border-2 border-current rounded-[2px]" />
        <div className="flex-1 border-2 border-current rounded-[2px]" />
      </div>
    ), 
    category: 'Layout' 
  },
  { 
    type: 'Container', 
    label: '2 Cols 25/75', 
    icon: () => (
      <div className="flex gap-1 w-6 h-4">
        <div className="w-1/3 border-2 border-current rounded-[2px]" />
        <div className="flex-1 border-2 border-current rounded-[2px]" />
      </div>
    ), 
    category: 'Layout' 
  },
  { 
    type: 'Container', 
    label: '3 Columns', 
    icon: () => (
      <div className="flex gap-1 w-6 h-4">
        <div className="flex-1 border-2 border-current rounded-[2px]" />
        <div className="flex-1 border-2 border-current rounded-[2px]" />
        <div className="flex-1 border-2 border-current rounded-[2px]" />
      </div>
    ), 
    category: 'Layout' 
  },
];

export const SidePanel: React.FC = () => {
  const { activePanel, addBlock } = useAvriBuilderStore();
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<string[]>(['Basic', 'Layout']);

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const categories: BlockDefinition['category'][] = ['Basic', 'Forms', 'Extra', 'Layout'];

  if (activePanel === 'layers') {
    return (
      <div className="w-[280px] bg-white border-r border-gray-100 flex flex-col p-6 items-center justify-center text-gray-400">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-4 bg-gray-50 rounded-full">
            <Monitor className="w-8 h-8 text-gray-200" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-[#001946]">Árbol de Capas</p>
            <p className="text-[9px] font-medium mt-1">Organiza la jerarquía de tus elementos aquí.</p>
          </div>
        </div>
      </div>
    );
  }

  if (activePanel !== 'blocks') {
    return (
      <div className="w-[280px] bg-white border-r border-gray-100 flex flex-col p-6 items-center justify-center text-gray-400">
        <p className="text-[10px] font-black uppercase tracking-widest">Panel en Construcción</p>
      </div>
    );
  }

  return (
    <div className="w-[280px] bg-white border-r border-gray-100 flex flex-col animate-in slide-in-from-left duration-300">
      {/* Search Header */}
      <div className="p-5 border-b border-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search..."
            className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2.5 pl-10 pr-4 text-[11px] font-bold focus:border-[#00E5FF]/40 outline-none transition-all placeholder:text-gray-400 text-[#001946]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Accordion List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
        {categories.map((cat) => {
          const isOpen = openCategories.includes(cat);
          const catBlocks = blocks.filter(b => b.category === cat && b.label.toLowerCase().includes(search.toLowerCase()));

          if (catBlocks.length === 0 && search) return null;

          return (
            <div key={cat} className="border-b border-gray-50 last:border-0">
              <button 
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between p-4 px-5 hover:bg-gray-50 transition-colors group"
              >
                <span className="text-[11px] font-black text-[#001946]/80 group-hover:text-[#00E5FF] transition-colors uppercase tracking-[0.15em]">
                  {cat}
                </span>
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#00E5FF]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#00E5FF]" />
                )}
              </button>

              {isOpen && (
                <div className="px-4 pb-5 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {catBlocks.map((block, idx) => (
                    <button
                      key={`${block.label}-${idx}`}
                      onClick={() => addBlock(block.type)}
                      className="flex flex-col items-center justify-center gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/5 transition-all group shadow-sm hover:shadow-md active:scale-95"
                    >
                      <div className="text-gray-400 group-hover:text-[#00E5FF] transition-all transform group-hover:scale-110 duration-200">
                        <block.icon className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-bold text-gray-400 group-hover:text-[#001946] transition-all text-center leading-tight">
                        {block.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
