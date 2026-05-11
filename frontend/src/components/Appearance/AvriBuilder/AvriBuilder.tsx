import React from 'react';
import { ActivityBar } from './ActivityBar';
import { SidePanel } from './SidePanel';
import { Toolbar } from './Toolbar';
import { Canvas } from './Canvas';
import { Inspector as StyleInspector } from './Inspector/Inspector';
import { useAvriBuilderStore } from '../../../store/useAvriBuilderStore';

export const AvriBuilder: React.FC = () => {
  const { selectedBlockId, selectBlock } = useAvriBuilderStore();

  return (
    <div className="fixed inset-0 flex flex-col bg-white text-[#001946] overflow-hidden z-[9999]">
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Professional Panels */}
        <ActivityBar />
        <SidePanel />

        {/* Main Viewport (Paper Style) */}
        <div 
          className="flex-1 overflow-y-auto bg-[#f5f5f7] relative custom-scrollbar flex justify-center py-12"
          onClick={() => selectBlock(null)}
        >
          <div className="w-full max-w-[1000px] bg-white min-h-[1200px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] relative">
            <Canvas />
          </div>
        </div>

        {/* Right Inspector */}
        {selectedBlockId && (
          <div className="w-[300px] bg-[#0f1016] border-l border-white/5 overflow-y-auto animate-in slide-in-from-right duration-300">
            <StyleInspector />
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};
