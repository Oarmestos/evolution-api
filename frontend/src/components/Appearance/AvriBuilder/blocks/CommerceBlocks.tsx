import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAvriBuilderStore } from '../../../../store/useAvriBuilderStore';
import { useInstanceStore } from '../../../../store/useInstanceStore';
import { cn } from '../../../../utils/cn';
import { getBlockStyles } from '../utils/getBlockStyles';
import type { LibraryProps } from '../BlockLibrary';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  description: string | null;
  category?: string;
  enabled: boolean;
}

export const ProductGrid: React.FC<LibraryProps> = ({ block, Renderer, readOnly }) => {
  const { updateBlockProps } = useAvriBuilderStore();
  const { activeInstance } = useInstanceStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      const token = localStorage.getItem('avri_token');
      if (!token || !activeInstance?.instanceName) {
        setProducts([]);
        return;
      }
      try {
        setLoading(true);
        const { data } = await axios.get(`/product/${activeInstance.instanceName}`, {
          headers: { apikey: token }
        });
        const activeProducts = (Array.isArray(data) ? data : []).filter((p: any) => p.enabled);
        setProducts(activeProducts);
      } catch (error) {
        console.error('Error fetching products in builder:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [activeInstance]);

  if (block.children && block.children.length > 0) {
    return (
      <div style={getBlockStyles(block)} className="w-full">
        {block.children.map((child: any) => <Renderer key={child.id} block={child} />)}
      </div>
    );
  }

  const hasProducts = products.length > 0;
  const itemsToRender = hasProducts
    ? products
    : [
        {
          id: 'placeholder-1',
          name: 'Reloj de Lujo - Edición Avri',
          price: 199,
          imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80&id=1',
          category: 'Categoría'
        },
        {
          id: 'placeholder-2',
          name: 'Reloj de Lujo - Edición Avri',
          price: 199,
          imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80&id=2',
          category: 'Categoría'
        },
        {
          id: 'placeholder-3',
          name: 'Reloj de Lujo - Edición Avri',
          price: 199,
          imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80&id=3',
          category: 'Categoría'
        }
      ];

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
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className={`grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-${block.props.columns || 3}`} style={{ gap: block.props.gap !== undefined ? `${block.props.gap}px` : '24px' }}>
          {itemsToRender.map((item) => (
            <div key={item.id} className="group cursor-pointer">
              <div className="aspect-[4/5] bg-gray-50 rounded-2xl overflow-hidden relative border border-gray-100 mb-4 transition-all group-hover:border-[#00E5FF]/20 group-hover:shadow-xl">
                <img 
                  src={item.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80'} 
                  alt={item.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                {!block.props.hidePrice && (
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-[#001946] shadow-sm uppercase tracking-wider">
                    ${typeof item.price === 'number' ? item.price.toLocaleString('es-ES', { minimumFractionDigits: 2 }) : item.price}
                  </div>
                )}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                {item.category || 'General'}
              </p>
              <h4 className="text-sm font-black text-[#001946] group-hover:text-[#00E5FF] transition-colors">
                {item.name}
              </h4>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

