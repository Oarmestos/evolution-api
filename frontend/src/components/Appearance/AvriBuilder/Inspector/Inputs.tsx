import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface UnitInputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  units?: string[];
}

export const TextInput: React.FC<{ label: string, value: string, onChange: (val: string) => void, placeholder?: string }> = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-1.5 flex-1">
    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
    <input 
      type="text"
      className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 text-[11px] font-bold text-[#001946] focus:border-[#00E5FF]/40 outline-none transition-all placeholder:text-gray-300"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

export const UnitInput: React.FC<UnitInputProps> = ({ label, value, onChange }) => {
  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
      <div className="relative group">
        <input 
          type="text"
          className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 text-[11px] font-bold text-[#001946] focus:border-[#00E5FF]/40 outline-none transition-all"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-300 uppercase">
          {typeof value === 'string' && value.includes('%') ? '%' : (value === 'auto' ? '-' : 'px')}
        </div>
      </div>
    </div>
  );
};

import { RotateCcw } from 'lucide-react';

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange }) => {
  return (
    <div className="space-y-1.5 flex-1">
      <div className="flex justify-between items-center">
        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
        {value && (
          <button 
            onClick={() => onChange('')}
            className="p-1 hover:bg-gray-100 rounded-md transition-all text-gray-300 hover:text-red-400"
            title="Reset to default"
          >
            <RotateCcw className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative w-8 h-8 rounded-lg border border-gray-100 shadow-sm overflow-hidden flex-shrink-0">
          <input 
            type="color"
            className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
            value={value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <input 
          type="text"
          className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 text-[11px] font-mono font-bold text-[#001946] focus:border-[#00E5FF]/40 outline-none transition-all"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
        />
      </div>
    </div>
  );
};

interface SegmentedControlProps {
  label?: string;
  value: string;
  options: { value: string; icon: LucideIcon; label?: string }[];
  onChange: (value: string) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({ label, value, options, onChange }) => {
  return (
    <div className="space-y-1.5 flex-1">
      {label && <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>}
      <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex-1 flex items-center justify-center py-1.5 rounded-lg transition-all ${
                isActive 
                  ? 'bg-white text-[#00E5FF] shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title={opt.label}
            >
              <Icon className="w-3.5 h-3.5" />
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
        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
        <span className="text-[10px] font-black text-[#001946]">{value}{unit}</span>
      </div>
      <input 
        type="range"
        min={min}
        max={max}
        step={step}
        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#00E5FF]"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
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
      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <select 
          className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 text-[11px] font-bold text-[#001946] focus:border-[#00E5FF]/40 outline-none transition-all cursor-pointer appearance-none pr-8"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};
