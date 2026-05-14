import React, { useEffect } from 'react';
import { SidePanel } from './SidePanel';
import { Toolbar } from './Toolbar';
import { Canvas } from './Canvas';
import { Inspector as StyleInspector } from './Inspector/Inspector';
import { useAvriBuilderStore } from '../../../store/useAvriBuilderStore';
import { useThemeConfigStore } from '../../../store/useThemeConfigStore';
import { useInstanceStore } from '../../../store/useInstanceStore';

export const AvriBuilder: React.FC = () => {
  const { selectBlock, device, initFromTheme, blocks } = useAvriBuilderStore();
  const { theme, fetchTheme, loading } = useThemeConfigStore();
  const { activeInstance } = useInstanceStore();

  // Initialize theme data from server
  useEffect(() => {
    if (activeInstance) {
      fetchTheme();
    }
  }, [fetchTheme, activeInstance]);

  // Sync builder blocks with theme layout if builder is empty
  useEffect(() => {
    // Only initialize if we have an active instance AND loading is finished
    if (activeInstance && !loading && blocks.length === 0 && theme.layout) {
      initFromTheme(theme.layout);
    }
  }, [activeInstance, loading, blocks.length, initFromTheme, theme.layout]);

  const getViewportWidth = () => {
    switch (device) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '1024px';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-[9999]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#00E5FF]/20 border-t-[#00E5FF] rounded-full animate-spin" />
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Cargando Constructor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#f8fafc] text-[#0f172a] overflow-hidden z-[9999]">
      <Toolbar />

      <div className="flex flex-1 pt-12 overflow-hidden">
        {/* Left Panel */}
        <SidePanel />

        {/* Central Canvas */}
        <main
          className="flex-1 overflow-y-auto relative custom-scrollbar shadow-inner"
          style={{ backgroundColor: '#e2e8f0' }}
          onClick={() => selectBlock(null)}
        >
          <div className="flex justify-center p-6 min-h-full">
            <div
              style={{
                width: getViewportWidth(),
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              className="bg-white min-h-[1200px] relative flex flex-col shadow-md border border-[#e2e8f0] rounded-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <Canvas />
            </div>
          </div>
        </main>

        {/* Right Inspector — always visible */}
        <aside className="w-[280px] bg-white border-l border-[#e2e8f0] overflow-y-auto custom-scrollbar shadow-[-2px_0_8px_-4px_rgba(0,0,0,0.1)] flex-shrink-0">
          <StyleInspector />
        </aside>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148,163,184,0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148,163,184,0.5);
        }
      `}</style>
    </div>
  );
};
