import React, { useState, useEffect } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import axios from 'axios';
import { cn } from '../../utils/cn';
import { useThemeStore } from '../../store/useThemeStore';
import { ProductDetailView } from './ProductDetailView';
import { CatalogGridItem } from './CatalogGridItem';
import { CatalogFilters } from './CatalogFilters';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  description: string | null;
  category?: string;
}

interface ProductSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (productIds: string[]) => void;
  onSendCatalogLink: () => void;
  instanceName: string;
}

export const ProductSelectorModal: React.FC<ProductSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  onSendCatalogLink,
  instanceName,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!isOpen) return;
      try {
        setLoading(true);
        const token = localStorage.getItem('avri_token');
        const response = await axios.get(`/product/${instanceName}`, {
          headers: { apikey: token },
        });
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [isOpen, instanceName]);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category || 'General'))).sort()];
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || (p.category || 'General') === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <div className={cn(
        "relative z-10 w-full flex flex-col theme-surface border border-white/10 rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300",
        detailProduct ? "max-w-4xl h-[85vh]" : "max-w-6xl h-[90vh]",
        resolvedTheme === 'dark' ? "bg-[#0a0b0d]" : "bg-white"
      )}>
        
        {detailProduct ? (
          <ProductDetailView 
            product={detailProduct}
            onClose={() => setDetailProduct(null)}
            onToggleSelect={(id) => toggleSelect(id)}
            isSelected={selectedIds.has(detailProduct.id)}
          />
        ) : (
          <div className="flex-1 flex flex-col h-full animate-in fade-in duration-500">
            {/* Cabecera */}
            <div className="p-8 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-black theme-text uppercase italic leading-none">Catálogo Profesional</h3>
                  <p className="text-[9px] theme-muted font-black uppercase tracking-[0.3em] mt-2">
                    {instanceName} <span className="w-1 h-1 rounded-full bg-white/20 mx-1" /> {products.length} Productos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={onSendCatalogLink}
                  className="px-6 py-3 bg-primary text-black hover:opacity-90 rounded-xl transition-all font-black uppercase text-[9px] tracking-widest shadow-xl shadow-primary/20"
                >
                  Enviar Link de Tienda
                </button>
                <button onClick={onClose} className="p-3 theme-muted hover:theme-text rounded-full transition-colors"><X size={24} /></button>
              </div>
            </div>

            <CatalogFilters 
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categories={categories}
            />

            <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
              {loading ? (
                <div className="h-full flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                  {filteredProducts.map((product) => (
                    <CatalogGridItem 
                      key={product.id}
                      product={product}
                      isSelected={selectedIds.has(product.id)}
                      onSelect={(p) => setDetailProduct(p)}
                      onToggleSelect={(id, e) => toggleSelect(id, e)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {selectedIds.size > 0 && (
              <div className="p-8 border-t border-black/5 dark:border-white/5 bg-white/[0.02] flex justify-between items-center animate-in slide-in-from-bottom-8 duration-500">
                <div className="flex items-center gap-8">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase opacity-40 tracking-widest">Seleccionados</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black theme-text">{selectedIds.size}</span>
                      <span className="text-primary font-black uppercase text-[10px] italic">Ítems</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedIds(new Set())} className="text-[10px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-colors">Limpiar</button>
                </div>
                <button
                  onClick={() => onSelect(Array.from(selectedIds))}
                  className="px-12 py-5 bg-primary text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:scale-[1.02] transition-all shadow-[0_20px_50px_rgba(0,255,255,0.2)]"
                >
                  Enviar a la Conversación
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
