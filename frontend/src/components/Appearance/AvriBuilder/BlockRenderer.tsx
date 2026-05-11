import React from 'react';
import { useAvriBuilderStore } from '../../../store/useAvriBuilderStore';
import type { Block } from '../../../store/useAvriBuilderStore';
import { cn } from '../../../utils/cn';
import { Trash2, Copy, MoveVertical } from 'lucide-react';
import * as Library from './BlockLibrary';

const components: Record<string, React.FC<{ block: Block; Renderer: React.FC<{ block: Block }> }>> = {
  Container: Library.Container,
  Heading: Library.Heading,
  Text: Library.Text,
  Button: Library.Button,
  Image: Library.Image,
  Divider: Library.Divider,
  Hero: Library.Hero,
  Spacer: Library.Spacer,
  ProductGrid: Library.ProductGrid,
  Footer: Library.Footer,
  Video: Library.Video,
  Map: Library.Map,
  Icon: Library.Icon,
  Navbar: Library.Navbar,
  Form: Library.Form,
  Input: Library.Input,
  Checkbox: Library.Checkbox,
  Radio: Library.Radio,
  Label: Library.Label
};

export const BlockRenderer: React.FC<{ block: Block }> = ({ block }) => {
  const { selectedBlockId, selectBlock, deleteBlock, addBlock } = useAvriBuilderStore();
  const isSelected = selectedBlockId === block.id;

  const handleDrop = (e: React.DragEvent) => {
    const droppableTypes = ['Container', 'Hero', 'Footer', 'Form'];
    if (!droppableTypes.includes(block.type)) return;
    
    e.preventDefault();
    e.stopPropagation();
    const type = e.dataTransfer.getData('blockType') as any;
    if (type) {
      addBlock(type, block.id);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    const droppableTypes = ['Container', 'Hero', 'Footer', 'Form'];
    if (!droppableTypes.includes(block.type)) return;
    
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const Component = components[block.type] || (() => <div>{block.type}</div>);

  return (
    <div 
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={cn(
        "group relative transition-all w-full cursor-pointer",
        isSelected ? "ring-2 ring-[#00E5FF] ring-offset-2 ring-offset-white rounded-lg z-10" : "hover:ring-1 hover:ring-[#00E5FF]/30"
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        selectBlock(block.id);
      }}
    >
      {isSelected && (
        <div className="absolute -top-10 left-0 flex items-center bg-[#00E5FF] text-[#001946] rounded-md overflow-hidden shadow-xl z-20 h-8">
          <div className="px-3 border-r border-black/5 flex items-center gap-2 h-full">
            <MoveVertical className="w-3 h-3 opacity-40 cursor-grab" />
            <span className="text-[9px] font-black uppercase tracking-widest">{block.type}</span>
          </div>
          <button className="p-2 hover:bg-black/5 transition-colors h-full flex items-center">
            <Copy className="w-3 h-3" />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              deleteBlock(block.id);
            }}
            className="p-2 hover:bg-red-500 hover:text-white transition-colors h-full flex items-center"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className={cn(block.type === 'Container' && "min-h-[20px]")}>
        <Component block={block} Renderer={BlockRenderer} />
      </div>
    </div>
  );
};
