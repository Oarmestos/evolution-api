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
  Package
} from 'lucide-react';

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
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroImageUrl: string | null;
  footerText: string | null;
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
  const isPrimaryLight = isLightColor(theme.primaryColor);
  const cardBg = isLightBg ? '#ffffff' : adjustColor(theme.bgColor || '#0f1016', 10);
  const textColor = isLightBg ? '#111827' : '#ffffff';
  const borderColor = isLightBg ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

  return (
    <div 
      className="min-h-screen transition-colors duration-500 overflow-x-hidden"
      style={{ 
        backgroundColor: theme.bgColor || '#0f1016',
        fontFamily: theme.fontFamily || 'Inter',
        color: textColor,
        '--primary': theme.primaryColor,
        '--btn-radius': `${theme.borderRadius}px`,
        '--card-radius': `${theme.borderRadius * 1.5}px`
      } as React.CSSProperties}
    >
      {/* Navbar Transparente / Olipop Style */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 overflow-hidden flex items-center justify-center bg-white shadow-sm border"
              style={{ borderRadius: 'var(--btn-radius)', borderColor: borderColor }}
            >
              {theme.logoUrl ? (
                <img src={theme.logoUrl} alt={theme.storeName || ''} className="w-full h-full object-contain" />
              ) : (
                <ShoppingBag className="w-5 h-5" style={{ color: theme.primaryColor }} />
              )}
            </div>
            <span className="font-black uppercase tracking-tighter text-xl">
              {theme.storeName || 'Tienda'}
            </span>
          </div>

          <button 
            onClick={handleCheckout}
            className="relative px-6 h-11 flex items-center gap-2 font-black uppercase tracking-widest text-[10px] transition-all hover:scale-105 active:scale-95 shadow-xl"
            style={{ 
              backgroundColor: isLightBg ? '#111827' : '#ffffff', 
              borderRadius: 'var(--btn-radius)',
              color: isLightBg ? '#ffffff' : '#111827'
            }}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Carrito ({cart.length})</span>
          </button>
        </div>
      </nav>

      {/* Hero Inmersivo / Full Width */}
      <section 
        className="relative pt-32 pb-24 md:pt-48 md:pb-40 px-6 overflow-hidden flex items-center"
        style={{ 
          backgroundColor: theme.template === 'moderno' ? theme.primaryColor : 'transparent',
          color: theme.template === 'moderno' ? (isPrimaryLight ? '#000000' : '#ffffff') : textColor
        }}
      >
        {/* Background Elements for Modern/Divertido */}
        {theme.heroImageUrl ? (
          <div className="absolute inset-0 z-0">
            <img src={theme.heroImageUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          </div>
        ) : (
          theme.template !== 'minimalista' && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div 
                className="absolute -top-1/2 -right-1/4 w-[1000px] h-[1000px] rounded-full opacity-10 blur-[120px]"
                style={{ backgroundColor: isPrimaryLight ? '#000' : '#fff' }}
              />
            </div>
          )
        )}

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="max-w-3xl space-y-8">
            <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter leading-[0.8] animate-in slide-in-from-bottom duration-700">
              {theme.heroTitle || theme.storeName || 'Catálogo'}
            </h1>
            
            <p className="text-xl md:text-2xl opacity-80 leading-tight max-w-xl font-bold italic">
              {theme.heroSubtitle || 'Descubre nuestra selección exclusiva curada para ti. Haz tu pedido hoy mismo.'}
            </p>

            <div className="pt-4">
              <button 
                onClick={() => {
                  const productsSection = document.getElementById('products-grid');
                  productsSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-10 py-5 font-black uppercase tracking-widest text-xs flex items-center gap-4 transition-all hover:gap-6 shadow-2xl"
                style={{ 
                  backgroundColor: theme.buttonColor, 
                  color: isLightColor(theme.buttonColor) ? '#000000' : '#ffffff',
                  borderRadius: 'var(--btn-radius)' 
                }}
              >
                {theme.ctaText || 'Comprar Ahora'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de Productos Olipop Style */}
      <section id="products-grid" className="py-24 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-2 pb-10" style={{ borderColor: borderColor }}>
            <div className="space-y-4">
              <span className="inline-block px-4 py-1.5 bg-black/5 dark:bg-white/5 rounded-full text-[10px] font-black uppercase tracking-[0.3em]">
                {new Date().getFullYear()} Selección
              </span>
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">
                Nuestros Productos
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-16">
            {products.map((product) => (
              <div 
                key={product.id}
                className="group relative flex flex-col transition-all duration-500"
              >
                {/* Imagen del Producto con Fondo de Bloque */}
                <div 
                  className="aspect-square overflow-hidden mb-6 relative transition-transform duration-500 group-hover:-translate-y-2"
                  style={{ 
                    backgroundColor: cardBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 'var(--card-radius)',
                    boxShadow: isLightBg ? '0 10px 40px rgba(0,0,0,0.02)' : 'none'
                  }}
                >
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover p-2" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-10">
                      <ShoppingBag className="w-20 h-20" />
                    </div>
                  )}
                  
                  {/* Overlay en Hover */}
                  <div className="absolute inset-x-4 bottom-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                    <button 
                      onClick={() => addToCart(product)}
                      className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[10px] rounded-full shadow-2xl"
                    >
                      Añadir al Carrito
                    </button>
                  </div>
                </div>
                
                {/* Información del Producto Estilizada */}
                <div className="text-center space-y-2">
                  <h3 className="font-black text-2xl uppercase tracking-tighter group-hover:text-primary transition-colors" style={{ '--primary': theme.primaryColor } as React.CSSProperties}>
                    {product.name}
                  </h3>
                  <p className="text-3xl font-black tracking-tight opacity-50">
                    ${product.price.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Estado Vacío / Footer Landing */}
          {products.length === 0 && (
            <div className="py-40 text-center space-y-10 max-w-2xl mx-auto border-2 border-dashed rounded-[50px] p-10" style={{ borderColor: borderColor }}>
              <Package className="w-24 h-24 mx-auto opacity-10" />
              <div className="space-y-4">
                <h3 className="text-4xl font-black uppercase tracking-tighter">Estamos preparando el stock</h3>
                <p className="text-lg opacity-50 font-medium">Suscríbete a nuestra lista de WhatsApp para ser el primero en saber cuando lleguen nuevos productos.</p>
              </div>
              <button 
                onClick={() => window.open(`https://wa.me/${data.instanceName}`, '_blank')}
                className="px-10 py-5 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-xs rounded-full hover:scale-105 transition-transform"
              >
                Suscribirme vía WhatsApp
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer Estilo Olipop */}
      <footer 
        className="pt-40 pb-20 px-6 border-t-2"
        style={{ 
          backgroundColor: isLightBg ? '#f8f9fa' : adjustColor(theme.bgColor || '#0f1016', 5),
          borderColor: borderColor
        }}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <h4 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none opacity-20">
              {theme.storeName || 'Avri'}
            </h4>
            <p className="text-xl font-bold opacity-40 max-w-sm">
              {theme.heroSubtitle || 'La plataforma líder para vender por WhatsApp con un diseño que enamora a tus clientes.'}
            </p>
          </div>
          
          <div className="flex flex-col md:items-end gap-10">
            <div className="flex gap-4">
              {theme.instagramUrl && (
                <a href={theme.instagramUrl} target="_blank" rel="noreferrer" className="w-16 h-16 rounded-full border-2 flex items-center justify-center hover:bg-black hover:text-white transition-all" style={{ borderColor: borderColor }}>
                  <Globe className="w-6 h-6" />
                </a>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-20 mb-4">Avri Premium Store</p>
              <p className="text-[10px] opacity-20 uppercase tracking-widest">
                {theme.footerText || `© ${new Date().getFullYear()} - Todos los derechos reservados.`}
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Cart Summary Flotante */}
      {cart.length > 0 && (
        <div className="fixed bottom-10 right-10 z-50">
          <button 
            onClick={handleCheckout}
            className="group flex items-center gap-4 bg-black dark:bg-white text-white dark:text-black p-2 pl-6 rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.4)] transition-all hover:scale-105"
          >
            <div className="flex flex-col items-start">
              <span className="text-[8px] font-black uppercase tracking-widest opacity-50">Completar</span>
              <span className="text-xl font-black">${cart.reduce((sum, p) => sum + p.price, 0).toLocaleString()}</span>
            </div>
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:rotate-12"
              style={{ backgroundColor: theme.primaryColor, color: isPrimaryLight ? '#000' : '#fff' }}
            >
              <Send className="w-6 h-6" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
