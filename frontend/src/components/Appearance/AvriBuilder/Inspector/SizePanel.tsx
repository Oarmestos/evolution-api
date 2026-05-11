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
  const style = block.props.style || {};

  const updateStyle = (newStyle: any) => {
    updateBlockProps(block.id, { style: { ...style, ...newStyle } });
  };

  return (
    <PropertySection title="Size" icon={Maximize2}>
      <div className="space-y-4">
        <div className="flex gap-4">
          <UnitInput 
            label="Width" 
            value={style.width || 'auto'} 
            onChange={(val) => updateStyle({ width: val })}
          />
          <UnitInput 
            label="Height" 
            value={style.height || 'auto'} 
            onChange={(val) => updateStyle({ height: val })}
          />
        </div>
        <div className="flex gap-4">
          <UnitInput 
            label="Min W" 
            value={style.minWidth || '0px'} 
            onChange={(val) => updateStyle({ minWidth: val })}
          />
          <UnitInput 
            label="Min H" 
            value={style.minHeight || '0px'} 
            onChange={(val) => updateStyle({ minHeight: val })}
          />
        </div>
        <div className="flex gap-4">
          <UnitInput 
            label="Max W" 
            value={style.maxWidth || 'none'} 
            onChange={(val) => updateStyle({ maxWidth: val })}
          />
          <UnitInput 
            label="Max H" 
            value={style.maxHeight || 'none'} 
            onChange={(val) => updateStyle({ maxHeight: val })}
          />
        </div>
      </div>
    </PropertySection>
  );
};
