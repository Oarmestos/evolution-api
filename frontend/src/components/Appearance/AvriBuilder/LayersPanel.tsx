import React from 'react';
import { 
  useAvriBuilderStore, 
  Block 
} from '../../../store/useAvriBuilderStore';
import { 
  Type, 
  Image as ImageIcon, 
  Square, 
  Columns, 
  Minus, 
  MapPin, 
  Smile, 
  ClipboardList, 
  MousePointer2, 
  CheckSquare, 
  Circle, 
  Menu, 
  Video, 
  PanelTop,
  Maximize2,
  Box,
  Layers,
  Layout,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { cn } from '../../../utils/cn';

const ICON_MAP: Record<string, React.ElementType> = {
  Container: Columns,
  Heading: Type,
  Text: Layout,
  Image: ImageIcon,
  Video: Video,
  Map: MapPin,
  Icon: Smile,
  Divider: Minus,
  Form: ClipboardList,
  Input: MousePointer2,
  Button: MousePointer2,
  Checkbox: CheckSquare,
  Radio: Circle,
  Label: Type,
  Navbar: Menu,
  Hero: PanelTop,
  Spacer: Maximize2,
  ProductGrid: Layout,
  Footer: Box
};

interface LayerItemProps {
  block: Block;
  depth: number;
}

const LayerItem: React.FC<LayerItemProps> = ({ block, depth }) => {
  const { selectedBlockId, selectBlock } = useAvriBuilderStore();
  const isSelected = selectedBlockId === block.id;
  const Icon = ICON_MAP[block.type] || Box;
  const hasChildren = block.children && block.children.length > 0;

  return (
    <div className="flex flex-col">
      <button
        onClick={(e) => {
          e.stopPropagation();
          selectBlock(block.id);
        }}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
        className={cn(
          "group flex items-center gap-2 py-2 pr-3 text-left transition-all border-l-2",
          isSelected 
            ? "bg-[#f1f5f9] border-[#00E5FF] text-[#0f172a]" 
            : "border-transparent text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]"
        )}
      >
        <div className="flex items-center justify-center w-4 h-4">
          {hasChildren ? (
            <ChevronDown className="w-3 h-3 text-[#cbd5e1]" />
          ) : (
            <div className="w-1 h-1 rounded-full bg-[#cbd5e1]" />
          )}
        </div>
        
        <Icon className={cn(
          "w-3.5 h-3.5",
          isSelected ? "text-[#00E5FF]" : "text-[#94a3b8] group-hover:text-[#64748b]"
        )} />
        
        <span className={cn(
          "text-[12px] truncate flex-1",
          isSelected ? "font-semibold" : "font-medium"
        )}>
          {block.props?.label || block.type}
        </span>

        {isSelected && (
          <div className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
        )}
      </button>

      {hasChildren && (
        <div className="flex flex-col">
          {block.children!.map((child) => (
            <LayerItem key={child.id} block={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const LayersPanel: React.FC = () => {
  const { blocks } = useAvriBuilderStore();

  if (blocks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-[#64748b]">
        <div className="p-4 bg-[#f1f5f9] rounded-full mb-3 opacity-50">
          <Layers className="w-7 h-7 text-[#cbd5e1]" />
        </div>
        <p className="text-[12px] font-semibold uppercase tracking-wider text-[#0f172a]">Sin Capas</p>
        <p className="text-[11px] mt-1 text-center">Arrastra bloques para verlos aquí.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
      <div className="px-4 mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#94a3b8]">Estructura de la Página</p>
      </div>
      <div className="flex flex-col">
        {blocks.map((block) => (
          <LayerItem key={block.id} block={block} depth={0} />
        ))}
      </div>
    </div>
  );
};
