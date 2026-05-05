import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  ShoppingBag, 
  Image as InstagramIcon, 
  Send, 
  ShoppingCart, 
  ArrowRight,
  Loader2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { cn } from '../utils/cn';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  stock: number;
}

interface Theme {
  template: string;
  storeName: string | null;
  logoUrl: string | null;
  primaryColor: string;
  buttonColor: string;
  bgColor: string;
  fontFamily: string;
  ctaText: string;
  borderRadius: number;
  instagramUrl: string | null;
  tiktokUrl: string | null;
}

interface StoreData {
  theme: Theme;
  products: Product[];
  instanceName: string;
}

export const PublicStore: React.FC = () => {
  const { instanceName } = useParams<{ instanceName: string }>();
  const [data, setData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<Product[]>([]);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/theme/store-api/${instanceName}`);
        setData(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'No pudimos cargar la tienda. Verifica el nombre.');
      } finally {
        setLoading(false);
      }
    };

    if (instanceName) {
      fetchStore();
    }
  }, [instanceName]);

  const addToCart = (product: Product) => {
    setCart([...cart, product]);
  };

  const handleCheckout = () => {
    if (!data) return;
    
    const message = `¡Hola! Me interesa comprar:\n\n${cart.map(p => `- ${p.name} ($${p.price})`).join('\n')}\n\nTotal: $${cart.reduce((sum, p) => sum + p.price, 0)}`;
    const whatsappUrl = `https://wa.me/${data.instanceName}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1016] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-gray-400 font-medium animate-pulse">Preparando tu experiencia...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0f1016] flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Tienda no encontrada</h2>
          <p className="text-gray-400 text-sm leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const { theme, products } = data;

  return (
    <div 
      className="min-h-screen selection:bg-primary selection:text-black"
      style={{ 
        backgroundColor: theme.bgColor,
        fontFamily: theme.fontFamily,
        '--primary': theme.primaryColor,
        '--btn-radius': `${theme.borderRadius}px`,
        '--card-radius': `${theme.borderRadius * 1.5}px`
      } as React.CSSProperties}
    >
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/5 backdrop-blur-xl border border-white/10 rounded-[30px] p-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-primary/20 flex items-center justify-center border border-white/5">
              {theme.logoUrl ? (
                <img src={theme.logoUrl} alt={theme.storeName || ''} className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag className="w-5 h-5 text-primary" />
              )}
            </div>
            <span className="font-black text-white uppercase tracking-tight text-lg">
              {theme.storeName || 'Store'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {theme.instagramUrl && (
              <a 
                href={theme.instagramUrl} 
                target="_blank" 
                rel="noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
            )}
            <button 
              className="relative w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-black shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)] hover:scale-105 transition-all"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-[10px] font-black rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative p-12 rounded-[50px] overflow-hidden bg-[#16171d] border border-white/5 group">
            <div 
              className="absolute top-0 right-0 w-[500px] h-[500px] opacity-20 blur-[120px] transition-all duration-1000 group-hover:opacity-30"
              style={{ backgroundColor: theme.primaryColor }}
            />
            <div className="relative z-10 space-y-6 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Catálogo Oficial {new Date().getFullYear()}
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9]">
                {theme.storeName || 'Bienvenido'}
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                Descubre nuestra selección exclusiva de productos. Todo a un clic de distancia vía WhatsApp.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <button 
                  className="px-10 py-5 bg-primary text-black font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:opacity-90 transition-all active:scale-95"
                  style={{ backgroundColor: theme.primaryColor, borderRadius: 'var(--btn-radius)' }}
                >
                  Explorar Ahora
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Nuestra Selección</p>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Productos Destacados</h2>
            </div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              {products.length} Resultados
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <div 
                key={product.id}
                className="group relative bg-[#16171d] border border-white/5 p-4 transition-all hover:border-white/10 hover:shadow-2xl overflow-hidden"
                style={{ borderRadius: 'var(--card-radius)' }}
              >
                <div className="aspect-square bg-[#0f1016] rounded-[24px] overflow-hidden mb-6 relative">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/5">
                      <ShoppingBag className="w-20 h-20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    <button 
                      onClick={() => addToCart(product)}
                      className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500"
                    >
                      Añadir al Carrito
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3 px-2">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-bold text-white text-lg leading-tight truncate group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <span className="text-primary font-black text-lg" style={{ color: theme.primaryColor }}>
                      ${product.price}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">
                    {product.description || 'Sin descripción disponible.'}
                  </p>
                  <button 
                    onClick={handleCheckout}
                    className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary pt-2 group-hover:gap-4 transition-all"
                  >
                    {theme.ctaText}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="py-24 text-center space-y-6">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto opacity-20">
                <AlertCircle className="w-10 h-10 text-white" />
              </div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No hay productos disponibles actualmente</p>
            </div>
          )}
        </div>
      </section>

      {/* Cart Summary (Floating) */}
      {cart.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-6">
          <div className="bg-white rounded-[40px] p-6 shadow-2xl flex items-center justify-between gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Total ({cart.length})</p>
              <p className="text-2xl font-black text-black">
                ${cart.reduce((sum, p) => sum + p.price, 0)}
              </p>
            </div>
            <button 
              onClick={handleCheckout}
              className="flex-1 py-5 bg-black text-white font-black uppercase tracking-widest text-xs rounded-[24px] flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all"
            >
              Completar en WhatsApp
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-white/5 bg-[#16171d]/50 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-primary/20 flex items-center justify-center border border-white/5">
              {theme.logoUrl ? (
                <img src={theme.logoUrl} alt={theme.storeName || ''} className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag className="w-6 h-6 text-primary" />
              )}
            </div>
            <span className="font-black text-white uppercase tracking-tight text-2xl">
              {theme.storeName || 'Store'}
            </span>
          </div>
          
          <div className="flex gap-4">
            {theme.instagramUrl && (
              <a href={theme.instagramUrl} target="_blank" rel="noreferrer" className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white font-bold text-xs flex items-center gap-2 hover:bg-white/10 transition-all">
                <InstagramIcon className="w-4 h-4" />
                Instagram
              </a>
            )}
            {theme.tiktokUrl && (
              <a href={theme.tiktokUrl} target="_blank" rel="noreferrer" className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white font-bold text-xs flex items-center gap-2 hover:bg-white/10 transition-all">
                <ExternalLink className="w-4 h-4" />
                TikTok
              </a>
            )}
          </div>

          <div className="text-center space-y-4">
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.4em]">Powered by Evolution API</p>
            <p className="text-[10px] text-gray-700">© {new Date().getFullYear()} Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
