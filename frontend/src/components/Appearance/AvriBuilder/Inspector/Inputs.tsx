import React from 'react';

interface UnitInputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  units?: string[];
}

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
      <select 
        className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 text-[11px] font-bold text-[#001946] focus:border-[#00E5FF]/40 outline-none transition-all cursor-pointer appearance-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};
