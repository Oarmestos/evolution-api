import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Trash2, Edit3, X, Loader2, Save, Upload, Image as ImageIcon, Filter } from 'lucide-react';
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
  category?: string;
  enabled: boolean;
  createdAt?: string;
}

export const Products = () => {
  const { activeInstance } = useInstanceStore();
  const token = localStorage.getItem('avri_token');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Advanced Features State
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    sku: '',
    category: '',
    imageUrl: '',
    enabled: true
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; updated: number; errors: number; details: string[] } | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [stockFilter, setStockFilter] = useState<'all' | 'instock' | 'outofstock' | 'lowstock'>('all');
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [activeInstance]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !activeInstance) return;

    const productData = {
      ...form,
      price: parseFloat(form.price),
      stock: parseInt(form.stock)
    };

    try {
      if (editingProduct) {
        await axios.put(`/product/${editingProduct.id}/${activeInstance.instanceName}`, productData, {
          headers: { apikey: token }
        });
      } else {
        await axios.post(`/product/${activeInstance.instanceName}`, productData, {
          headers: { apikey: token }
        });
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setForm({ name: '', description: '', price: '', stock: '', sku: '', category: '', imageUrl: '', enabled: true });
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !activeInstance) return;
    try {
        await axios.delete(`/product/${id}/${activeInstance.instanceName}`, {
        headers: { apikey: token }
      });
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedProducts.length === 0 || !token || !activeInstance) return;

    try {
      if (bulkAction === 'delete') {
        if (!confirm(`¿Estás seguro de eliminar ${selectedProducts.length} productos?`)) return;
        await Promise.all(selectedProducts.map(id => 
          axios.delete(`/product/${id}/${activeInstance.instanceName}`, { headers: { apikey: token } })
        ));
      } else if (bulkAction === 'enable' || bulkAction === 'disable') {
        await Promise.all(selectedProducts.map(id => 
          axios.put(`/product/${id}/${activeInstance.instanceName}`, { enabled: bulkAction === 'enable' }, { headers: { apikey: token } })
        ));
      }
      setSelectedProducts([]);
      setBulkAction('');
      fetchProducts();
    } catch (error) {
      console.error('Error executing bulk action:', error);
    }
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      sku: product.sku || '',
      category: product.category || '',
      imageUrl: product.imageUrl || '',
      enabled: product.enabled
    });
    setIsModalOpen(true);
  };

  // Logic for Filtering, Sorting and Pagination
  const rawCategories = Array.from(new Set(products.map(p => p.category || 'General')));
  const categories = ['all', ...rawCategories.sort()];
  
  const filteredProducts = products
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(p => {
      if (selectedCategory === 'all') return true;
      const prodCat = p.category || 'General';
      return prodCat === selectedCategory;
    })
    .filter(p => {
      if (stockFilter === 'all') return true;
      if (stockFilter === 'instock') return p.stock > 0;
      if (stockFilter === 'outofstock') return p.stock <= 0;
      if (stockFilter === 'lowstock') return p.stock > 0 && p.stock <= 5;
      return true;
    });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let valA: any = a[sortBy];
    let valB: any = b[sortBy];
    
    if (sortBy === 'createdAt') {
      valA = new Date(a.createdAt || 0).getTime();
      valB = new Date(b.createdAt || 0).getTime();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black theme-text tracking-tight uppercase mb-1">Gestión de Productos</h1>
          <p className="theme-muted text-[11px] font-black uppercase tracking-widest">Catálogo Profesional • {products.length} Items</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setImportResult(null);
              setIsImportModalOpen(true);
            }}
            className="flex items-center gap-2 bg-white/5 theme-text font-black px-6 py-3 rounded-2xl hover:bg-white/10 transition-all border border-white/5 uppercase text-[10px] tracking-widest"
          >
            <Upload size={16} className="text-primary" /> Importar
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setForm({ name: '', description: '', price: '', stock: '', sku: '', category: '', imageUrl: '', enabled: true });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-primary text-dark font-black px-6 py-3 rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 uppercase text-[10px] tracking-widest"
          >
            <Plus size={16} /> Nuevo Producto
          </button>
        </div>
      </div>

      {/* WordPress Style Filter Toolbar */}
      <div className="theme-overlay-card p-4 rounded-[24px] border border-white/5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Bulk Actions */}
          <div className="flex items-center gap-2">
            <select 
              value={bulkAction}
              onChange={e => setBulkAction(e.target.value)}
              className="theme-input px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest focus:outline-none min-w-[180px]"
            >
              <option value="">Acciones en lote</option>
              <option value="enable">Habilitar seleccionados</option>
              <option value="disable">Deshabilitar seleccionados</option>
              <option value="delete">Eliminar seleccionados</option>
            </select>
            <button 
              onClick={handleBulkAction}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 theme-text font-black uppercase text-[10px] tracking-widest rounded-xl border border-white/10 transition-all active:scale-95"
            >
              Aplicar
            </button>
          </div>

          <div className="h-8 w-px bg-white/5 mx-2" />

          {/* Category Filter */}
          <select 
            value={selectedCategory}
            onChange={e => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="theme-input px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest focus:outline-none min-w-[180px]"
          >
            <option value="all">Todas las categorías</option>
            {categories.filter(c => c !== 'all').map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Stock Filter */}
          <select 
            value={stockFilter}
            onChange={e => {
              setStockFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="theme-input px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest focus:outline-none min-w-[180px]"
          >
            <option value="all">Estado de stock</option>
            <option value="instock">En stock</option>
            <option value="lowstock">Bajo stock (≤5)</option>
            <option value="outofstock">Agotado</option>
          </select>

          <button className="p-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-all shadow-lg shadow-primary/5">
            <Filter size={16} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 theme-muted" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="theme-input pl-11 pr-4 py-2.5 rounded-xl w-48 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>
          <span className="theme-muted text-[10px] font-black uppercase tracking-widest">{filteredProducts.length} Items</span>
        </div>
      </div>

      {/* Product Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="theme-muted font-bold uppercase tracking-widest text-[10px]">Cargando inventario...</p>
        </div>
      ) : paginatedProducts.length > 0 ? (
        <div className="space-y-6">
          <div className="theme-overlay-card rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-6 py-6 w-10">
                      <input 
                        type="checkbox" 
                        checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
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
                  {paginatedProducts.map(product => (
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
                            {new Date(product.createdAt || Date.now()).toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' })}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-8 py-6 bg-white/[0.02] rounded-[32px] border border-white/5 shadow-lg">
              <p className="text-[10px] font-black theme-muted uppercase tracking-[0.2em]">
                Mostrando {paginatedProducts.length} de {filteredProducts.length} productos
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-5 py-2.5 rounded-xl bg-white/5 theme-text text-[10px] font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all border border-white/5"
                >
                  Anterior
                </button>
                <div className="flex gap-1.5">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all border ${
                        currentPage === i + 1 
                          ? 'bg-primary text-dark border-primary shadow-lg shadow-primary/20' 
                          : 'bg-white/5 theme-text border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-5 py-2.5 rounded-xl bg-white/5 theme-text text-[10px] font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all border border-white/5"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="theme-surface rounded-[40px] py-24 flex flex-col items-center text-center px-6 border border-white/5 shadow-2xl">
          <div className="w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center text-primary mb-8 shadow-2xl shadow-primary/10 border border-primary/20">
            <Package size={48} />
          </div>
          <h3 className="text-3xl font-black theme-text tracking-tight uppercase mb-3">No se encontraron productos</h3>
          <p className="theme-muted text-sm max-w-sm mb-12">Prueba con otro término de búsqueda o categoría.</p>
          <button 
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
            className="px-10 py-4 bg-white/5 hover:bg-white/10 theme-text rounded-2xl transition-all border border-white/10 font-black uppercase text-[10px] tracking-widest shadow-xl"
          >
            Ver todos los productos
          </button>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="theme-overlay-card w-full max-w-sm rounded-[32px] overflow-hidden shadow-[0_0_100px_rgba(239,68,68,0.15)] border border-red-500/10 p-10 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-8 shadow-inner">
              <Trash2 size={40} />
            </div>
            <h2 className="text-2xl font-black theme-text uppercase tracking-tight mb-3">¿Eliminar Producto?</h2>
            <p className="theme-muted text-sm mb-10 leading-relaxed">Esta acción es permanente. Se eliminará <span className="theme-text font-bold">"{productToDelete.name}"</span> de tu catálogo.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-5 bg-white/5 hover:bg-white/10 theme-text font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all border border-white/5"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDelete(productToDelete.id)}
                className="flex-1 py-5 bg-red-500 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => !importing && setIsImportModalOpen(false)}>
          <div className="theme-overlay-card w-full max-w-md rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-black theme-text uppercase tracking-tight">Importar Catálogo</h2>
              <button onClick={() => setIsImportModalOpen(false)} className="theme-muted hover:theme-text transition-colors" disabled={importing}>
                <X size={24} />
              </button>
            </div>

            <div className="p-8">
              {!importResult ? (
                <div className="space-y-6">
                  <p className="theme-muted text-[11px] font-black uppercase tracking-widest text-center leading-relaxed">
                    Sube un archivo <span className="theme-text">Excel</span> o <span className="theme-text">CSV</span>. El sistema actualizará automáticamente por <span className="text-primary font-bold">SKU</span>.
                  </p>

                  <div className="relative group">
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !token || !activeInstance) return;

                        const formData = new FormData();
                        formData.append('file', file);

                        try {
                          setImporting(true);
                          const { data } = await axios.post(`/product/import/${activeInstance.instanceName}`, formData, {
                            headers: { apikey: token }
                          });
                          setImportResult(data);
                          fetchProducts();
                        } catch (error) {
                          console.error('Error importing products:', error);
                          alert('Error al procesar el archivo. Verifique el formato.');
                        } finally {
                          setImporting(false);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                      disabled={importing}
                    />
                    <div className="theme-input rounded-[32px] border-2 border-dashed border-white/10 group-hover:border-primary/50 transition-all p-12 flex flex-col items-center justify-center gap-4 bg-white/[0.01]">
                      {importing ? (
                        <>
                          <Loader2 className="w-10 h-10 text-primary animate-spin" />
                          <p className="text-primary font-black uppercase text-[10px] tracking-[0.2em]">Sincronizando...</p>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                            <Upload size={32} />
                          </div>
                          <div className="text-center">
                            <p className="theme-text font-black uppercase text-[10px] tracking-widest">Soltar archivo aquí</p>
                            <p className="theme-muted text-[9px] font-medium mt-1 uppercase tracking-widest">XLSX, XLS o CSV</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      const headers = ['nombre', 'sku', 'precio', 'stock', 'categoria', 'descripcion', 'url_imagen'];
                      const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\nCamara 4K,CAM-001,599,25,Electronica,Grabación en 4K,https://link-imagen.com";
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", "plantilla_avri_productos.csv");
                      document.body.appendChild(link);
                      link.click();
                    }}
                    className="w-full text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:brightness-125 transition-all text-center"
                  >
                    Descargar Plantilla Actualizada
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="theme-surface p-5 rounded-3xl text-center border border-white/5">
                      <p className="text-green-400 text-3xl font-black">{importResult.success}</p>
                      <p className="theme-muted text-[8px] uppercase font-black tracking-widest mt-1">Nuevos</p>
                    </div>
                    <div className="theme-surface p-5 rounded-3xl text-center border border-white/5">
                      <p className="text-primary text-3xl font-black">{importResult.updated}</p>
                      <p className="theme-muted text-[8px] uppercase font-black tracking-widest mt-1">Actualizados</p>
                    </div>
                    <div className="theme-surface p-5 rounded-3xl text-center border border-white/5">
                      <p className="text-red-400 text-3xl font-black">{importResult.errors}</p>
                      <p className="theme-muted text-[8px] uppercase font-black tracking-widest mt-1">Errores</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setImportResult(null);
                      setIsImportModalOpen(false);
                    }}
                    className="w-full py-5 bg-white/5 hover:bg-white/10 theme-text rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] transition-all border border-white/5 shadow-xl"
                  >
                    Finalizar y Revisar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => setIsModalOpen(false)}>
          <div className="theme-overlay-card w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col border border-white/5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-8 border-b border-white/5 shrink-0 bg-white/[0.01]">
              <h2 className="text-2xl font-black theme-text uppercase tracking-tight">{editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="theme-muted hover:theme-text transition-colors">
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
                            onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
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
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !activeInstance || !token) return;
                          try {
                            setIsUploading(true);
                            const formData = new FormData();
                            formData.append('file', file);
                            const { data } = await axios.post(`/product/upload/${activeInstance.instanceName}`, formData, {
                              headers: { apikey: token }
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
                        onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
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
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
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
                          onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                          className="theme-input w-full rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none"
                          placeholder="PROD-001"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] theme-muted mb-3">Categoría</label>
                        <input 
                          type="text" 
                          value={form.category}
                          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                          className="theme-input w-full rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none"
                          placeholder="Electrónica"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] theme-muted mb-3">Precio ($)</label>
                        <input 
                          type="number" 
                          required
                          value={form.price}
                          onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                          className="theme-input w-full rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none text-primary"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] theme-muted mb-3">Stock Disponible</label>
                        <input 
                          type="number" 
                          required
                          value={form.stock}
                          onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                          className="theme-input w-full rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] theme-muted mb-3">Descripción Detallada</label>
                      <textarea 
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        className="theme-input w-full rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none h-32 resize-none"
                        placeholder="Describe las características principales..."
                      />
                    </div>

                    <div className="flex items-center gap-4 py-4 bg-white/[0.02] px-5 rounded-2xl border border-white/5">
                      <input 
                        type="checkbox" 
                        id="form-enabled"
                        checked={form.enabled}
                        onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
                        className="w-5 h-5 rounded-lg border-white/20 bg-white/5 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                      />
                      <label htmlFor="form-enabled" className="text-[10px] font-black uppercase tracking-widest theme-muted cursor-pointer select-none">Habilitar visibilidad en la tienda</label>
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                      <button 
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 py-5 rounded-3xl font-black theme-muted hover:theme-text hover:bg-white/5 transition-all uppercase text-[10px] tracking-[0.2em] border border-transparent"
                      >
                        Descartar
                      </button>
                      <button 
                        type="submit"
                        className="flex-[2] py-5 bg-primary text-dark rounded-3xl font-black shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-[0.3em]"
                      >
                        <Save size={18} />
                        {editingProduct ? 'Actualizar' : 'Publicar'}
                      </button>
                    </div>
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
