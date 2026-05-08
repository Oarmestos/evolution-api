import React from 'react';
import { Check as CheckIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  description: string | null;
  category?: string;
}

interface CatalogGridItemProps {
  product: Product;
  isSelected: boolean;
  onSelect: (product: Product) => void;
  onToggleSelect: (id: string, e: React.MouseEvent) => void;
}

export const CatalogGridItem: React.FC<CatalogGridItemProps> = ({
  product,
  isSelected,
  onSelect,
  onToggleSelect,
}) => {
  return (
    <div 
      onClick={() => onSelect(product)}
      className="group cursor-pointer flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className={cn(
        "w-full aspect-[3/4] rounded-[24px] overflow-hidden relative mb-4 border-2 transition-all duration-500",
        isSelected 
          ? "border-primary shadow-[0_0_30px_rgba(0,255,255,0.2)]" 
          : "border-transparent group-hover:border-white/10"
      )}>
        <img 
          src={product.imageUrl || ''} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
        />
        <div 
          onClick={(e) => onToggleSelect(product.id, e)}
          className={cn(
            "absolute top-4 right-4 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all backdrop-blur-md z-20",
            isSelected 
              ? "bg-primary border-primary shadow-lg" 
              : "bg-black/40 border-white/20 opacity-0 group-hover:opacity-100"
          )}
        >
          <CheckIcon size={14} className={isSelected ? "text-black font-black" : "text-white"} />
        </div>
      </div>
      <span className="text-[8px] font-black opacity-30 uppercase tracking-[0.3em] mb-1">{product.category || 'General'}</span>
      <h4 className="font-bold text-[11px] theme-text uppercase truncate w-full tracking-tight">{product.name}</h4>
      <span className="text-primary font-black text-xs mt-1 tracking-tighter">
        ${product.price.toLocaleString('es-CO')}
      </span>
    </div>
  );
};
