import React from 'react';
import { Type, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { PropertySection } from './PropertySection';
import { UnitInput, SelectInput, SliderInput } from './Inputs';
import type { Block } from '../../../../store/useAvriBuilderStore';
import { cn } from '../../../../utils/cn';
import { useResponsiveProps } from '../utils/responsive';

interface TypographyPanelProps {
  block: Block;
}

export const TypographyPanel: React.FC<TypographyPanelProps> = ({ block }) => {
  const { getProp, setProp } = useResponsiveProps(block);
  const p = block.props; // Tag uses raw p because it is rarely responsive, but we'll use getProp for styles

  return (
    <PropertySection title="Typography" icon={Type} defaultOpen>
      <div className="space-y-4">
        <SelectInput 
          label="Font Family"
          value={getProp('fontFamily') || 'Arial'}
          options={[
            { label: 'Arial', value: 'Arial' },
            { label: 'Inter', value: 'Inter' },
            { label: 'Roboto', value: 'Roboto' },
            { label: 'Outfit', value: 'Outfit' }
          ]}
          onChange={(val) => setProp('fontFamily', val)}
        />

        <div className="flex gap-4">
          <UnitInput 
            label="Size" 
            value={getProp('fontSize') || '16px'} 
            onChange={(val) => setProp('fontSize', val)}
          />
          <SelectInput 
            label="Weight"
            value={getProp('fontWeight') || '400'}
            options={[
              { label: 'Light', value: '300' },
              { label: 'Normal', value: '400' },
              { label: 'Bold', value: '700' },
              { label: 'Black', value: '900' }
            ]}
            onChange={(val) => setProp('fontWeight', val)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Color</label>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg p-2">
            <input 
              type="color"
              className="w-6 h-6 rounded-md cursor-pointer border-0 bg-transparent"
              value={getProp('color') || '#001946'}
              onChange={(e) => setProp('color', e.target.value)}
            />
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">
              {getProp('color') || '#001946'}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Align</label>
          <div className="flex bg-gray-50 border border-gray-100 rounded-lg p-1">
            {[
              { id: 'left', icon: AlignLeft },
              { id: 'center', icon: AlignCenter },
              { id: 'right', icon: AlignRight },
              { id: 'justify', icon: AlignJustify }
            ].map(align => (
              <button
                key={align.id}
                onClick={() => setProp('textAlign', align.id)}
                className={cn(
                  "flex-1 flex justify-center py-1.5 rounded-md transition-all",
                  getProp('textAlign') === align.id ? "bg-white text-[#00E5FF] shadow-sm" : "text-gray-300 hover:text-[#001946]"
                )}
              >
                <align.icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-50 space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#00E5FF] block">
            Avanzado / SEO
          </label>
          <div className="flex gap-4">
            <SelectInput 
              label="HTML Tag"
              value={p.tag || 'h2'}
              options={[
                { label: 'H1 (Principal)', value: 'h1' },
                { label: 'H2 (Sección)', value: 'h2' },
                { label: 'H3 (Subtítulo)', value: 'h3' },
                { label: 'H4', value: 'h4' },
                { label: 'H5', value: 'h5' },
                { label: 'H6', value: 'h6' },
                { label: 'Párrafo (p)', value: 'p' },
                { label: 'Div', value: 'div' }
              ]}
              onChange={(val) => setProp('tag', val)}
            />
          </div>
          <SliderInput 
            label="Line Height"
            value={getProp('lineHeight') || 1.5}
            onChange={(val) => setProp('lineHeight', val)}
            min={1} max={3} step={0.1} unit="x"
          />
        </div>
      </div>
    </PropertySection>
  );
};
