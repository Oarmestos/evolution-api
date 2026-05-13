import React from 'react';
import { useAvriBuilderStore } from '../../../store/useAvriBuilderStore';
import type { Block } from '../../../store/useAvriBuilderStore';
import { cn } from '../../../utils/cn';
import { toCSSValue } from '../../../utils/toCSSValue';
import { Trash2, Copy, GripVertical } from 'lucide-react';
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

export const BlockRenderer: React.FC<{ block: Block; readOnly?: boolean; index?: number }> = ({ block, readOnly = false }) => {
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

  const handleDragStart = (e: React.DragEvent) => {
    if (readOnly) return;
    e.dataTransfer.setData('movingBlockId', block.id);
    e.dataTransfer.effectAllowed = 'move';
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
        "group/block relative transition-all",
        !readOnly && "cursor-pointer",
        isSelected 
          ? "ring-2 ring-[#00E5FF] ring-offset-0 z-50 shadow-[inset_0_0_0_2px_#00E5FF]" 
          : (!readOnly && "hover:shadow-[inset_0_0_0_1px_rgba(0,229,255,0.3)] z-10")
      )}
      onClick={(e) => {
        if (readOnly) return;
        e.preventDefault();
        e.stopPropagation();
        selectBlock(block.id);
      }}
    >
      {/* Floating toolbar — matches reference design */}
      {isSelected && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-[#0f172a] flex items-center rounded-lg shadow-md border border-[#00E5FF] h-8 px-1 z-[100]">
          <button
            draggable
            onDragStart={handleDragStart}
            className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:text-[#0f172a] transition-colors cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#00E5FF] px-1">
            {block.type}
          </span>
          <button className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:text-[#0f172a] transition-colors">
            <Copy className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              deleteBlock(block.id);
            }}
            className="w-8 h-8 flex items-center justify-center text-[#ef4444] hover:bg-red-50 transition-colors rounded-sm"
          >
            <Trash2 className="w-4 h-4" />
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
