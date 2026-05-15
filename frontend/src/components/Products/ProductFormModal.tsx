import React from 'react';
import { X, Loader2, Upload, Image as ImageIcon, Package } from 'lucide-react';
import type { Product } from '../../types/product.types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  form: any;
  setForm: (form: any) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isUploading: boolean;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  editingProduct,
  form,
  setForm,
  handleSubmit,
  isUploading,
  handleFileUpload,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
      <div className="theme-overlay-card w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col border border-white/5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-8 border-b border-white/5 shrink-0 bg-white/[0.01]">
          <h2 className="text-2xl font-black theme-text uppercase tracking-tight">{editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}</h2>
          <button onClick={onClose} className="theme-muted hover:theme-text transition-colors">
            <X size={28} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto p-8 scrollbar-hide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Image Section */}
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] theme-muted mb-4">Multimedia</label>
                <div className="theme-input rounded-[32px] aspect-square flex items-center justify-center relative overflow-hidden bg-black/30 border border-white/5 group/img">
                  {form.imageUrl ? (
                    <>
                      <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                      <button 
                        type="button"
                        onClick={() => setForm({ ...form, imageUrl: '' })}
                        className="absolute top-4 right-4 p-2 bg-red-500/80 hover:bg-red-500 rounded-xl text-white shadow-2xl transition-all z-20 backdrop-blur-md opacity-0 group-hover/img:opacity-100"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center theme-muted/10">
                      <ImageIcon size={64} />
                      <span className="text-[10px] font-black uppercase mt-4 tracking-[0.3em]">Vista Previa</span>
                    </div>
                  )}
                  
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                      <Loader2 className="animate-spin text-primary mb-3" size={32} />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Subiendo a Nube...</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <label className="flex items-center justify-center gap-3 w-full py-4 bg-white/5 rounded-2xl border border-white/10 cursor-pointer hover:bg-white/10 transition-all group">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <Upload size={16} className="text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest theme-text">Subir Imagen</span>
                </label>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center theme-muted/20">
                    <ImageIcon size={14} />
                  </div>
                  <input 
                    type="text" 
                    value={form.imageUrl}
                    onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                    className="theme-input w-full rounded-2xl pl-12 pr-4 py-4 text-[11px] font-medium focus:outline-none placeholder:theme-muted/20"
                    placeholder="O pega una URL externa aquí..."
                  />
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] theme-muted mb-3">Nombre del Producto</label>
                  <input 
                    type="text" 
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="theme-input w-full rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none placeholder:theme-muted/10"
                    placeholder="Ej: Auriculares Pro Max"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] theme-muted mb-3">SKU / REF</label>
                    <input 
                      type="text" 
                      value={form.sku}
                      onChange={e => setForm({ ...form, sku: e.target.value })}
                      className="theme-input w-full rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none"
                      placeholder="PROD-001"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] theme-muted mb-3">Categoría</label>
                    <input 
                      type="text" 
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      className="theme-input w-full rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none"
                      placeholder="Electrónica"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] theme-muted mb-3">Precio (COP)</label>
                    <input 
                      type="number" 
                      required
                      value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })}
                      className="theme-input w-full rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] theme-muted mb-3">Stock Disponible</label>
                    <input 
                      type="number" 
                      required
                      value={form.stock}
                      onChange={e => setForm({ ...form, stock: e.target.value })}
                      className="theme-input w-full rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] theme-muted mb-3">Descripción</label>
                  <textarea 
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    className="theme-input w-full rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none resize-none"
                    placeholder="Describe las características principales..."
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <input 
                    type="checkbox" 
                    id="enabled"
                    checked={form.enabled}
                    onChange={e => setForm({ ...form, enabled: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <label htmlFor="enabled" className="text-[10px] font-black uppercase tracking-widest cursor-pointer theme-text">
                    Producto visible en el catálogo de WhatsApp
                  </label>
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-5 bg-white/5 hover:bg-white/10 theme-text font-black uppercase text-[10px] tracking-[0.2em] rounded-3xl transition-all border border-white/5"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-2 py-5 bg-primary text-dark font-black uppercase text-[10px] tracking-[0.2em] rounded-3xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 min-w-[200px]"
                >
                  <Package size={18} />
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
