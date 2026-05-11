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
  const p = block.props;

  return (
    <PropertySection title="Space" icon={Move}>
      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#001946] opacity-60">Padding (Internal)</label>
          <div className="grid grid-cols-2 gap-3">
            <UnitInput label="Top" value={p.paddingTop ?? '0px'} onChange={(v) => updateBlockProps(block.id, { paddingTop: v })} />
            <UnitInput label="Right" value={p.paddingRight ?? '0px'} onChange={(v) => updateBlockProps(block.id, { paddingRight: v })} />
            <UnitInput label="Bottom" value={p.paddingBottom ?? '0px'} onChange={(v) => updateBlockProps(block.id, { paddingBottom: v })} />
            <UnitInput label="Left" value={p.paddingLeft ?? '0px'} onChange={(v) => updateBlockProps(block.id, { paddingLeft: v })} />
          </div>
        </div>

        <div className="h-[1px] bg-gray-50" />

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#001946] opacity-60">Margin (External)</label>
          <div className="grid grid-cols-2 gap-3">
            <UnitInput label="Top" value={p.marginTop ?? '0px'} onChange={(v) => updateBlockProps(block.id, { marginTop: v })} />
            <UnitInput label="Right" value={p.marginRight ?? '0px'} onChange={(v) => updateBlockProps(block.id, { marginRight: v })} />
            <UnitInput label="Bottom" value={p.marginBottom ?? '0px'} onChange={(v) => updateBlockProps(block.id, { marginBottom: v })} />
            <UnitInput label="Left" value={p.marginLeft ?? '0px'} onChange={(v) => updateBlockProps(block.id, { marginLeft: v })} />
          </div>
        </div>
      </div>
    </PropertySection>
  );
};
