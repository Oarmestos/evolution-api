import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Filter, Loader2, Calendar, User, DollarSign, ChevronRight, CheckCircle2, Clock, Truck, XCircle, Package } from 'lucide-react';
import axios from 'axios';
import { useInstanceStore } from '../store/useInstanceStore';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceAtTime: number;
  Product: {
    name: string;
    imageUrl?: string;
  };
}

interface Order {
  id: string;
  remoteJid: string;
  total: number;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'CANCELED';
  createdAt: string;
  items: OrderItem[];
}

const statusConfig = {
  PENDING: { label: 'Pendiente', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock },
  PAID: { label: 'Pagado', color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle2 },
  SHIPPED: { label: 'Enviado', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Truck },
  CANCELED: { label: 'Cancelado', color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle },
};

export const Orders = () => {
  const { activeInstance } = useInstanceStore();
  const token = localStorage.getItem('avri_token');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    if (!token || !activeInstance) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`/order/${activeInstance.instanceName}`, {
        headers: { apikey: token }
      });
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeInstance?.instanceName]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    if (!token || !activeInstance) return;
    try {
      await axios.patch(`/order/status/${orderId}/${activeInstance.instanceName}`, {
        status: newStatus
      }, {
        headers: { apikey: token }
      });
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.remoteJid.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <ShoppingCart className="text-primary" size={24} />
          </div>
          Registro de Pedidos
        </h1>
        <p className="text-white/40 text-sm mt-1">Monitorea y gestiona las ventas realizadas manualmente por chat.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="theme-overlay-card rounded-2xl p-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por cliente o ID..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="theme-input w-full pl-12 pr-4 py-3 rounded-xl text-sm focus:outline-none"
              />
            </div>
            <button className="p-3 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl transition-colors">
              <Filter size={20} />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/40 gap-4 theme-overlay-card rounded-3xl">
              <Loader2 className="animate-spin" size={40} />
              <p>Cargando pedidos...</p>
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="space-y-3">
              {filteredOrders.map(order => {
                const StatusIcon = statusConfig[order.status].icon;
                return (
                  <div 
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`theme-overlay-card rounded-2xl p-5 cursor-pointer transition-all border border-transparent hover:border-primary/20 group ${selectedOrder?.id === order.id ? 'bg-primary/5 border-primary/30 shadow-lg shadow-primary/5' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${statusConfig[order.status].bg} flex items-center justify-center ${statusConfig[order.status].color}`}>
                          <StatusIcon size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-bold">{order.remoteJid.split('@')[0]}</span>
                            <span className="text-[10px] text-white/20 font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-white/40">
                            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(order.createdAt).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1 font-bold text-white/60"><DollarSign size={12} /> {order.total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig[order.status].bg} ${statusConfig[order.status].color}`}>
                          {statusConfig[order.status].label}
                        </span>
                        <ChevronRight size={20} className="text-white/20 group-hover:text-white/40 transition-colors" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="theme-overlay-card rounded-3xl py-20 flex flex-col items-center text-center px-6">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 mb-4">
                <ShoppingCart size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No hay pedidos</h3>
              <p className="text-white/40 max-w-sm">Los pedidos aparecerán aquí cuando registres una venta desde el chat.</p>
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="lg:col-span-1">
          {selectedOrder ? (
            <div className="theme-overlay-card rounded-3xl overflow-hidden sticky top-6 border border-white/5">
              <div className="p-6 bg-white/5 border-b border-white/5">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-bold text-white">Detalle del Pedido</h2>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig[selectedOrder.status].bg} ${statusConfig[selectedOrder.status].color}`}>
                    {statusConfig[selectedOrder.status].label}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <User size={16} className="text-white/20" />
                    <span className="text-white/60">{selectedOrder.remoteJid}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size={16} className="text-white/20" />
                    <span className="text-white/60">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-4">Productos ({selectedOrder.items.length})</h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedOrder.items.map(item => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-12 h-12 rounded-lg bg-black/40 overflow-hidden flex-shrink-0">
                        {item.Product.imageUrl ? (
                          <img src={item.Product.imageUrl} alt={item.Product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/10">
                            <Package size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{item.Product.name}</h4>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-white/40">{item.quantity} x ${item.priceAtTime.toLocaleString()}</span>
                          <span className="text-sm font-bold text-white">${(item.quantity * item.priceAtTime).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/40">Subtotal</span>
                    <span className="text-white/60">${selectedOrder.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">Total</span>
                    <span className="text-xl font-black text-primary">${selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-8 space-y-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-3">Actualizar Estado</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => updateStatus(selectedOrder.id, key)}
                        disabled={selectedOrder.status === key}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          selectedOrder.status === key 
                            ? `${config.bg} ${config.color} border border-transparent` 
                            : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/5'
                        }`}
                      >
                        <config.icon size={14} />
                        {config.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="theme-overlay-card rounded-3xl p-8 text-center border border-dashed border-white/10 h-[300px] flex flex-col items-center justify-center">
              <p className="text-white/20 text-sm italic">Selecciona un pedido para ver los detalles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
