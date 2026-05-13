import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../../../utils/cn';

interface PropertySectionProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}

export const PropertySection: React.FC<PropertySectionProps> = ({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = false,
  badge
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#e2e8f0] last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-2.5 transition-all cursor-pointer group",
          isOpen 
            ? "text-[#00E5FF] bg-[#b3f8ff]/20 border-l-[3px] border-[#00E5FF] pl-3 font-bold" 
            : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="text-[12px] font-bold uppercase tracking-wider">
            {title}
          </span>
          {badge && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_8px_rgba(0,229,255,0.6)]" />
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-2 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};
