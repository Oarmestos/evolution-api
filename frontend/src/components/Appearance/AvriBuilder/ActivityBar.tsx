import React from 'react';
import { Plus, Layers, Settings, Box } from 'lucide-react';
import { useAvriBuilderStore } from '../../../store/useAvriBuilderStore';
import { cn } from '../../../utils/cn';

export const ActivityBar: React.FC = () => {
  const { activePanel, setActivePanel } = useAvriBuilderStore();

  const tools = [
    { id: 'blocks', icon: Plus, label: 'Bloques' },
    { id: 'layers', icon: Layers, label: 'Capas' },
    { id: 'settings', icon: Settings, label: 'Ajustes' },
  ] as const;

  return (
    <div className="w-[60px] bg-[#0f1016] border-r border-white/5 flex flex-col items-center py-4 gap-4 z-50">
      <div className="mb-4">
        <Box className="w-8 h-8 text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.4)]" />
      </div>

      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setActivePanel(tool.id)}
          className={cn(
            "p-3 rounded-xl transition-all group relative",
            activePanel === tool.id 
              ? "bg-[#00E5FF]/10 text-[#00E5FF]" 
              : "text-gray-500 hover:text-white hover:bg-white/5"
          )}
        >
          <tool.icon className="w-5 h-5" />
          
          {/* Tooltip */}
          <div className="absolute left-full ml-4 px-2 py-1 bg-black text-[10px] font-black uppercase tracking-widest text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-white/10 z-50">
            {tool.label}
          </div>

          {/* Active Indicator */}
          {activePanel === tool.id && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-[#00E5FF] rounded-r-full" />
          )}
        </button>
      ))}
    </div>
  );
};
