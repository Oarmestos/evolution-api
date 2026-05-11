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
    <div className="border-b border-gray-100 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-all group",
          isOpen && "bg-gray-50/30"
        )}
      >
        <div className="flex items-center gap-2.5">
          <Icon className={cn(
            "w-3.5 h-3.5 transition-colors",
            isOpen ? "text-[#00E5FF]" : "text-gray-400 group-hover:text-[#00E5FF]"
          )} />
          <span className={cn(
            "text-[10px] font-black uppercase tracking-[0.15em] transition-colors",
            isOpen ? "text-[#001946]" : "text-gray-400 group-hover:text-[#001946]"
          )}>
            {title}
          </span>
          {badge && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_8px_rgba(0,229,255,0.6)]" />
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="w-3 h-3 text-gray-300" />
        ) : (
          <ChevronRight className="w-3 h-3 text-gray-300" />
        )}
      </button>

      {isOpen && (
        <div className="px-5 pb-6 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};
