import React from 'react';
import { Move } from 'lucide-react';
import { PropertySection } from './PropertySection';
import { UnitInput } from './Inputs';
import { useAvriBuilderStore } from '../../../../store/useAvriBuilderStore';
import type { Block } from '../../../../store/useAvriBuilderStore';

interface SpacePanelProps {
  block: Block;
}

export const SpacePanel: React.FC<SpacePanelProps> = ({ block }) => {
  const { updateBlockProps } = useAvriBuilderStore();
  const style = block.props.style || {};

  const updateStyle = (newStyle: any) => {
    updateBlockProps(block.id, { style: { ...style, ...newStyle } });
  };

  return (
    <PropertySection title="Space" icon={Move}>
      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#001946]">Padding</label>
          <div className="grid grid-cols-2 gap-3">
            <UnitInput label="Top" value={style.paddingTop || '0'} onChange={(v) => updateStyle({ paddingTop: v })} />
            <UnitInput label="Right" value={style.paddingRight || '0'} onChange={(v) => updateStyle({ paddingRight: v })} />
            <UnitInput label="Bottom" value={style.paddingBottom || '0'} onChange={(v) => updateStyle({ paddingBottom: v })} />
            <UnitInput label="Left" value={style.paddingLeft || '0'} onChange={(v) => updateStyle({ paddingLeft: v })} />
          </div>
        </div>

        <div className="h-[1px] bg-gray-50" />

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#001946]">Margin</label>
          <div className="grid grid-cols-2 gap-3">
            <UnitInput label="Top" value={style.marginTop || '0'} onChange={(v) => updateStyle({ marginTop: v })} />
            <UnitInput label="Right" value={style.marginRight || '0'} onChange={(v) => updateStyle({ marginRight: v })} />
            <UnitInput label="Bottom" value={style.marginBottom || '0'} onChange={(v) => updateStyle({ marginBottom: v })} />
            <UnitInput label="Left" value={style.marginLeft || '0'} onChange={(v) => updateStyle({ marginLeft: v })} />
          </div>
        </div>
      </div>
    </PropertySection>
  );
};
