import React, { useEffect } from 'react';
import { ActivityBar } from './ActivityBar';
import { SidePanel } from './SidePanel';
import { Toolbar } from './Toolbar';
import { Canvas } from './Canvas';
import { Inspector as StyleInspector } from './Inspector/Inspector';
import { useAvriBuilderStore } from '../../../store/useAvriBuilderStore';
import { useThemeConfigStore } from '../../../store/useThemeConfigStore';

export const AvriBuilder: React.FC = () => {
  const { selectedBlockId, selectBlock, device, initFromTheme, blocks } = useAvriBuilderStore();
  const { fetchTheme, loading } = useThemeConfigStore();

  // Initialize theme data from server
  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  // Sync builder blocks with theme layout if builder is empty
  useEffect(() => {
    if (blocks.length === 0 && !loading) {
      initFromTheme();
    }
  }, [blocks.length, loading, initFromTheme]);

  const getViewportWidth = () => {
    switch (device) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '1000px';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-[9999]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#00E5FF]/20 border-t-[#00E5FF] rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cargando Constructor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white text-[#001946] overflow-hidden z-[9999]">
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Professional Panels */}
        <ActivityBar />
        <SidePanel />

        {/* Main Viewport (Paper Style) */}
        <div 
          className="flex-1 overflow-y-auto bg-[#f5f5f7] relative custom-scrollbar flex justify-center py-12 px-8"
          onClick={() => selectBlock(null)}
        >
          <div 
            style={{ width: getViewportWidth(), transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
            className="bg-white min-h-[1200px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] relative"
          >
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
