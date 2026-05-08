import React from 'react';
import { X, ChevronRight, Truck, ShieldCheck, Minus, Plus, Package, ShoppingCart } from 'lucide-react';
import { cn } from '../../utils/cn';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  description: string | null;
  category?: string;
}

interface ProductDetailViewProps {
  product: Product;
  onClose: () => void;
  onToggleSelect: (id: string) => void;
  isSelected: boolean;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  onClose,
  onToggleSelect,
  isSelected,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full animate-in slide-in-from-right duration-500 bg-white dark:bg-[#0f1115] overflow-hidden">
      {/* Navegación Superior - Altura Reducida */}
      <div className="px-8 py-3 border-b border-black/5 dark:border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-[9px] font-bold opacity-30 uppercase tracking-[0.2em]">
          <span>Catálogo</span>
          {product.category && (
            <>
              <ChevronRight size={10} />
              <span>{product.category}</span>
            </>
          )}
          <ChevronRight size={10} />
          <span className="text-primary truncate max-w-[150px]">{product.name}</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-hidden p-8 flex items-center justify-center">
        <div className="max-w-5xl w-full flex flex-col lg:flex-row gap-10 items-center">
          
          {/* Columna de Imagen - Tamaño Optimizado */}
          <div className="w-full lg:w-[340px] shrink-0">
            <div className="aspect-[4/5] rounded-[28px] overflow-hidden bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/10 shadow-sm">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-10">
                  <Package size={60} />
                </div>
              )}
            </div>
          </div>

          {/* Columna de Información - Altura Compacta */}
          <div className="flex-1 space-y-5 w-full max-w-md">
            <div className="space-y-2">
              {product.category && (
                <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">{product.category}</span>
              )}
              <h1 className="text-2xl font-bold theme-text uppercase tracking-tight leading-none">{product.name}</h1>
              <p className="theme-muted text-xs leading-relaxed max-w-lg font-medium opacity-70 line-clamp-3">
                {product.description || 'Este producto de alta calidad está disponible para entrega inmediata. Contáctanos para más detalles sobre sus especificaciones técnicas.'}
              </p>
            </div>

            {/* Precio */}
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold theme-text tracking-tighter">${product.price.toLocaleString('es-CO')}</span>
              <span className="text-[9px] font-bold opacity-30 uppercase tracking-wider">IVA Incluido</span>
            </div>

            {/* Acciones Compactas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                <div className="flex items-center gap-4">
                  <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest">Cant.</span>
                  <div className="flex items-center gap-3">
                    <button className="w-7 h-7 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-all border border-black/5 dark:border-white/5"><Minus size={12}/></button>
                    <span className="text-base font-bold min-w-[15px] text-center">1</span>
                    <button className="w-7 h-7 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-all border border-black/5 dark:border-white/5"><Plus size={12}/></button>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold theme-text opacity-80">${product.price.toLocaleString('es-CO')}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => onToggleSelect(product.id)}
                  className={cn(
                    "w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.25em] transition-all flex items-center justify-center gap-2",
                    isSelected 
                      ? "bg-red-500 !text-white shadow-lg shadow-red-500/20" 
                      : "bg-[#111] !text-white hover:bg-black shadow-xl shadow-black/10"
                  )}
                >
                  <ShoppingCart size={14} className="!text-white/90" />
                  {isSelected ? 'ELIMINAR' : 'AÑADIR A LA CESTA'}
                </button>
                
                <button 
                  onClick={() => { if(!isSelected) onToggleSelect(product.id); onClose(); }}
                  className="w-full py-3 border border-black/10 dark:border-white/10 rounded-xl font-bold text-[9px] uppercase tracking-[0.2em] theme-muted hover:theme-text hover:bg-black/5 transition-all text-center"
                >
                  Confirmar y Volver
                </button>
              </div>
            </div>

            {/* Sellos de Confianza Ultra-Sutiles */}
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2 opacity-60">
                <Truck size={14} className="text-primary" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Envío Gratis</span>
              </div>
              <div className="flex items-center gap-2 opacity-60">
                <ShieldCheck size={14} className="text-primary" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Calidad Certificada</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
