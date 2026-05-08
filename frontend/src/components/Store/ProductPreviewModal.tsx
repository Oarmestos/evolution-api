import React, { useState } from 'react';
import { X, ShoppingCart, Package, Minus, Plus, Truck, ShieldCheck, ChevronRight } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  stock: number;
}

interface ProductPreviewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  theme: {
    primaryColor: string;
    buttonColor: string;
    borderRadius: number;
    template: string;
  };
}

export const ProductPreviewModal: React.FC<ProductPreviewModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  theme,
}) => {
  const [quantity, setQuantity] = useState(1);
  if (!isOpen || !product) return null;



  const decodeText = (text: string | null) => {
    if (!text) return '';
    try {
      return decodeURIComponent(escape(text));
    } catch {
      return text;
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose} />
      
      <div 
        className="relative w-full max-w-5xl bg-white dark:bg-[#ffffff] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-500 flex flex-col text-gray-900"
        style={{ borderRadius: `${theme.borderRadius * 3}px` }}
      >
        {/* Header / Breadcrumbs */}
        <div className="px-10 py-6 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-30">
            <span>Catálogo</span>
            <ChevronRight size={10} />
            <span style={{ color: theme.primaryColor }}>{decodeText(product.name)}</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row p-10 gap-12">
          {/* Product Image */}
          <div className="w-full md:w-[45%]">
            <div 
              className="aspect-square relative overflow-hidden bg-[#000000] shadow-2xl"
              style={{ borderRadius: `${theme.borderRadius * 2.5}px` }}
            >
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={decodeText(product.name)} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
                  <Package size={100} />
                  <span className="text-xl font-black mt-4">{decodeText(product.name)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="w-full md:w-[55%] space-y-8 flex flex-col justify-center">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none text-[#1a1c23]">
                {decodeText(product.name)}
              </h2>
              <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-md">
                {decodeText(product.description) || 'Muestra - Boutique de Ropa y Accesorios con los mejores acabados y calidad superior.'}
              </p>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black tracking-tighter">
                ${(product.price * quantity).toLocaleString()}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-30">IVA Incluido</span>
            </div>

            {/* Quantity Selector */}
            <div className="bg-[#f8f9fa] rounded-2xl p-4 flex items-center justify-between border border-gray-100">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-30 ml-2">Cant.</span>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-white transition-all active:scale-90"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-black text-lg">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-white transition-all active:scale-90"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="text-lg font-black mr-2">${(product.price * quantity).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => {
                  for(let i=0; i<quantity; i++) onAddToCart(product);
                  onClose();
                }}
                className="w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] bg-[#111827]"
                style={{ color: '#ffffff' }}
              >
                <ShoppingCart size={18} />
                <span>Añadir a la cesta</span>
              </button>
              
              <button 
                onClick={onClose}
                className="w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] border border-gray-200 hover:bg-gray-50 transition-all text-gray-500"
              >
                Confirmar y Volver
              </button>
            </div>

          </div>
        </div>

        {/* Footer Icons Centered */}
        <div className="flex items-center justify-center gap-12 pb-8 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest opacity-40">
            <Truck size={14} className="text-cyan-500" />
            <span>Envío Gratis</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest opacity-40">
            <ShieldCheck size={14} className="text-cyan-500" />
            <span>Calidad Certificada</span>
          </div>
        </div>
      </div>
    </div>
  );
};
