import React, { useState } from 'react';
import { useAvriBuilderStore } from '../../../store/useAvriBuilderStore';
import { BlockRenderer } from './BlockRenderer.tsx';
import { Plus } from 'lucide-react';

export const Canvas: React.FC = () => {
  const { blocks, addBlock, moveBlock } = useAvriBuilderStore();
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleNewBlockDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIndex(null);
    const type = e.dataTransfer.getData('blockType') as any;
    const preset = e.dataTransfer.getData('blockPreset');
    if (type) {
      addBlock(type, undefined, preset);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropZoneDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);

    const movingBlockId = e.dataTransfer.getData('movingBlockId');
    if (movingBlockId) {
      moveBlock(movingBlockId, index);
      return;
    }

    const type = e.dataTransfer.getData('blockType') as any;
    const preset = e.dataTransfer.getData('blockPreset');
    if (type) {
      addBlock(type, undefined, preset);
    }
  };

  const handleDropZoneDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDropZoneDragLeave = () => {
    setDragOverIndex(null);
  };

  return (
    <div
      className="w-full min-h-full flex flex-col"
      onDrop={handleNewBlockDrop}
      onDragOver={handleDragOver}
    >
      {blocks.length === 0 ? (
        <div
          className="flex-1 flex flex-col items-center justify-center gap-4 p-16 cursor-pointer group min-h-[600px]"
          onClick={(e) => {
            e.stopPropagation();
            addBlock('Hero');
          }}
        >
          <div className="w-14 h-14 bg-[#f1f5f9] rounded-xl flex items-center justify-center border-2 border-dashed border-[#e2e8f0] group-hover:border-[#00E5FF]/40 transition-all">
            <Plus className="w-7 h-7 text-[#94a3b8] group-hover:text-[#00E5FF] transition-all" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-sm font-semibold text-[#94a3b8] group-hover:text-[#64748b] transition-all">
              Canvas vacío
            </h3>
            <p className="text-[13px] text-[#94a3b8]">
              Arrastra una sección o haz clic para comenzar
            </p>
          </div>
        </div>
      ) : (
        <>
          {blocks.map((block, index) => (
            <React.Fragment key={block.id}>
              {/* Drop zone before block */}
              <div
                onDrop={(e) => handleDropZoneDrop(e, index)}
                onDragOver={(e) => handleDropZoneDragOver(e, index)}
                onDragLeave={handleDropZoneDragLeave}
                className={`transition-all duration-200 ${
                  dragOverIndex === index
                    ? 'h-12 bg-[#00E5FF]/10 border-2 border-dashed border-[#00E5FF]/40 mx-6 rounded-lg flex items-center justify-center'
                    : 'h-0'
                }`}
              >
                {dragOverIndex === index && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#00E5FF]/60">
                    Soltar aquí
                  </span>
                )}
              </div>
              <BlockRenderer block={block} index={index} />
            </React.Fragment>
          ))}

          {/* Drop zone after last block */}
          <div
            onDrop={(e) => handleDropZoneDrop(e, blocks.length)}
            onDragOver={(e) => handleDropZoneDragOver(e, blocks.length)}
            onDragLeave={handleDropZoneDragLeave}
            className={`transition-all duration-200 ${
              dragOverIndex === blocks.length
                ? 'h-12 bg-[#00E5FF]/10 border-2 border-dashed border-[#00E5FF]/40 mx-6 rounded-lg flex items-center justify-center'
                : 'h-0'
            }`}
          >
            {dragOverIndex === blocks.length && (
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#00E5FF]/60">
                Soltar aquí
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};
