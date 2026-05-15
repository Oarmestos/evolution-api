import React from 'react';
import { Package, Trash2, Edit3 } from 'lucide-react';
import type { Product } from '../../types/product.types';

interface ProductTableProps {
  products: Product[];
  selectedProducts: string[];
  toggleSelectAll: () => void;
  toggleSelectProduct: (id: string) => void;
  openEditModal: (product: Product) => void;
  setProductToDelete: (product: Product) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  toggleSort: (field: any) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  selectedProducts,
  toggleSelectAll,
  toggleSelectProduct,
  openEditModal,
  setProductToDelete,
  sortBy,
  sortOrder,
  toggleSort,
}) => {
  return (
    <div className="theme-overlay-card rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-6 py-6 w-10">
                <input 
                  type="checkbox" 
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/20 cursor-pointer"
                />
              </th>
              <th className="px-6 py-6 text-[10px] font-black theme-muted uppercase tracking-[0.2em]">Foto</th>
              <th 
                className="px-6 py-6 text-[10px] font-black theme-muted uppercase tracking-[0.2em] cursor-pointer hover:text-primary transition-colors"
                onClick={() => toggleSort('name')}
              >
                Nombre {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-6 text-[10px] font-black theme-muted uppercase tracking-[0.2em]">SKU</th>
              <th className="px-6 py-6 text-[10px] font-black theme-muted uppercase tracking-[0.2em]">Categoría</th>
              <th 
                className="px-6 py-6 text-[10px] font-black theme-muted uppercase tracking-[0.2em] cursor-pointer hover:text-primary transition-colors"
                onClick={() => toggleSort('price')}
              >
                Precio {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-6 py-6 text-[10px] font-black theme-muted uppercase tracking-[0.2em] cursor-pointer hover:text-primary transition-colors"
                onClick={() => toggleSort('stock')}
              >
                Stock {sortBy === 'stock' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-6 text-[10px] font-black theme-muted uppercase tracking-[0.2em]">Fecha</th>
              <th className="px-6 py-6 text-[10px] font-black theme-muted uppercase tracking-[0.2em] text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {products.map(product => (
              <tr key={product.id} className={`group hover:bg-white/[0.03] transition-all duration-300 ${selectedProducts.includes(product.id) ? 'bg-primary/5' : ''}`}>
                <td className="px-6 py-5">
                  <input 
                    type="checkbox" 
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => toggleSelectProduct(product.id)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary/20 cursor-pointer"
                  />
                </td>
                <td className="px-6 py-5">
                  <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center group-hover:border-primary/30 transition-colors shadow-lg shadow-black/20">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <Package size={24} className="theme-muted opacity-20" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="theme-text font-bold text-sm group-hover:text-primary transition-colors leading-tight">{product.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      {product.enabled ? (
                        <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Visible</span>
                      ) : (
                        <span className="text-[8px] font-black text-red-500/50 uppercase tracking-widest">Oculto</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="theme-muted text-[10px] font-black uppercase tracking-widest">{product.sku || '—'}</span>
                </td>
                <td className="px-6 py-5">
                  <span className="text-[10px] font-black text-primary/80 uppercase tracking-widest bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">
                    {product.category || 'Sin categoría'}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <span className="theme-text font-black text-sm">
                    ${product.price.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1">
                    {product.stock > 0 ? (
                      <span className={`text-[10px] font-black tracking-widest uppercase ${product.stock <= 5 ? 'text-amber-500' : 'text-green-500'}`}>
                        {product.stock <= 5 ? 'Bajo stock' : 'En stock'} ({product.stock})
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Agotado</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="theme-text font-bold text-[10px] uppercase tracking-widest">Publicado</span>
                    <span className="theme-muted text-[9px] mt-0.5 uppercase tracking-widest">
                      {product.createdAt
                        ? new Date(product.createdAt).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          })
                        : 'Sin fecha'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button 
                      onClick={() => openEditModal(product)}
                      className="p-3 bg-white/5 hover:bg-primary hover:text-dark theme-text rounded-xl transition-all border border-white/5"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => setProductToDelete(product)}
                      className="p-3 bg-white/5 hover:bg-red-500 hover:text-white theme-text rounded-xl transition-all border border-white/5"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
