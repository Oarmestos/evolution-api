import React from 'react';
import { Maximize2 } from 'lucide-react';
import { PropertySection } from './PropertySection';
import { UnitInput } from './Inputs';
import { useAvriBuilderStore } from '../../../../store/useAvriBuilderStore';
import type { Block } from '../../../../store/useAvriBuilderStore';

interface SizePanelProps {
  block: Block;
}

export const SizePanel: React.FC<SizePanelProps> = ({ block }) => {
  const { updateBlockProps } = useAvriBuilderStore();
  const p = block.props;

  return (
    <PropertySection title="Size" icon={Maximize2}>
      <div className="space-y-4">
        <div className="flex gap-4">
          <UnitInput 
            label="Width" 
            value={p.width || 'auto'} 
            onChange={(val) => updateBlockProps(block.id, { width: val })}
          />
          <UnitInput 
            label="Height" 
            value={p.height || 'auto'} 
            onChange={(val) => updateBlockProps(block.id, { height: val })}
          />
        </div>
        <div className="flex gap-4">
          <UnitInput 
            label="Min W" 
            value={p.minWidth || '0px'} 
            onChange={(val) => updateBlockProps(block.id, { minWidth: val })}
          />
          <UnitInput 
            label="Min H" 
            value={p.minHeight || '0px'} 
            onChange={(val) => updateBlockProps(block.id, { minHeight: val })}
          />
        </div>
        <div className="flex gap-4">
          <UnitInput 
            label="Max W" 
            value={p.maxWidth || 'none'} 
            onChange={(val) => updateBlockProps(block.id, { maxWidth: val })}
          />
          <UnitInput 
            label="Max H" 
            value={p.maxHeight || 'none'} 
            onChange={(val) => updateBlockProps(block.id, { maxHeight: val })}
          />
        </div>
      </div>
    </PropertySection>
  );
};
