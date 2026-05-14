import React from 'react';
import { Layout, Settings, AlignLeft, AlignCenter, AlignRight, Maximize, Minus } from 'lucide-react';
import type { Block } from '../../../../../store/useAvriBuilderStore';
import { PropertySection } from '../PropertySection';
import { SliderInput, SegmentedControl } from '../Inputs';
import { cn } from '../../../../../utils/cn';
import { useResponsiveProps } from '../../utils/responsive';

interface PanelProps {
  block: Block;
}

/**
 * 1. Layout Panel (Universal)
 */
export const LayoutPanel: React.FC<PanelProps> = ({ block }) => {
  const { getProp, setProp } = useResponsiveProps(block);

  return (
    <PropertySection title="Layout & Alignment" icon={Layout} defaultOpen={true}>
      <div className="space-y-6">
        {/* Width Control */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-[#64748b] mb-3 block">
            Ancho del Bloque
          </label>
          <div className="grid grid-cols-5 gap-1 bg-[#f1f5f9] p-1 rounded-xl">
            {[
              { val: '25%', label: '25%' },
              { val: '50%', label: '50%' },
              { val: '75%', label: '75%' },
              { val: '100%', label: '100%' },
              { val: 'auto', label: 'Auto' }
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => setProp('width', opt.val)}
                className={cn(
                  "py-1.5 text-[9px] font-black rounded-lg transition-all",
                  (getProp('width') || '100%') === opt.val
                    ? "bg-white text-[#00E5FF] shadow-sm"
                    : "text-[#64748b] hover:text-[#0f172a]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Alignment Control */}
        <SegmentedControl 
          label="Alineación del Bloque"
          value={getProp('alignSelf') || 'auto'}
          onChange={(val) => setProp('alignSelf', val)}
          options={[
            { value: 'flex-start', icon: AlignLeft, label: 'Izquierda' },
            { value: 'center', icon: AlignCenter, label: 'Centro' },
            { value: 'flex-end', icon: AlignRight, label: 'Derecha' },
          ]}
        />

        {/* Free Movement (Margins) */}
        <div className="pt-2 border-t border-[#f1f5f9] space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#64748b] block">
            Mover Libremente (Márgenes)
          </label>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <SliderInput 
              label="Arriba" 
              value={parseInt(getProp('marginTop') || getProp('margin') || 0)} 
              onChange={(v) => setProp('marginTop', v)}
              min={-100} max={100}
            />
            <SliderInput 
              label="Abajo" 
              value={parseInt(getProp('marginBottom') || getProp('margin') || 0)} 
              onChange={(v) => setProp('marginBottom', v)}
              min={-100} max={100}
            />
            <SliderInput 
              label="Izquierda" 
              value={parseInt(getProp('marginLeft') || getProp('margin') || 0)} 
              onChange={(v) => setProp('marginLeft', v)}
              min={-100} max={100}
            />
            <SliderInput 
              label="Derecha" 
              value={parseInt(getProp('marginRight') || getProp('margin') || 0)} 
              onChange={(v) => setProp('marginRight', v)}
              min={-100} max={100}
            />
          </div>
        </div>

        {/* Container Specific Alignment */}
        {['Container', 'Hero', 'Footer', 'Form'].includes(block.type) && (
          <div className="pt-4 border-t border-[#f1f5f9] space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#00E5FF] block">
              Alineación del Contenido
            </label>
            <SegmentedControl 
              label="Eje Horizontal (Align)"
              value={getProp('alignItems') || 'stretch'}
              onChange={(val) => setProp('alignItems', val)}
              options={[
                { value: 'flex-start', icon: AlignLeft, label: 'Izquierda' },
                { value: 'center', icon: AlignCenter, label: 'Centro' },
                { value: 'flex-end', icon: AlignRight, label: 'Derecha' },
                { value: 'stretch', icon: Maximize, label: 'Stretch' },
              ]}
            />
            <SegmentedControl 
              label="Eje Vertical (Justify)"
              value={getProp('justifyContent') || 'flex-start'}
              onChange={(val) => setProp('justifyContent', val)}
              options={[
                { value: 'flex-start', icon: AlignLeft, label: 'Inicio' },
                { value: 'center', icon: AlignCenter, label: 'Centro' },
                { value: 'flex-end', icon: AlignRight, label: 'Fin' },
                { value: 'space-between', icon: Minus, label: 'Separado' },
              ]}
            />
          </div>
        )}
      </div>
    </PropertySection>
  );
};

/**
 * 2. General Information Panel
 */
export const GeneralPanel: React.FC<PanelProps> = ({ block }) => {
  return (
    <PropertySection title="General Info" icon={Settings}>
      <div className="space-y-3">
        <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase font-bold tracking-widest">
          <span>Block ID</span>
          <span className="font-mono lowercase text-[8px] opacity-60">#{block.id.slice(0, 12)}</span>
        </div>
        <div className="bg-gray-50 px-3 py-2 rounded-lg text-[10px] font-mono text-[#001946] border border-gray-100 truncate">
          {block.id}
        </div>
        <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase font-bold tracking-widest pt-2">
          <span>Component</span>
          <span className="text-[#00E5FF]">{block.type}</span>
        </div>
      </div>
    </PropertySection>
  );
};
