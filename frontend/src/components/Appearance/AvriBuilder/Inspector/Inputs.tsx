import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { RotateCcw } from 'lucide-react';

export const TextInput: React.FC<{ label: string, value: string, onChange: (val: string) => void, placeholder?: string }> = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-1.5 flex-1">
    <label className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{label}</label>
    <input 
      type="text"
      className="w-full bg-white border border-[#e2e8f0] rounded-sm py-2 px-3 text-[13px] text-[#0f172a] focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] outline-none transition-all placeholder:text-[#94a3b8] shadow-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onClick={(e) => e.stopPropagation()}
    />
  </div>
);

interface UnitInputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  units?: string[];
}

export const UnitInput: React.FC<UnitInputProps> = ({ label, value, onChange }) => {
  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{label}</label>
      <div className="flex items-center bg-white border border-[#e2e8f0] rounded-sm overflow-hidden shadow-sm focus-within:border-[#00E5FF] focus-within:ring-1 focus-within:ring-[#00E5FF]">
        <input 
          type="text"
          className="w-16 h-8 bg-transparent border-none text-right text-[13px] text-[#0f172a] focus:ring-0 px-2 outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
        <select className="h-8 bg-[#f1f5f9] text-[#64748b] border-none text-[11px] px-1.5 focus:ring-0 cursor-pointer border-l border-[#e2e8f0]">
          <option>{typeof value === 'string' && value.includes('%') ? '%' : (value === 'auto' ? '-' : 'px')}</option>
        </select>
      </div>
    </div>
  );
};

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange }) => {
  return (
    <div className="space-y-1.5 flex-1">
      <div className="flex justify-between items-center">
        <label className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{label}</label>
        {value && (
          <button 
            onClick={() => onChange('')}
            className="p-1 hover:bg-[#f1f5f9] rounded-sm transition-all text-[#94a3b8] hover:text-[#ef4444]"
            title="Reset to default"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative w-8 h-8 rounded-sm border border-[#e2e8f0] shadow-sm overflow-hidden flex-shrink-0">
          <input 
            type="color"
            className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
            value={value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <input 
          type="text"
          className="w-full bg-white border border-[#e2e8f0] rounded-sm py-2 px-3 text-[13px] font-mono text-[#0f172a] focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] outline-none transition-all shadow-sm"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

interface SegmentedControlProps {
  label?: string;
  value: string;
  options: { value: string; icon?: LucideIcon; label?: string }[];
  onChange: (value: string) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({ label, value, options, onChange }) => {
  return (
    <div className="space-y-1.5 flex-1">
      {label && <label className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{label}</label>}
      <div className="flex bg-[#f1f5f9] p-1 rounded-sm gap-0.5">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex-1 flex items-center justify-center py-1.5 rounded-sm transition-all ${
                isActive 
                  ? 'bg-white text-[#00E5FF] shadow-sm' 
                  : 'text-[#94a3b8] hover:text-[#64748b]'
              }`}
              title={opt.label}
            >
              {Icon ? <Icon className="w-3.5 h-3.5" /> : <span className="text-[10px] font-bold px-2">{opt.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface SliderInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export const SliderInput: React.FC<SliderInputProps> = ({ label, value, min = 0, max = 100, step = 1, unit = 'px', onChange }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{label}</label>
        <div className="flex items-center bg-white border border-[#e2e8f0] rounded-sm overflow-hidden shadow-sm focus-within:border-[#00E5FF] focus-within:ring-1 focus-within:ring-[#00E5FF]">
          <input 
            type="text"
            className="w-12 h-7 bg-transparent border-none text-right text-[13px] text-[#0f172a] focus:ring-0 px-1.5 outline-none"
            value={value}
            onChange={(e) => onChange(Number(e.target.value) || 0)}
            onClick={(e) => e.stopPropagation()}
          />
          <span className="text-[11px] text-[#64748b] bg-[#f1f5f9] h-7 flex items-center px-1.5 border-l border-[#e2e8f0]">{unit}</span>
        </div>
      </div>
      <input 
        type="range"
        min={min}
        max={max}
        step={step}
        className="w-full h-1.5 bg-[#e2e8f0] rounded-lg appearance-none cursor-pointer accent-[#00E5FF]"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

interface SelectInputProps {
  label: string;
  value: string;
  options: { label: string, value: string }[];
  onChange: (value: string) => void;
}

export const SelectInput: React.FC<SelectInputProps> = ({ label, value, options, onChange }) => {
  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{label}</label>
      <div className="relative">
        <select 
          className="w-full bg-white border border-[#e2e8f0] rounded-sm py-2 px-3 text-[13px] text-[#0f172a] focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] outline-none transition-all cursor-pointer appearance-none pr-8 shadow-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#94a3b8]">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export const ToggleInput: React.FC<{ label: string, value: boolean, onChange: (val: boolean) => void }> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between p-2 bg-[#f8fafc] rounded-lg border border-[#f1f5f9]">
    <label className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{label}</label>
    <button 
      onClick={() => onChange(!value)}
      className={`w-8 h-4 rounded-full transition-all relative ${value ? 'bg-[#00E5FF]' : 'bg-[#e2e8f0]'}`}
    >
      <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-all ${value ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  </div>
);
