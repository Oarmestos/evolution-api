import React, { useState, useEffect } from 'react';
import { X, Search, Package, Send, ShoppingBag } from 'lucide-react';
import axios from 'axios';
import { cn } from '../../utils/cn';
import { useThemeStore } from '../../store/useThemeStore';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  description: string | null;
}

interface ProductSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (productId: string) => void;
  instanceName: string;
}

export const ProductSelectorModal: React.FC<ProductSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  instanceName,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
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

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div 
        className={cn(
          "relative z-10 w-full max-w-2xl h-[600px] flex flex-col theme-surface border theme-border-strong rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300",
          resolvedTheme === 'dark' ? "bg-[#16171d]" : "bg-white"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight theme-text">Seleccionar Producto</h3>
              <p className="text-[10px] theme-muted font-bold uppercase tracking-widest">Catálogo de {instanceName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 pb-0">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm theme-text focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest">Cargando catálogo...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.map((product) => (
                <div 
                  key={product.id}
                  className="group theme-surface-alt border border-white/5 rounded-2xl p-4 hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden"
                  onClick={() => onSelect(product.id)}
                >
                  <div className="aspect-square rounded-xl bg-white/5 mb-4 overflow-hidden relative">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-10">
                        <ShoppingBag className="w-10 h-10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center">
                      <div className="bg-primary text-black p-2 rounded-full opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all shadow-xl">
                        <Send className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <h4 className="font-bold text-sm theme-text truncate">{product.name}</h4>
                  <p className="text-primary font-black text-xs mt-1">
                    ${product.price.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4 opacity-30 text-center">
              <Package className="w-16 h-16" />
              <p className="text-sm font-bold">No se encontraron productos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
