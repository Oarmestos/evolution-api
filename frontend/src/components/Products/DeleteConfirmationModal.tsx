import React from 'react';
import { Trash2 } from 'lucide-react';
import { Product } from '../../types/product.types';

interface DeleteConfirmationModalProps {
  product: Product | null;
  onCancel: () => void;
  onConfirm: (id: string) => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  product,
  onCancel,
  onConfirm,
}) => {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="theme-overlay-card w-full max-w-sm rounded-[32px] overflow-hidden shadow-[0_0_100px_rgba(239,68,68,0.15)] border border-red-500/10 p-10 text-center" onClick={e => e.stopPropagation()}>
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-8 shadow-inner">
          <Trash2 size={40} />
        </div>
        <h2 className="text-2xl font-black theme-text uppercase tracking-tight mb-3">¿Eliminar Producto?</h2>
        <p className="theme-muted text-sm mb-10 leading-relaxed">Esta acción es permanente. Se eliminará <span className="theme-text font-bold">"{product.name}"</span> de tu catálogo.</p>
        <div className="flex gap-4">
          <button 
            onClick={onCancel}
            className="flex-1 py-5 bg-white/5 hover:bg-white/10 theme-text font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all border border-white/5"
          >
            Cancelar
          </button>
          <button 
            onClick={() => onConfirm(product.id)}
            className="flex-1 py-5 bg-red-500 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
          >
            Sí, Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};
