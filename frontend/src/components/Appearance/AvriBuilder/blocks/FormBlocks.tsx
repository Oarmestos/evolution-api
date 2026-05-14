import React from 'react';
import { ClipboardList, CheckSquare } from 'lucide-react';
import { getBlockStyles } from '../utils/getBlockStyles';
import { cn } from '../../../../utils/cn';
import type { LibraryProps } from '../BlockLibrary';

export const Form: React.FC<LibraryProps> = ({ block, Renderer }) => (
  <form 
    style={getBlockStyles(block)} 
    className="w-full space-y-4 bg-gray-50/50 rounded-3xl border border-gray-100 transition-all"
    onSubmit={(e) => e.preventDefault()}
  >
    {block.children?.length === 0 ? (
      <div className="py-12 flex flex-col items-center gap-3 text-gray-300 border-2 border-dashed border-gray-100 rounded-2xl">
        <ClipboardList className="w-8 h-8 opacity-20" />
        <span className="text-[9px] font-black uppercase tracking-widest">Arrastra campos aquí</span>
      </div>
    ) : (
      block.children?.map(child => <Renderer key={child.id} block={child} />)
    )}
  </form>
);

export const Input: React.FC<LibraryProps> = ({ block }) => {
  const isUnderline = block.props.borderStyle === 'underline';
  const isNone = block.props.borderStyle === 'none';

  return (
    <div className="w-full space-y-1.5">
      {block.props.label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-[#001946] ml-1">
          {block.props.label} {block.props.required && <span className="text-[#00E5FF] ml-1">*</span>}
        </label>
      )}
      <input 
        type={block.props.type || 'text'}
        placeholder={block.props.placeholder || 'Escribe aquí...'}
        required={block.props.required}
        style={{
          ...getBlockStyles(block),
          ...(isUnderline ? { borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0, paddingLeft: 0, paddingRight: 0, backgroundColor: 'transparent' } : {}),
          ...(isNone ? { border: 'none' } : {}),
        }}
        className={cn(
          "w-full px-4 py-3 text-sm outline-none transition-all shadow-sm focus:shadow-md",
          !isUnderline && !isNone ? "bg-white border border-gray-100 rounded-xl focus:border-[#00E5FF]/40" : "",
          isUnderline ? "border-b-2 border-gray-200 focus:border-[#00E5FF]" : "",
          isNone ? "bg-gray-50 rounded-xl focus:bg-white" : ""
        )}
      />
    </div>
  );
};

export const Checkbox: React.FC<LibraryProps> = ({ block }) => (
  <div className="flex items-center gap-3 cursor-pointer group">
    <div className="w-5 h-5 border-2 border-gray-200 rounded-md flex items-center justify-center group-hover:border-[#00E5FF] transition-colors bg-white">
      <CheckSquare className="w-3 h-3 text-[#00E5FF] opacity-0 group-active:opacity-100 transition-opacity" />
    </div>
    <span className="text-sm font-medium text-gray-600">{block.props.label || 'Opción'}</span>
  </div>
);

export const Radio: React.FC<LibraryProps> = ({ block }) => (
  <div className="flex items-center gap-3 cursor-pointer group">
    <div className="w-5 h-5 border-2 border-gray-200 rounded-full flex items-center justify-center group-hover:border-[#00E5FF] transition-colors bg-white">
      <div className="w-2 h-2 bg-[#00E5FF] rounded-full opacity-0 group-active:opacity-100 transition-opacity" />
    </div>
    <span className="text-sm font-medium text-gray-600">{block.props.label || 'Opción'}</span>
  </div>
);

export const Label: React.FC<LibraryProps> = ({ block }) => (
  <label style={getBlockStyles(block)} className="text-sm font-bold text-[#001946]">
    {block.props.text || 'Etiqueta de Campo'}
  </label>
);
