import React from 'react';
import { Maximize2 } from 'lucide-react';
import { PropertySection } from './PropertySection';
import { UnitInput } from './Inputs';
import type { Block } from '../../../../store/useAvriBuilderStore';
import { useResponsiveProps } from '../utils/responsive';

interface SizePanelProps {
  block: Block;
}

export const SizePanel: React.FC<SizePanelProps> = ({ block }) => {
  const { getProp, setProp } = useResponsiveProps(block);

  return (
    <PropertySection title="Size" icon={Maximize2}>
      <div className="space-y-4">
        <div className="flex gap-4">
          <UnitInput 
            label="Width" 
            value={getProp('width') ?? 'auto'} 
            onChange={(val) => setProp('width', val)}
          />
          <UnitInput 
            label="Height" 
            value={getProp('height') ?? 'auto'} 
            onChange={(val) => setProp('height', val)}
          />
        </div>
        <div className="flex gap-4">
          <UnitInput 
            label="Min W" 
            value={getProp('minWidth') ?? '0px'} 
            onChange={(val) => setProp('minWidth', val)}
          />
          <UnitInput 
            label="Min H" 
            value={getProp('minHeight') ?? '0px'} 
            onChange={(val) => setProp('minHeight', val)}
          />
        </div>
        <div className="flex gap-4">
          <UnitInput 
            label="Max W" 
            value={getProp('maxWidth') ?? 'none'} 
            onChange={(val) => setProp('maxWidth', val)}
          />
          <UnitInput 
            label="Max H" 
            value={getProp('maxHeight') ?? 'none'} 
            onChange={(val) => setProp('maxHeight', val)}
          />
        </div>
      </div>
    </PropertySection>
  );
};
