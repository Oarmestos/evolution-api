import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  ShoppingBag, 
  InstagramIcon, 
  Send, 
  ShoppingCart, 
  ArrowRight,
  Loader2,
  AlertCircle,
  ExternalLink,
  Package,
  CheckCircle2,
  Clock,
  ChevronRight
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
          <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] animate-pulse">Cargando Experiencia</p>
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
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-bold uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
          >
            Reintentar Conexión
          </button>
        </div>
      </div>
    );
  }

  const { theme, products } = data;
  const isLightBg = isLightColor(theme.bgColor || '#0f1016');
  const cardBg = isLightBg ? '#ffffff' : adjustColor(theme.bgColor || '#0f1016', 10);
  const textColor = isLightBg ? '#111827' : '#ffffff';
  const mutedTextColor = isLightBg ? '#6b7280' : '#9ca3af';
  const borderColor = isLightBg ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';

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
      {/* Navbar Premium */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6">
        <div 
          className="max-w-7xl mx-auto flex items-center justify-between backdrop-blur-2xl border p-4 shadow-2xl transition-all duration-500"
          style={{ 
            backgroundColor: isLightBg ? 'rgba(255,255,255,0.7)' : 'rgba(15,16,22,0.7)',
            borderColor: borderColor,
            borderRadius: 'var(--card-radius)'
          }}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 overflow-hidden flex items-center justify-center border shadow-inner transition-transform hover:scale-105"
              style={{ borderRadius: 'var(--btn-radius)', borderColor: borderColor }}
            >
              {theme.logoUrl ? (
                <img src={theme.logoUrl} alt={theme.storeName || ''} className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag className="w-6 h-6 text-primary" style={{ color: theme.primaryColor }} />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-black uppercase tracking-tight text-xl leading-none">
                {theme.storeName || 'Store'}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-green-500">En Línea</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {theme.instagramUrl && (
              <a 
                href={theme.instagramUrl} 
                target="_blank" 
                rel="noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: mutedTextColor }}
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
            )}
            <button 
              onClick={handleCheckout}
              className="relative px-6 h-12 flex items-center gap-3 font-black uppercase tracking-widest text-[10px] shadow-lg transition-all hover:scale-105 active:scale-95 group overflow-hidden"
              style={{ 
                backgroundColor: theme.primaryColor, 
                borderRadius: 'var(--btn-radius)',
                color: isLightColor(theme.primaryColor) ? '#000000' : '#ffffff'
              }}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <ShoppingCart className="w-4 h-4 relative z-10" />
              <span className="relative z-10 hidden sm:inline">Carrito</span>
              {cart.length > 0 && (
                <span 
                  className="relative z-10 w-5 h-5 bg-white/90 text-black rounded-full flex items-center justify-center text-[9px] font-black shadow-sm animate-in zoom-in"
                >
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section Adaptable */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div 
            className={cn(
              "relative p-10 md:p-20 overflow-hidden border transition-all duration-700",
              theme.template === 'minimalista' ? "border-none !bg-transparent !p-0" : "shadow-3xl"
            )}
            style={{ 
              backgroundColor: theme.template === 'minimalista' ? 'transparent' : cardBg,
              borderColor: borderColor,
              borderRadius: 'calc(var(--card-radius) * 1.5)'
            }}
          >
            {/* Ambient Background Effect */}
            {theme.template !== 'minimalista' && (
              <div 
                className="absolute -top-24 -right-24 w-96 h-96 opacity-20 blur-[100px] rounded-full animate-pulse"
                style={{ backgroundColor: theme.primaryColor }}
              />
            )}

            <div className={cn(
              "relative z-10 space-y-8",
              theme.template === 'minimalista' ? "max-w-3xl" : "max-w-2xl"
            )}>
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Package className="w-3.5 h-3.5 text-primary" style={{ color: theme.primaryColor }} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary" style={{ color: theme.primaryColor }}>
                  Catálogo {new Date().getFullYear()}
                </span>
              </div>

              <h1 className={cn(
                "font-black uppercase tracking-tighter leading-[0.85] animate-in slide-in-from-left duration-700",
                theme.template === 'minimalista' ? "text-6xl md:text-8xl" : "text-5xl md:text-7xl"
              )}>
                {theme.template === 'divertido' && "✨ "}
                {theme.storeName || 'Bienvenido'}
                {theme.template === 'divertido' && " 🚀"}
              </h1>

              <p className="text-lg md:text-xl opacity-70 leading-relaxed font-medium">
                Descubre nuestra selección exclusiva de productos de alta calidad. 
                Haz tu pedido ahora y recíbelo directamente a través de WhatsApp.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <button 
                  className="px-10 py-5 font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all hover:translate-x-2 shadow-xl group"
                  style={{ 
                    backgroundColor: theme.buttonColor, 
                    color: isLightColor(theme.buttonColor) ? '#000000' : '#ffffff',
                    borderRadius: 'var(--btn-radius)' 
                  }}
                >
                  Explorar Colección
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                {theme.template === 'moderno' && (
                  <div className="flex items-center gap-2 px-6 py-2">
                    <div className="flex -space-x-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-gray-200" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold uppercase opacity-50">+500 Clientes felices</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid with Premium Cards */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-[2px] bg-primary" style={{ backgroundColor: theme.primaryColor }} />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary" style={{ color: theme.primaryColor }}>
                  Nuestra Selección
                </p>
              </div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
                Productos Destacados
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest opacity-50" style={{ borderColor: borderColor }}>
                {products.length} Resultados
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {products.map((product) => (
              <div 
                key={product.id}
                className={cn(
                  "group relative border transition-all duration-500 hover:shadow-3xl hover:-translate-y-2 overflow-hidden",
                  theme.template === 'minimalista' ? "border-none bg-transparent" : "p-4"
                )}
                style={{ 
                  backgroundColor: theme.template === 'minimalista' ? 'transparent' : cardBg,
                  borderColor: borderColor,
                  borderRadius: 'var(--card-radius)' 
                }}
              >
                {/* Product Image Container */}
                <div 
                  className="aspect-[4/5] overflow-hidden mb-6 relative shadow-inner"
                  style={{ 
                    backgroundColor: isLightBg ? '#f3f4f6' : adjustColor(theme.bgColor || '#0f1016', -5),
                    borderRadius: 'calc(var(--card-radius) - 8px)'
                  }}
                >
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-10">
                      <ShoppingBag className="w-24 h-24" />
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center p-6">
                    <button 
                      onClick={() => addToCart(product)}
                      className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-full transform translate-y-8 group-hover:translate-y-0 transition-all duration-500 shadow-2xl"
                    >
                      Añadir al Carrito
                    </button>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className="px-3 py-1 bg-primary text-black text-[9px] font-black rounded-full shadow-lg" style={{ backgroundColor: theme.primaryColor }}>
                      NUEVO
                    </div>
                  </div>
                </div>
                
                {/* Product Info */}
                <div className="space-y-4 px-2">
                  <div className="space-y-1">
                    <h3 className="font-black text-xl leading-tight uppercase tracking-tight group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-green-500">En Stock</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-2xl font-black tracking-tighter">
                      ${product.price.toLocaleString()}
                    </span>
                    <button 
                      onClick={handleCheckout}
                      className="p-3 border rounded-full transition-all hover:bg-primary hover:text-black group/btn"
                      style={{ borderColor: borderColor }}
                    >
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State Premium */}
          {products.length === 0 && (
            <div className="py-32 text-center space-y-8 max-w-lg mx-auto animate-in fade-in zoom-in duration-700">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-primary/10 rounded-[30px] flex items-center justify-center mx-auto border border-primary/20 rotate-12 transition-transform hover:rotate-0 duration-500">
                  <Package className="w-12 h-12 text-primary" style={{ color: theme.primaryColor }} />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase tracking-tight">Próximamente más productos</h3>
                <p className="text-sm opacity-60 leading-relaxed">
                  Estamos actualizando nuestro catálogo. Si buscas algo específico, 
                  no dudes en contactarnos directamente.
                </p>
              </div>
              <button 
                onClick={() => window.open(`https://wa.me/${data.instanceName}`, '_blank')}
                className="px-8 py-4 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3 mx-auto"
              >
                <Send className="w-4 h-4" />
                Consultar por WhatsApp
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Floating Cart Button (Mobile Optimized) */}
      {cart.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-6 animate-in slide-in-from-bottom-10 duration-500">
          <div 
            className="rounded-[35px] p-4 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-between gap-6 border"
            style={{ 
              backgroundColor: isLightBg ? 'rgba(255,255,255,0.95)' : 'rgba(31,31,39,0.95)',
              borderColor: borderColor,
              backdropFilter: 'blur(20px)'
            }}
          >
            <div className="space-y-0.5 px-2">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Resumen</p>
              <p className="text-2xl font-black">
                ${cart.reduce((sum, p) => sum + p.price, 0).toLocaleString()}
              </p>
            </div>
            <button 
              onClick={handleCheckout}
              className="flex-1 py-5 font-black uppercase tracking-widest text-[11px] rounded-[24px] flex items-center justify-center gap-3 shadow-xl transition-all hover:scale-[1.02] active:scale-95 relative overflow-hidden group"
              style={{ 
                backgroundColor: theme.buttonColor, 
                color: isLightColor(theme.buttonColor) ? '#000000' : '#ffffff'
              }}
            >
              <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              Finalizar Pedido
              <Send className="w-4 h-4 relative z-10" />
            </button>
          </div>
        </div>
      )}

      {/* Footer Refinado */}
      <footer 
        className="py-32 px-6 border-t mt-20 transition-colors duration-500"
        style={{ 
          backgroundColor: isLightBg ? '#f9fafb' : adjustColor(theme.bgColor || '#0f1016', 5),
          borderColor: borderColor
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-16">
          <div className="flex flex-col items-center gap-6">
            <div 
              className="w-20 h-20 overflow-hidden flex items-center justify-center border shadow-2xl transition-transform hover:rotate-6"
              style={{ borderRadius: 'var(--card-radius)', borderColor: borderColor }}
            >
              {theme.logoUrl ? (
                <img src={theme.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag className="w-10 h-10 text-primary" style={{ color: theme.primaryColor }} />
              )}
            </div>
            <div className="text-center space-y-2">
              <span className="font-black uppercase tracking-tighter text-4xl block">
                {theme.storeName || 'Store'}
              </span>
              <p className="text-sm opacity-50 font-medium">La mejor selección al mejor precio.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            {theme.instagramUrl && (
              <a href={theme.instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-8 py-4 rounded-full border transition-all hover:bg-black/5 dark:hover:bg-white/5 font-bold text-[10px] uppercase tracking-widest" style={{ borderColor: borderColor }}>
                <InstagramIcon className="w-4 h-4" />
                Instagram
              </a>
            )}
            {theme.tiktokUrl && (
              <a href={theme.tiktokUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-8 py-4 rounded-full border transition-all hover:bg-black/5 dark:hover:bg-white/5 font-bold text-[10px] uppercase tracking-widest" style={{ borderColor: borderColor }}>
                <ExternalLink className="w-4 h-4" />
                TikTok
              </a>
            )}
          </div>

          <div className="w-full max-w-xs h-px bg-current opacity-10" />

          <div className="text-center space-y-6">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30">Evolution API</span>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border" style={{ borderColor: borderColor }}>
                <CheckCircle2 className="w-3 h-3 text-primary" style={{ color: theme.primaryColor }} />
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Plataforma Verificada</span>
              </div>
            </div>
            <p className="text-[9px] opacity-40 uppercase tracking-widest">
              © {new Date().getFullYear()} {theme.storeName}. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
