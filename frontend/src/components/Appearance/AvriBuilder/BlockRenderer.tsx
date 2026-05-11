import React from 'react';
import { useAvriBuilderStore } from '../../../store/useAvriBuilderStore';
import type { Block } from '../../../store/useAvriBuilderStore';
import { cn } from '../../../utils/cn';
import { toCSSValue } from '../../../utils/toCSSValue';
import { Trash2, Copy, MoveVertical } from 'lucide-react';
import * as Library from './BlockLibrary';

const components: Record<string, React.FC<Library.LibraryProps>> = {
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

export const BlockRenderer: React.FC<{ block: Block; readOnly?: boolean }> = ({ block, readOnly = false }) => {
  const { selectedBlockId, selectBlock, deleteBlock, addBlock } = useAvriBuilderStore();
  const isSelected = !readOnly && selectedBlockId === block.id;

  const handleDrop = (e: React.DragEvent) => {
    if (readOnly) return;
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
    if (readOnly) return;
    const droppableTypes = ['Container', 'Hero', 'Footer', 'Form'];
    if (!droppableTypes.includes(block.type)) return;
    
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const Component = components[block.type] || (() => <div>{block.type}</div>);
  const isSection = ['Container', 'Hero', 'Footer', 'Navbar', 'Form'].includes(block.type);
  const blockWidth = block.props.width;

  return (
    <div 
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        alignSelf: block.props.alignSelf || 'auto',
        width: blockWidth === '100%' ? '100%' : (blockWidth === 'auto' ? 'fit-content' : (blockWidth || (isSection ? '100%' : 'fit-content'))),
        maxWidth: '100%',
        marginTop: toCSSValue(block.props.marginTop || block.props.margin),
        marginRight: toCSSValue(block.props.marginRight || block.props.margin),
        marginBottom: toCSSValue(block.props.marginBottom || block.props.margin),
        marginLeft: toCSSValue(block.props.marginLeft || block.props.margin),
      }}
      className={cn(
        "group relative transition-all",
        !readOnly && "cursor-pointer",
        isSelected ? "ring-2 ring-[#00E5FF] ring-offset-4 ring-offset-white rounded-lg z-50" : (!readOnly && "hover:ring-1 hover:ring-[#00E5FF]/30 z-10")
      )}
      onClick={(e) => {
        if (readOnly) return;
        e.preventDefault();
        e.stopPropagation(); // CRITICAL: Stop propagation to prevent selecting parent
        selectBlock(block.id);
      }}
    >
      {isSelected && (
        <div className="absolute -top-10 left-0 flex items-center bg-[#00E5FF] text-[#001946] rounded-md overflow-hidden shadow-2xl z-[100] h-8">
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
        <Component 
          block={block} 
          readOnly={readOnly}
          Renderer={(props: any) => <BlockRenderer {...props} readOnly={readOnly} />} 
        />
      </div>
    </div>
  );
};
