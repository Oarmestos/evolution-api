import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Trash2, Edit3, X, Loader2, Save, Upload, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import { useInstanceStore } from '../store/useInstanceStore';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  sku?: string;
  enabled: boolean;
}

export const Products = () => {
  const { activeInstance } = useInstanceStore();
  const token = localStorage.getItem('avri_token');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    sku: '',
    imageUrl: '',
    enabled: true
  });

  const [isUploading, setIsUploading] = useState(false);

  const fetchProducts = async () => {
    if (!token || !activeInstance) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`/product/${activeInstance.instanceName}`, {
        headers: { apikey: token }
      });
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [activeInstance?.instanceName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const payload = {
      ...form,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      sku: form.sku
    };

    try {
      if (editingProduct) {
        await axios.put(`/product/${editingProduct.id}/${activeInstance.instanceName}`, payload, {
          headers: { apikey: token }
        });
      } else {
        await axios.post(`/product/${activeInstance.instanceName}`, payload, {
          headers: { apikey: token }
        });
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setForm({ name: '', description: '', price: '', stock: '', sku: '', imageUrl: '', enabled: true });
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !activeInstance || !confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
        await axios.delete(`/product/${id}/${activeInstance.instanceName}`, {
        headers: { apikey: token }
      });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      sku: product.sku || '',
      imageUrl: product.imageUrl || '',
      enabled: product.enabled
    });
    setIsModalOpen(true);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-2">Gestión de Productos</h1>
          <p className="theme-muted text-sm font-medium">Crea y administra tu catálogo de productos manual</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="theme-input pl-11 pr-4 py-3 rounded-2xl w-64 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <button
            onClick={() => {
              setEditingProduct(null);
              setForm({ name: '', description: '', price: '', stock: '', imageUrl: '', enabled: true });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-primary text-dark font-black px-6 py-3 rounded-2xl hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 uppercase text-xs tracking-widest"
          >
            <Plus size={18} /> Nuevo Producto
          </button>
        </div>
      </div>


      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Cargando catálogo...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="theme-overlay-card rounded-3xl overflow-hidden group hover:scale-[1.02] transition-all duration-300 border border-white/5">
              <div className="aspect-video relative overflow-hidden bg-black/40">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/10">
                    <Package size={48} />
                  </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => openEditModal(product)}
                    className="p-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white/20 transition-colors"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(product.id)}
                    className="p-2 bg-red-500/20 backdrop-blur-md rounded-lg text-red-500 hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {!product.enabled && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="px-4 py-1 bg-white/10 rounded-full text-xs font-bold text-white tracking-widest uppercase">Inactivo</span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-white text-lg">{product.name}</h3>
                  <span className="text-primary font-bold text-lg">${product.price.toLocaleString()}</span>
                </div>
                <p className="text-white/40 text-sm line-clamp-2 mb-4 h-10">{product.description || 'Sin descripción'}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.sku && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">SKU: {product.sku}</span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-xs text-white/40 font-medium">Stock: {product.stock} unidades</span>
                  </div>
                  {product.stock <= 5 && product.stock > 0 && (
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase">Bajo Stock</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="theme-surface rounded-3xl py-24 flex flex-col items-center text-center px-6 border border-white/5">
          <div className="w-20 h-20 bg-primary/10 rounded-[24px] flex items-center justify-center text-primary mb-6 shadow-lg shadow-primary/5">
            <Package size={40} />
          </div>
          <h3 className="text-2xl font-black text-white tracking-tight uppercase mb-2">No hay productos</h3>
          <p className="theme-muted text-sm max-w-sm mb-10">Comienza a construir tu catálogo manual agregando tu primer producto.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/10 font-black uppercase text-xs tracking-widest"
          >
            Agregar mi primer producto
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => setIsModalOpen(false)}>
          <div className="theme-overlay-card w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
              <h2 className="text-xl font-bold theme-text">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-theme-muted hover:theme-text transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 scrollbar-hide">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Columna Izquierda: Multimedia */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-theme-muted mb-3">Imagen del Producto</label>
                    <div className="space-y-3">
                      {/* Vista previa compacta */}
                      <div className="theme-input rounded-2xl h-48 flex items-center justify-center relative overflow-hidden bg-black/20 border border-white/5">
                        {form.imageUrl ? (
                          <>
                            <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            <button 
                              type="button"
                              onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                              className="absolute top-3 right-3 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-white shadow-xl hover:scale-110 transition-all z-20 backdrop-blur-sm"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center text-white/5">
                            <ImageIcon size={48} />
                            <span className="text-[10px] font-bold uppercase mt-3 tracking-[0.2em]">Sin imagen</span>
                          </div>
                        )}
                        
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                            <Loader2 className="animate-spin text-primary mb-2" size={24} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Subiendo...</span>
                          </div>
                        )}
                      </div>

                      {/* Botón de carga sutil */}
                      <div className="mt-4">
                        <label className="relative flex items-center gap-2 text-primary hover:text-primary-hover transition-colors cursor-pointer group w-fit">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file || !activeInstance || !token) return;
                              try {
                                setIsUploading(true);
                                const formData = new FormData();
                                formData.append('file', file);
                                const { data } = await axios.post(`/product/upload/${activeInstance.instanceName}`, formData, {
                                  headers: { apikey: token, 'Content-Type': 'multipart/form-data' }
                                });
                                setForm(f => ({ ...f, imageUrl: data.imageUrl }));
                              } catch (error) {
                                console.error('Error uploading image:', error);
                              } finally {
                                setIsUploading(false);
                              }
                            }}
                            className="hidden"
                            disabled={isUploading}
                          />
                          <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <Upload size={14} />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-widest">Cargar imagen local</span>
                        </label>
                      </div>

                      <div className="relative py-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/5"></div>
                        </div>
                        <div className="relative flex justify-center text-[9px] uppercase font-black tracking-[0.2em]">
                          <span className="bg-theme-modal px-3 text-theme-muted">O URL EXTERNA</span>
                        </div>
                      </div>

                      <input 
                        type="text" 
                        value={form.imageUrl}
                        onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                        className="theme-input w-full rounded-xl px-4 py-3 text-[12px] focus:outline-none"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Información */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-theme-muted mb-2">Nombre del Producto</label>
                    <input 
                      type="text" 
                      required
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="theme-input w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                      placeholder="Ej. Hamburguesa Especial"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-theme-muted mb-2">SKU / Referencia</label>
                    <input 
                      type="text" 
                      value={form.sku}
                      onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                      className="theme-input w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                      placeholder="Ej. PROD-001"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-theme-muted mb-2">Precio ($)</label>
                      <input 
                        type="number" 
                        required
                        value={form.price}
                        onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                        className="theme-input w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-theme-muted mb-2">Stock</label>
                      <input 
                        type="number" 
                        required
                        value={form.stock}
                        onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                        className="theme-input w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-theme-muted mb-2">Descripción</label>
                    <textarea 
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="theme-input w-full rounded-xl px-4 py-3 text-sm focus:outline-none h-32 resize-none"
                      placeholder="Detalles del producto..."
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <input 
                      type="checkbox" 
                      id="enabled"
                      checked={form.enabled}
                      onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
                      className="w-5 h-5 rounded-lg border-white/10 bg-white/5 text-primary focus:ring-primary/20"
                    />
                    <label htmlFor="enabled" className="text-sm text-theme-muted font-medium cursor-pointer">Producto habilitado para la venta</label>
                  </div>
                  
                    <div className="pt-6 flex gap-3">
                      <button 
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 px-6 py-4 rounded-2xl font-bold text-theme-muted hover:theme-text hover:bg-white/5 transition-all uppercase text-[10px] tracking-widest border border-transparent hover:border-white/5"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        style={{ backgroundColor: '#00f2ff', color: '#0a0a0f' }}
                        className="flex-[2] py-4 rounded-full font-black shadow-lg hover:scale-[1.05] transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest"
                      >
                        <Save size={18} style={{ color: '#0a0a0f' }} />
                        {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                      </button>
                    </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
