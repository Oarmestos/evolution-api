import React from 'react';
import { useAvriBuilderStore } from '../../../../store/useAvriBuilderStore';
import { cn } from '../../../../utils/cn';
import { getBlockStyles } from '../utils/getBlockStyles';
import type { LibraryProps } from '../BlockLibrary';

export const ProductGrid: React.FC<LibraryProps> = ({ block, Renderer, readOnly }) => {
  const { updateBlockProps } = useAvriBuilderStore();

  if (block.children && block.children.length > 0) {
    return (
      <div style={getBlockStyles(block)} className="w-full">
        {block.children.map(child => <Renderer key={child.id} block={child} />)}
      </div>
    );
  }

  return (
    <div id="products-grid" style={getBlockStyles(block)} className="space-y-12 px-8 py-6">
      {!block.props.hideHeader && (
        <div className="flex items-end justify-between border-b-2 border-gray-100 pb-6 mb-4">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00E5FF]">Explora</span>
            <h3 
              contentEditable={!readOnly}
              suppressContentEditableWarning
              onBlur={(e) => updateBlockProps(block.id, { title: e.currentTarget.textContent || '' })}
              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              className={cn(
                "text-4xl font-black uppercase tracking-tighter text-[#001946] transition-all leading-none outline-none",
                !readOnly && "cursor-text hover:text-[#00E5FF]"
              )}
            >
              {block.props.title || 'Nuestros Destacados'}
            </h3>
          </div>
          <a 
            href={block.props.viewAllHref || '#'} 
            contentEditable={!readOnly}
            suppressContentEditableWarning
            onBlur={(e) => updateBlockProps(block.id, { viewAllText: e.currentTarget.textContent || '' })}
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
            onClick={(e) => {
              if (readOnly) return;
              e.preventDefault();
              e.stopPropagation();
            }}
            className="text-[10px] font-black text-[#001946] border-b-2 border-[#00E5FF] pb-1 uppercase tracking-widest cursor-text hover:text-[#00E5FF] transition-all outline-none"
          >
            {block.props.viewAllText || 'VER TODO'}
          </a>
        </div>
      )}
      <div className={`grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-${block.props.columns || 3}`} style={{ gap: block.props.gap !== undefined ? `${block.props.gap}px` : '24px' }}>
        {[1, 2, 3].map((id) => (
          <div key={id} className="group cursor-pointer">
            <div className="aspect-[4/5] bg-gray-50 rounded-2xl overflow-hidden relative border border-gray-100 mb-4 transition-all group-hover:border-[#00E5FF]/20 group-hover:shadow-xl">
              <img src={`https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80&id=${id}`} alt="Product" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              {!block.props.hidePrice && (
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-[#001946] shadow-sm uppercase tracking-wider">
                  $199.00
                </div>
              )}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Categoría</p>
            <h4 className="text-sm font-black text-[#001946] group-hover:text-[#00E5FF] transition-colors">Reloj de Lujo - Edición Avri</h4>
          </div>
        ))}
      </div>
    </div>
  );
};
