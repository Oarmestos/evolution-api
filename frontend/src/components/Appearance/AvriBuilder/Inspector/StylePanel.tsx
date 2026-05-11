import React from 'react';
import { Palette, Square } from 'lucide-react';
import { PropertySection } from './PropertySection';
import { useAvriBuilderStore } from '../../../../store/useAvriBuilderStore';
import type { Block } from '../../../../store/useAvriBuilderStore';
import { ColorInput, SliderInput } from './Inputs';

interface StylePanelProps {
  block: Block;
}

export const StylePanel: React.FC<StylePanelProps> = ({ block }) => {
  const { updateBlockProps } = useAvriBuilderStore();

  const updateProp = (key: string, value: any) => {
    updateBlockProps(block.id, { [key]: value });
  };

  return (
    <>
      <PropertySection title="Background" icon={Palette}>
        <div className="space-y-4">
          <ColorInput 
            label="Fill Color"
            value={block.props.backgroundColor || ''}
            onChange={(val) => updateProp('backgroundColor', val)}
          />
          <SliderInput 
            label="Opacity"
            value={block.props.opacity !== undefined ? block.props.opacity * 100 : 100}
            onChange={(val) => updateProp('opacity', val / 100)}
            max={100}
            unit="%"
          />
        </div>
      </PropertySection>

      <PropertySection title="Border & Radius" icon={Square}>
        <div className="space-y-6">
          <SliderInput 
            label="Corner Radius"
            value={block.props.borderRadius || 0}
            onChange={(val) => updateProp('borderRadius', val)}
            max={100}
          />
          
          <div className="space-y-4 pt-4 border-t border-gray-50">
            <div className="flex gap-4">
              <ColorInput 
                label="Border Color"
                value={block.props.borderColor || '#000000'}
                onChange={(val) => updateProp('borderColor', val)}
              />
              <div className="w-24">
                <SliderInput 
                  label="Width"
                  value={block.props.borderWidth || 0}
                  onChange={(val) => updateProp('borderWidth', val)}
                  max={20}
                />
              </div>
            </div>
          </div>
        </div>
      </PropertySection>
    </>
  );
};
