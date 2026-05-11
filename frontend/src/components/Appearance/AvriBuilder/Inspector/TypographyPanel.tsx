import React from 'react';
import { Type, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { PropertySection } from './PropertySection';
import { UnitInput, SelectInput } from './Inputs';
import { useAvriBuilderStore } from '../../../../store/useAvriBuilderStore';
import type { Block } from '../../../../store/useAvriBuilderStore';
import { cn } from '../../../../utils/cn';

interface TypographyPanelProps {
  block: Block;
}

export const TypographyPanel: React.FC<TypographyPanelProps> = ({ block }) => {
  const { updateBlockProps } = useAvriBuilderStore();
  const style = block.props.style || {};

  const updateStyle = (newStyle: any) => {
    updateBlockProps(block.id, { style: { ...style, ...newStyle } });
  };

  return (
    <PropertySection title="Typography" icon={Type} defaultOpen>
      <div className="space-y-4">
        <SelectInput 
          label="Font Family"
          value={style.fontFamily || 'Arial'}
          options={[
            { label: 'Arial', value: 'Arial' },
            { label: 'Inter', value: 'Inter' },
            { label: 'Roboto', value: 'Roboto' },
            { label: 'Outfit', value: 'Outfit' }
          ]}
          onChange={(val) => updateStyle({ fontFamily: val })}
        />

        <div className="flex gap-4">
          <UnitInput 
            label="Size" 
            value={style.fontSize || '16px'} 
            onChange={(val) => updateStyle({ fontSize: val })}
          />
          <SelectInput 
            label="Weight"
            value={style.fontWeight || '400'}
            options={[
              { label: 'Light', value: '300' },
              { label: 'Normal', value: '400' },
              { label: 'Bold', value: '700' },
              { label: 'Black', value: '900' }
            ]}
            onChange={(val) => updateStyle({ fontWeight: val })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Color</label>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg p-2">
            <input 
              type="color"
              className="w-6 h-6 rounded-md cursor-pointer border-0 bg-transparent"
              value={style.color || '#001946'}
              onChange={(e) => updateStyle({ color: e.target.value })}
            />
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">
              {style.color || '#001946'}
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
                onClick={() => updateStyle({ textAlign: align.id })}
                className={cn(
                  "flex-1 flex justify-center py-1.5 rounded-md transition-all",
                  style.textAlign === align.id ? "bg-white text-[#00E5FF] shadow-sm" : "text-gray-300 hover:text-[#001946]"
                )}
              >
                <align.icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </PropertySection>
  );
};
