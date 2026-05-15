import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Search, Loader2, Upload, Filter } from 'lucide-react';
import axios from 'axios';
import { useInstanceStore } from '../store/useInstanceStore';
import { Product, StockFilter, isStockFilter } from '../types/product.types';
import { ProductTable } from '../components/Products/ProductTable';
import { ProductFormModal } from '../components/Products/ProductFormModal';
import { ImportModal } from '../components/Products/ImportModal';
import { DeleteConfirmationModal } from '../components/Products/DeleteConfirmationModal';

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
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [bulkAction, setBulkAction] = useState('');

  const fetchProducts = useCallback(async () => {
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
  }, [activeInstance, token]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const downloadTemplate = () => {
    const headers = ['nombre', 'sku', 'precio', 'stock', 'categoria', 'descripcion', 'url_imagen'];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\nCamara 4K,CAM-001,599,25,Electronica,Grabación en 4K,https://link-imagen.com";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_avri_productos.csv");
    document.body.appendChild(link);
    link.click();
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

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
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
    let valA: string | number | undefined = a[sortBy];
    let valB: string | number | undefined = b[sortBy];
    
    if (sortBy === 'createdAt') {
      valA = new Date(a.createdAt || 0).getTime();
      valB = new Date(b.createdAt || 0).getTime();
    }

    valA = valA ?? '';
    valB = valB ?? '';

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

          <select 
            value={stockFilter}
            onChange={e => {
              if (isStockFilter(e.target.value)) {
                setStockFilter(e.target.value);
              }
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
          <ProductTable 
            products={paginatedProducts}
            selectedProducts={selectedProducts}
            toggleSelectAll={toggleSelectAll}
            toggleSelectProduct={toggleSelectProduct}
            openEditModal={openEditModal}
            setProductToDelete={setProductToDelete}
            sortBy={sortBy}
            sortOrder={sortOrder}
            toggleSort={toggleSort}
          />

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
          <h3 className="text-3xl font-black theme-text tracking-tight uppercase mb-3">No se encontraron productos</h3>
          <p className="theme-muted text-sm max-w-sm mb-12">Prueba con otro término de búsqueda o categoría.</p>
        </div>
      )}

      {/* Modals */}
      <ProductFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingProduct={editingProduct}
        form={form}
        setForm={setForm}
        handleSubmit={handleSubmit}
        isUploading={isUploading}
        handleFileUpload={handleFileUpload}
      />

      <ImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        importing={importing}
        importResult={importResult}
        setImportResult={setImportResult}
        handleImport={handleImport}
        downloadTemplate={downloadTemplate}
      />

      <DeleteConfirmationModal 
        product={productToDelete}
        onCancel={() => setProductToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
