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
  const p = block.props;

  return (
    <PropertySection title="Typography" icon={Type} defaultOpen>
      <div className="space-y-4">
        <SelectInput 
          label="Font Family"
          value={p.fontFamily || 'Arial'}
          options={[
            { label: 'Arial', value: 'Arial' },
            { label: 'Inter', value: 'Inter' },
            { label: 'Roboto', value: 'Roboto' },
            { label: 'Outfit', value: 'Outfit' }
          ]}
          onChange={(val) => updateBlockProps(block.id, { fontFamily: val })}
        />

        <div className="flex gap-4">
          <UnitInput 
            label="Size" 
            value={p.fontSize || '16px'} 
            onChange={(val) => updateBlockProps(block.id, { fontSize: val })}
          />
          <SelectInput 
            label="Weight"
            value={p.fontWeight || '400'}
            options={[
              { label: 'Light', value: '300' },
              { label: 'Normal', value: '400' },
              { label: 'Bold', value: '700' },
              { label: 'Black', value: '900' }
            ]}
            onChange={(val) => updateBlockProps(block.id, { fontWeight: val })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Color</label>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg p-2">
            <input 
              type="color"
              className="w-6 h-6 rounded-md cursor-pointer border-0 bg-transparent"
              value={p.color || '#001946'}
              onChange={(e) => updateBlockProps(block.id, { color: e.target.value })}
            />
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">
              {p.color || '#001946'}
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
                onClick={() => updateBlockProps(block.id, { textAlign: align.id })}
                className={cn(
                  "flex-1 flex justify-center py-1.5 rounded-md transition-all",
                  p.textAlign === align.id ? "bg-white text-[#00E5FF] shadow-sm" : "text-gray-300 hover:text-[#001946]"
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
