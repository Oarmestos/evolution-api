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
  Monitor,
  PanelTop,
  Maximize2,
  Box,
  Layers,
  Plus,
  LayoutGrid,
  Settings
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { LayersPanel } from './LayersPanel';
import { GlobalSettingsPanel } from './GlobalSettingsPanel';

interface BlockDefinition {
  type: BlockType;
  label: string;
  icon: React.ElementType;
  category: 'Sections' | 'Basic' | 'Forms' | 'Extra';
  colSpan?: number;
  preset?: string;
}

const blocks: BlockDefinition[] = [
  // Sections
  { type: 'Hero', label: 'Hero Section', icon: PanelTop, category: 'Sections' },
  { type: 'ProductGrid', label: 'Product Grid', icon: Layers, category: 'Sections' },
  { type: 'Footer', label: 'Footer', icon: Box, category: 'Sections' },
  { type: 'Spacer', label: 'Spacer', icon: Maximize2, category: 'Sections' },

  // Basic
  { type: 'Container', label: '1 Column', icon: Square, category: 'Basic' },
  { type: 'Container', label: '2 Columns', icon: Columns, category: 'Basic', preset: '2-columns' },
  { type: 'Heading', label: 'Heading', icon: Type, category: 'Basic' },
  { type: 'Text', label: 'Text', icon: Type, category: 'Basic' },
  { type: 'Image', label: 'Image', icon: ImageIcon, category: 'Basic' },
  { type: 'Video', label: 'Video', icon: Video, category: 'Basic' },
  { type: 'Map', label: 'Map', icon: MapPin, category: 'Basic' },
  { type: 'Icon', label: 'Icon', icon: Smile, category: 'Basic' },
  { type: 'Divider', label: 'Divider', icon: Minus, category: 'Basic', colSpan: 2 },
  
  // Forms
  { type: 'Form', label: 'Form Container', icon: ClipboardList, category: 'Forms' },
  { type: 'Input', label: 'Input Field', icon: MousePointer2, category: 'Forms' },
  { type: 'Button', label: 'Action Button', icon: MousePointer2, category: 'Forms' },
  { type: 'Checkbox', label: 'Checkbox', icon: CheckSquare, category: 'Forms' },
  { type: 'Radio', label: 'Radio Button', icon: Circle, category: 'Forms' },
  { type: 'Label', label: 'Field Label', icon: LabelIcon, category: 'Forms' },

  // Extra
  { type: 'Navbar', label: 'Navigation', icon: Menu, category: 'Extra' },
];

export const SidePanel: React.FC = () => {
  const { activePanel, setActivePanel, addBlock } = useAvriBuilderStore();
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<string[]>(['Basic']);

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const categories: BlockDefinition['category'][] = ['Sections', 'Basic', 'Forms', 'Extra'];

  // Top action bar icons
  const panelTools = [
    { id: 'blocks' as const, icon: LayoutGrid },
    { id: 'layers' as const, icon: Layers },
    { id: 'settings' as const, icon: Settings },
  ];

  const renderContent = () => {
    if (activePanel === 'layers') {
      return <LayersPanel />;
    }

    if (activePanel === 'settings') {
      return <GlobalSettingsPanel />;
    }

    return (
      <>
        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#64748b]" />
            <input 
              type="text"
              placeholder="Search..."
              className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-sm h-8 pl-8 pr-3 text-[13px] text-[#0f172a] focus:border-[#00E5FF] focus:bg-white focus:ring-0 placeholder:text-[#64748b] transition-colors outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Accordion Categories */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-10">
          {categories.map((cat) => {
            const isOpen = openCategories.includes(cat);
            const catBlocks = blocks.filter(b => b.category === cat && b.label.toLowerCase().includes(search.toLowerCase()));
            if (catBlocks.length === 0 && search) return null;

            return (
              <div key={cat} className="mb-1">
                <button 
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    "w-full flex items-center justify-between py-2 transition-colors cursor-pointer",
                    isOpen 
                      ? "text-[#0f172a] border-b border-[#e2e8f0] mb-2" 
                      : "text-[#64748b] hover:text-[#0f172a]"
                  )}
                >
                  <span className="text-[12px] font-bold uppercase tracking-wider">
                    {cat}
                  </span>
                  {isOpen 
                    ? <ChevronDown className="w-4 h-4" /> 
                    : <ChevronRight className="w-4 h-4" />
                  }
                </button>

                {isOpen && (
                  <div className="grid grid-cols-2 gap-2 pb-3">
                    {catBlocks.map((block, idx) => (
                      <button
                        key={`${block.label}-${idx}`}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('blockType', block.type);
                          if (block.preset) {
                            e.dataTransfer.setData('blockPreset', block.preset);
                          }
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onClick={() => addBlock(block.type, undefined, block.preset)}
                        className={cn(
                          "bg-white border border-[#e2e8f0] rounded-lg p-2 flex flex-col items-center justify-center gap-1.5 cursor-grab active:cursor-grabbing hover:border-[#00E5FF] hover:shadow-sm transition-all h-[72px]",
                          block.colSpan === 2 && "col-span-2"
                        )}
                      >
                        <block.icon className="w-6 h-6 text-[#64748b]" />
                        <span className="text-[11px] font-semibold text-[#64748b] text-center leading-tight">
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
      </>
    );
  };

  return (
    <aside className="w-[280px] bg-white border-r border-[#e2e8f0] h-full flex flex-col flex-shrink-0 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.1)]">
      {/* Top Action Bar */}
      <div className="p-3 flex items-center gap-2 bg-[#f8fafc] border-b border-[#e2e8f0]">
        <button
          onClick={() => setActivePanel('blocks')}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-[#00E5FF] border border-[#e2e8f0] shadow-sm hover:border-[#00E5FF] transition-colors flex-shrink-0"
        >
          <Plus className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1 flex-1 justify-end">
          {panelTools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActivePanel(tool.id)}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-xl transition-all",
                activePanel === tool.id
                  ? "text-[#00E5FF] bg-white shadow-sm"
                  : "text-[#64748b] hover:bg-white hover:text-[#00E5FF]"
              )}
            >
              <tool.icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>

      {renderContent()}
    </aside>
  );
};
