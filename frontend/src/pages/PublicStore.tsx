import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  ShoppingBag, 
  Globe, 
  Send, 
  ShoppingCart, 
  ArrowRight,
  AlertCircle,
  ExternalLink,
  Package,
  CheckCircle2,
  Clock
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

// Utility to determine if a hex color is light or dark
const isLightColor = (color: string) => {
  if (!color) return false;
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
};

// Utility to lighten/darken hex color for depth
const adjustColor = (color: string, amount: number) => {
  if (!color) return '#16171d';
  return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).slice(-2));
};

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
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <ShoppingBag className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
          </div>
          <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] animate-pulse">Cargando Tienda</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0f1016] flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Tienda No Disponible</h2>
          <p className="text-gray-400 text-sm leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  const { theme, products } = data;
  const isLightBg = isLightColor(theme.bgColor || '#0f1016');
  const cardBg = isLightBg ? '#ffffff' : adjustColor(theme.bgColor || '#0f1016', 10);
  const textColor = isLightBg ? '#111827' : '#ffffff';
  const mutedTextColor = isLightBg ? '#6b7280' : '#9ca3af';
  const borderColor = isLightBg ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';

  return (
    <div 
      className="min-h-screen transition-colors duration-500"
      style={{ 
        backgroundColor: theme.bgColor || '#0f1016',
        fontFamily: theme.fontFamily || 'Inter',
        color: textColor,
        '--primary': theme.primaryColor,
        '--btn-radius': `${theme.borderRadius}px`,
        '--card-radius': `${theme.borderRadius * 1.5}px`
      } as React.CSSProperties}
    >
      {/* Navbar Minimalista */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div 
          className="max-w-7xl mx-auto flex items-center justify-between backdrop-blur-xl border p-3 transition-all duration-500"
          style={{ 
            backgroundColor: isLightBg ? 'rgba(255,255,255,0.8)' : 'rgba(15,16,22,0.8)',
            borderColor: borderColor,
            borderRadius: 'var(--card-radius)',
            boxShadow: isLightBg ? '0 10px 30px rgba(0,0,0,0.03)' : 'none'
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 overflow-hidden flex items-center justify-center border bg-white"
              style={{ borderRadius: 'var(--btn-radius)', borderColor: borderColor }}
            >
              {theme.logoUrl ? (
                <img src={theme.logoUrl} alt={theme.storeName || ''} className="w-full h-full object-contain" />
              ) : (
                <ShoppingBag className="w-5 h-5" style={{ color: theme.primaryColor }} />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-bold uppercase tracking-tight text-lg leading-none">
                {theme.storeName || 'Tienda'}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[8px] font-bold uppercase tracking-widest text-green-500">En Línea</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleCheckout}
              className="relative px-5 h-10 flex items-center gap-2 font-black uppercase tracking-widest text-[9px] transition-all hover:opacity-90 active:scale-95"
              style={{ 
                backgroundColor: theme.buttonColor, 
                borderRadius: 'var(--btn-radius)',
                color: isLightColor(theme.buttonColor) ? '#000000' : '#ffffff'
              }}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Carrito</span>
              {cart.length > 0 && (
                <span className="w-4 h-4 bg-white/90 text-black rounded-full flex items-center justify-center text-[8px] font-black">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section Simplificado */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div 
            className="relative p-8 md:p-16 overflow-hidden border transition-all duration-700"
            style={{ 
              backgroundColor: cardBg,
              borderColor: borderColor,
              borderRadius: 'var(--card-radius)',
              boxShadow: isLightBg ? '0 20px 50px rgba(0,0,0,0.02)' : 'none'
            }}
          >
            <div className="relative z-10 max-w-2xl space-y-6">
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
                {theme.storeName || 'Bienvenido'}
              </h1>

              <p className="text-base md:text-lg opacity-60 leading-relaxed max-w-xl">
                Descubre nuestra selección exclusiva. Haz tu pedido y recíbelo directamente a través de WhatsApp de forma rápida y segura.
              </p>

              <div className="pt-2">
                <button 
                  className="px-8 py-4 font-black uppercase tracking-widest text-[10px] flex items-center gap-3 transition-all hover:gap-5"
                  style={{ 
                    backgroundColor: theme.buttonColor, 
                    color: isLightColor(theme.buttonColor) ? '#000000' : '#ffffff',
                    borderRadius: 'var(--btn-radius)' 
                  }}
                >
                  {theme.ctaText || 'Ver Catálogo'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de Productos */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex items-end justify-between border-b pb-6" style={{ borderColor: borderColor }}>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">
                Catálogo de Productos
              </p>
              <h2 className="text-3xl font-black uppercase tracking-tighter">
                Nuestra Selección
              </h2>
            </div>
            <div className="px-3 py-1 rounded-full border text-[8px] font-bold uppercase tracking-widest opacity-40" style={{ borderColor: borderColor }}>
              {products.length} Items
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <div 
                key={product.id}
                className="group relative border transition-all duration-300 hover:shadow-xl p-3"
                style={{ 
                  backgroundColor: cardBg,
                  borderColor: borderColor,
                  borderRadius: 'var(--card-radius)' 
                }}
              >
                {/* Imagen del Producto */}
                <div 
                  className="aspect-square overflow-hidden mb-4 relative"
                  style={{ 
                    backgroundColor: isLightBg ? '#f9fafb' : adjustColor(theme.bgColor || '#0f1016', -5),
                    borderRadius: 'calc(var(--card-radius) - 10px)'
                  }}
                >
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-5">
                      <ShoppingBag className="w-16 h-16" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <button 
                      onClick={() => addToCart(product)}
                      className="w-full py-3 bg-white text-black font-black uppercase tracking-widest text-[9px] rounded-lg shadow-xl translate-y-2 group-hover:translate-y-0 transition-transform"
                    >
                      Añadir al Carrito
                    </button>
                  </div>
                </div>
                
                {/* Info del Producto */}
                <div className="space-y-3 px-1">
                  <h3 className="font-bold text-base uppercase tracking-tight line-clamp-1">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xl font-black tracking-tighter">
                      ${product.price.toLocaleString()}
                    </span>
                    <button 
                      onClick={handleCheckout}
                      className="w-8 h-8 flex items-center justify-center border rounded-full transition-all hover:bg-black hover:text-white"
                      style={{ borderColor: borderColor }}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Estado Vacío */}
          {products.length === 0 && (
            <div className="py-24 text-center space-y-6 max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
                <Package className="w-8 h-8 opacity-20" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black uppercase">Sin productos aún</h3>
                <p className="text-xs opacity-50">Pronto tendremos novedades para ti.</p>
              </div>
              <button 
                onClick={() => window.open(`https://wa.me/${data.instanceName}`, '_blank')}
                className="px-6 py-3 border rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center gap-2 mx-auto"
                style={{ borderColor: borderColor }}
              >
                <Send className="w-3 h-3" />
                Contactar por WhatsApp
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Resumen de Carrito Flotante */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-6">
          <div 
            className="rounded-full p-2 pl-6 shadow-2xl flex items-center justify-between border backdrop-blur-lg"
            style={{ 
              backgroundColor: isLightBg ? 'rgba(255,255,255,0.9)' : 'rgba(31,31,39,0.9)',
              borderColor: borderColor
            }}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-4 h-4 opacity-40" />
              <p className="text-lg font-black">
                ${cart.reduce((sum, p) => sum + p.price, 0).toLocaleString()}
              </p>
            </div>
            <button 
              onClick={handleCheckout}
              className="px-8 h-12 font-black uppercase tracking-widest text-[9px] rounded-full flex items-center gap-2 shadow-lg"
              style={{ 
                backgroundColor: theme.buttonColor, 
                color: isLightColor(theme.buttonColor) ? '#000000' : '#ffffff'
              }}
            >
              Comprar por WhatsApp
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Footer Limpio */}
      <footer 
        className="py-20 px-6 border-t mt-12"
        style={{ 
          backgroundColor: isLightBg ? '#fcfcfc' : adjustColor(theme.bgColor || '#0f1016', 5),
          borderColor: borderColor
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-10">
          <div className="text-center space-y-4">
            <span className="font-black uppercase tracking-tighter text-2xl block opacity-60">
              {theme.storeName || 'Tienda'}
            </span>
            <div className="flex justify-center gap-4">
              {theme.instagramUrl && (
                <a href={theme.instagramUrl} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full border flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity" style={{ borderColor: borderColor }}>
                  <Globe className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <span className="text-[8px] font-black uppercase tracking-[0.4em] opacity-20">Powered by Evolution API</span>
            <p className="text-[8px] opacity-20 uppercase tracking-widest">
              © {new Date().getFullYear()} - Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
