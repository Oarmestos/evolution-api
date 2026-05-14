import React from 'react';
import { Palette, Square } from 'lucide-react';
import { PropertySection } from './PropertySection';
import type { Block } from '../../../../store/useAvriBuilderStore';
import { ColorInput, SliderInput, SegmentedControl } from './Inputs';
import { useResponsiveProps } from '../utils/responsive';

interface StylePanelProps {
  block: Block;
}

export const StylePanel: React.FC<StylePanelProps> = ({ block }) => {
  const { getProp, setProp } = useResponsiveProps(block);

  return (
    <>
      <PropertySection title="Background" icon={Palette}>
        <div className="space-y-4">
          <ColorInput 
            label="Fill Color"
            value={getProp('backgroundColor') || ''}
            onChange={(val) => setProp('backgroundColor', val)}
          />
          <SliderInput 
            label="Opacity"
            value={getProp('opacity') !== undefined ? getProp('opacity') * 100 : 100}
            onChange={(val) => setProp('opacity', val / 100)}
            max={100}
            unit="%"
          />
        </div>
      </PropertySection>

      <PropertySection title="Border & Radius" icon={Square}>
        <div className="space-y-6">
          <SliderInput 
            label="Corner Radius"
            value={getProp('borderRadius') || 0}
            onChange={(val) => setProp('borderRadius', val)}
            max={100}
          />
          
          <div className="space-y-4 pt-4 border-t border-gray-50">
            <div className="flex gap-4">
              <ColorInput 
                label="Border Color"
                value={getProp('borderColor') || '#000000'}
                onChange={(val) => setProp('borderColor', val)}
              />
              <div className="w-24">
                <SliderInput 
                  label="Width"
                  value={getProp('borderWidth') || 0}
                  onChange={(val) => setProp('borderWidth', val)}
                  max={20}
                />
              </div>
            </div>
          </div>
        </div>
      </PropertySection>

      <PropertySection title="Effects" icon={Palette}>
        <div className="space-y-4">
          <SegmentedControl 
            label="Shadow"
            value={getProp('boxShadow') || 'none'}
            options={[
              { label: 'None', value: 'none' },
              { label: 'S', value: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
              { label: 'M', value: '0 10px 15px -3px rgb(0 0 0 / 0.1)' },
              { label: 'L', value: '0 20px 25px -5px rgb(0 0 0 / 0.1)' },
            ]}
            onChange={(val) => setProp('boxShadow', val)}
          />
        </div>
      </PropertySection>
    </>
  );
};
