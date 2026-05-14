import React from 'react';
import { Move } from 'lucide-react';
import { PropertySection } from './PropertySection';
import { UnitInput } from './Inputs';
import type { Block } from '../../../../store/useAvriBuilderStore';
import { useResponsiveProps } from '../utils/responsive';

interface SpacePanelProps {
  block: Block;
}

export const SpacePanel: React.FC<SpacePanelProps> = ({ block }) => {
  const { getProp, setProp } = useResponsiveProps(block);

  return (
    <PropertySection title="Space" icon={Move}>
      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#001946] opacity-60">Padding (Internal)</label>
          <div className="grid grid-cols-2 gap-3">
            <UnitInput label="Top" value={getProp('paddingTop') ?? '0px'} onChange={(v) => setProp('paddingTop', v)} />
            <UnitInput label="Right" value={getProp('paddingRight') ?? '0px'} onChange={(v) => setProp('paddingRight', v)} />
            <UnitInput label="Bottom" value={getProp('paddingBottom') ?? '0px'} onChange={(v) => setProp('paddingBottom', v)} />
            <UnitInput label="Left" value={getProp('paddingLeft') ?? '0px'} onChange={(v) => setProp('paddingLeft', v)} />
          </div>
        </div>

        <div className="h-[1px] bg-gray-50" />

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#001946] opacity-60">Margin (External)</label>
          <div className="grid grid-cols-2 gap-3">
            <UnitInput label="Top" value={getProp('marginTop') ?? '0px'} onChange={(v) => setProp('marginTop', v)} />
            <UnitInput label="Right" value={getProp('marginRight') ?? '0px'} onChange={(v) => setProp('marginRight', v)} />
            <UnitInput label="Bottom" value={getProp('marginBottom') ?? '0px'} onChange={(v) => setProp('marginBottom', v)} />
            <UnitInput label="Left" value={getProp('marginLeft') ?? '0px'} onChange={(v) => setProp('marginLeft', v)} />
          </div>
        </div>
      </div>
    </PropertySection>
  );
};
