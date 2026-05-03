import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Trash2, Edit3, X, Loader2, Save } from 'lucide-react';
import axios from 'axios';
import { useInstanceStore } from '../store/useInstanceStore';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  enabled: boolean;
}

export const Products = () => {
  const { instances } = useInstanceStore();
  const activeInstance = instances.length > 0 ? instances[0].instanceName : null;
  const token = localStorage.getItem('avri_token');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    imageUrl: '',
    enabled: true
  });

  const fetchProducts = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/product/${activeInstance}`, {
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
  }, [instances]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const payload = {
      ...form,
      price: parseFloat(form.price),
      stock: parseInt(form.stock)
    };

    try {
      if (editingProduct) {
        await axios.put(`${import.meta.env.VITE_API_URL}/product/${editingProduct.id}/${activeInstance}`, payload, {
          headers: { apikey: token }
        });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/product/${activeInstance}`, payload, {
          headers: { apikey: token }
        });
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setForm({ name: '', description: '', price: '', stock: '', imageUrl: '', enabled: true });
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/product/${id}/${activeInstance}`, {
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
      imageUrl: product.imageUrl || '',
      enabled: product.enabled
    });
    setIsModalOpen(true);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Package className="text-primary" size={24} />
            </div>
            Gestión de Productos
          </h1>
          <p className="text-white/40 text-sm mt-1">Crea y administra tu catálogo de productos manual.</p>
        </div>
        <button 
          onClick={() => {
            setEditingProduct(null);
            setForm({ name: '', description: '', price: '', stock: '', imageUrl: '', enabled: true });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      {/* Filters */}
      <div className="theme-overlay-card rounded-2xl p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input 
            type="text" 
            placeholder="Buscar productos..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="theme-input w-full pl-12 pr-4 py-3 rounded-xl text-sm focus:outline-none"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/40 gap-4">
          <Loader2 className="animate-spin" size={40} />
          <p>Cargando catálogo...</p>
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
        <div className="theme-overlay-card rounded-3xl py-20 flex flex-col items-center text-center px-6">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 mb-4">
            <Package size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No hay productos</h3>
          <p className="text-white/40 max-w-sm mb-8">Comienza a construir tu catálogo manual agregando tu primer producto.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10"
          >
            Agregar mi primer producto
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => setIsModalOpen(false)}>
          <div className="theme-overlay-card w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">Nombre del Producto</label>
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
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">Descripción</label>
                  <textarea 
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="theme-input w-full rounded-xl px-4 py-3 text-sm focus:outline-none h-24 resize-none"
                    placeholder="Detalles del producto..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">Precio ($)</label>
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
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">Stock</label>
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
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">URL de la Imagen</label>
                  <input 
                    type="text" 
                    value={form.imageUrl}
                    onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                    className="theme-input w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center gap-3 py-2">
                  <input 
                    type="checkbox" 
                    id="enabled"
                    checked={form.enabled}
                    onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
                    className="w-5 h-5 rounded-lg border-white/10 bg-white/5 text-primary focus:ring-primary/20"
                  />
                  <label htmlFor="enabled" className="text-sm text-white/60 font-medium">Producto habilitado para la venta</label>
                </div>
              </div>
              <div className="pt-6 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-white/40 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl font-bold transition-all shadow-lg shadow-primary/20"
                >
                  <Save size={20} />
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


