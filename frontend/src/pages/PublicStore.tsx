import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ShoppingBag, Globe, ShoppingCart, ArrowRight, AlertCircle, Package, Heart, Eye, Check } from 'lucide-react';
import { CheckoutModal } from '../components/Store/CheckoutModal';
import { ProductPreviewModal } from '../components/Store/ProductPreviewModal';
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
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroImageUrl: string | null;
  footerText: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  textColor: string;
}

interface StoreData {
  theme: Theme;
  products: Product[];
  instanceName: string;
}

const ForceWhiteStyles = ({ isLightBg }: { isLightBg: boolean }) => (
  <style>{`
    .cart-force-white { color: ${isLightBg ? '#111827' : '#ffffff'} !important; }
    .cart-force-white-soft { color: ${isLightBg ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)'} !important; }
    .cart-badge-text { color: #ffffff !important; }
    .glass-card {
        background: ${isLightBg ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)'} !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        border: 1px solid ${isLightBg ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)'} !important;
    }
    .soft-glow-hover:hover {
        box-shadow: 0 0 40px ${isLightBg ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 50, 125, 0.15)'} !important;
    }
    .eye-icon-fix { color: #000000 !important; transition: color 0.2s; }
    .eye-btn:hover .eye-icon-fix { color: #ffffff !important; }
    
    .quick-add-btn-text { color: ${isLightBg ? '#ffffff' : '#000000'} !important; transition: color 0.2s; }
    .quick-add-btn:hover .quick-add-btn-text { color: ${isLightBg ? '#000000' : '#ffffff'} !important; }
  `}</style>
);

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
  return '#' + color.replace(/^#/, '').replace(/../g, c => ('0' + Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).slice(-2));
};
// Utility to fix double encoding issues (e.g. CÃ¡MARA -> CÁMARA)
const decodeText = (text: string | null) => {
  if (!text) return '';
  try {
    return decodeURIComponent(escape(text));
  } catch {
    return text;
  }
};

export const PublicStore: React.FC = () => {
  const { instanceName } = useParams<{ instanceName: string }>();
  const [data, setData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [addedToCartId, setAddedToCartId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/theme/store-api/${instanceName}`);
        setData(response.data);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? (err as { response?: { data?: { error?: string } } }).response?.data?.error : 'No pudimos cargar la tienda. Verifica el nombre.';
        setError(errorMsg || 'No pudimos cargar la tienda. Verifica el nombre.');
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
    setAddedToCartId(product.id);
    setTimeout(() => setAddedToCartId(null), 2000);
  };

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  const handleCheckout = () => {
    if (!data || cart.length === 0) return;
    setIsCheckoutOpen(true);
  };

  const handleFinalSubmit = async (formData: {
    customerName: string;
    customerPhone: string;
    shippingAddress: string;
    shippingCity: string;
    paymentMethod: string;
    transactionId: string;
  }) => {
    if (!data || !instanceName) return;

    try {
      // 1. Construct valid JID from phone (remove non-digits, add suffix)
      const cleanPhone = formData.customerPhone.replace(/\D/g, '');
      const remoteJid = cleanPhone ? `${cleanPhone}@s.whatsapp.net` : instanceName;

      // 2. Save order to Database
      const orderPayload = {
        remoteJid,
        ...formData,
        items: cart.map(p => ({
          productId: p.id,
          quantity: 1
        }))
      };

      const response = await axios.post(`/order/${instanceName}`, orderPayload);
      const order = response.data;

      // 3. Open WhatsApp with order details
      const message = `¡Hola! 👋 He realizado un pedido (#${order.id.slice(-6).toUpperCase()}) en su tienda:\n\n` +
        `👤 *Cliente:* ${formData.customerName}\n` +
        `📍 *Dirección:* ${formData.shippingAddress}, ${formData.shippingCity}\n` +
        `💳 *Pago:* ${formData.paymentMethod}\n\n` +
        `📦 *Productos:*\n${cart.map(p => `- ${p.name} ($${p.price})`).join('\n')}\n\n` +
        `💰 *Total:* $${cart.reduce((sum, p) => sum + p.price, 0).toLocaleString()}\n\n` +
        `Por favor, confírmenme para proceder con el envío.`;

      const whatsappUrl = `https://wa.me/${data.instanceName}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      // Clear cart and close modal
      setCart([]);
      setIsCheckoutOpen(false);
    } catch (err: unknown) {
      console.error('Error creating order:', err);
      alert('Hubo un error al procesar tu pedido. Por favor intenta de nuevo.');
    }
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
  const textColor = theme.textColor || (isLightBg ? '#111827' : '#ffffff');
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
      <ForceWhiteStyles isLightBg={isLightBg} />
      {/* Navbar Luxury Design */}
      <nav 
        className={cn(
          "fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-16 py-4 transition-all duration-500",
          theme.template === 'luxury' 
            ? "bg-gradient-to-r from-primary to-[#7b41b3] shadow-lg backdrop-blur-md" 
            : (isLightBg ? "bg-white/90 backdrop-blur-md shadow-sm" : "bg-black/80 backdrop-blur-md shadow-sm")
        )}
      >
        <div className={cn(
          "text-2xl md:text-3xl font-black uppercase tracking-tighter",
          theme.template === 'luxury' ? "text-white" : (isLightBg ? "text-black" : "text-white")
        )}>
          {theme.storeName || 'Avri'}
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={handleCheckout}
            className={cn(
              "relative px-6 h-11 flex items-center gap-2 font-black uppercase tracking-widest text-[10px] transition-all hover:scale-105 active:scale-95",
              theme.template === 'luxury' 
                ? "bg-white/10 border border-white/30 text-white backdrop-blur-sm shadow-xl rounded-full"
                : "shadow-xl"
            )}
            style={{ 
              backgroundColor: theme.template === 'luxury' ? undefined : (isLightBg ? '#111827' : '#ffffff'), 
              borderRadius: theme.template === 'luxury' ? undefined : 'var(--btn-radius)',
              color: theme.template === 'luxury' ? undefined : (isLightBg ? '#ffffff' : '#111827')
            }}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>CARRITO ({cart.length})</span>
          </button>
        </div>
      </nav>

      {/* Hero Inmersivo / Full Width */}
      <section 
        className="relative pt-32 pb-24 md:pt-48 md:pb-40 px-6 overflow-hidden flex items-center"
        style={{ 
          backgroundColor: theme.template === 'moderno' ? theme.primaryColor : (theme.template === 'luxury' ? '#001946' : 'transparent'),
          background: theme.template === 'luxury' ? 'linear-gradient(to bottom right, #001946, #00327d, #54118a)' : undefined,
          color: (theme.template === 'moderno' || theme.template === 'luxury') ? '#ffffff' : textColor
        }}
      >
        {/* Luxury Background Effects - Glass Orbs */}
        {theme.template === 'luxury' && (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-[#7b41b3]/30 rounded-full filter blur-[100px] opacity-70 animate-pulse"
            />
            <div 
              className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-[#0047ab]/40 rounded-full filter blur-[120px] opacity-60"
            />
          </div>
        )}
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
                className={cn(
                  "relative flex flex-col items-center transition-all duration-500",
                  theme.template === 'luxury' && "glass-card p-6 soft-glow-hover group cursor-pointer"
                )}
                style={{ borderRadius: theme.template === 'luxury' ? '24px' : undefined }}
              >
                <div 
                  className={cn(
                    "relative w-full aspect-square overflow-hidden bg-[#fcf9f8] mb-6 transition-all duration-700",
                    theme.template === 'luxury' ? "rounded-xl" : "rounded-[40px]"
                  )}
                  onClick={() => setSelectedProduct(product)}
                >
                  {/* Floating Action Icons (Top Right) */}
                  <div className="absolute top-4 right-4 z-30 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all",
                        favorites.includes(product.id) 
                          ? "bg-red-500 text-white border-red-500" 
                          : "bg-white text-black hover:bg-black hover:text-white"
                      )}
                    >
                      <Heart size={16} fill={favorites.includes(product.id) ? "currentColor" : "none"} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); }}
                      className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-black eye-btn transition-colors"
                    >
                      <Eye size={16} className="eye-icon-fix" />
                    </button>
                  </div>

                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={decodeText(product.name)} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-white/5 p-4">
                      <ShoppingBag className="w-10 h-10 opacity-5 mb-3" />
                      <span className="text-[7px] font-black uppercase tracking-[0.4em] opacity-10 text-center line-clamp-2 px-2">
                        {decodeText(product.name)}
                      </span>
                    </div>
                  )}
                  
                  {/* Quick Add Button (Bottom) */}
                  <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 z-30">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className={cn(
                        "w-full py-4 font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 quick-add-btn",
                        addedToCartId === product.id 
                          ? "bg-green-500 text-white border-green-500" 
                          : isLightBg
                            ? "bg-black border-black hover:bg-white"
                            : "bg-white border-white hover:bg-transparent"
                      )}
                    >
                      <span className="quick-add-btn-text">
                        {addedToCartId === product.id ? (
                          <>
                            <Check size={14} className="inline mr-2" />
                            AÑADIDO
                          </>
                        ) : (
                          'AGREGAR RÁPIDAMENTE'
                        )}
                      </span>
                    </button>
                  </div>
                </div>
                
                {/* Product Info - Luxury Style */}
                <div className={cn(
                  "text-center w-full mt-auto space-y-2",
                  theme.template === 'luxury' ? "pt-4" : "max-w-[90%] mx-auto"
                )}>
                  <h3 className={cn(
                    "font-black uppercase tracking-tighter",
                    theme.template === 'luxury' ? "text-xl" : "text-[11px] tracking-[0.15em] opacity-90"
                  )}
                  style={{ color: textColor }}
                  >
                    {decodeText(product.name)}
                  </h3>
                  <p className={cn(
                    "uppercase tracking-widest",
                    theme.template === 'luxury' ? "text-[10px] opacity-70" : "text-[9px] opacity-50"
                  )}
                  style={{ color: textColor }}
                  >
                    {decodeText(product.description) || 'Luxury Selection'}
                  </p>
                  <p className={cn(
                    "font-black tracking-tighter",
                    theme.template === 'luxury' ? "text-primary text-base pt-2" : "text-sm pt-1"
                  )}
                  style={{ color: theme.template === 'luxury' ? theme.primaryColor : undefined }}
                  >
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

      {/* Floating Badge - Luxury Style */}
      {cart.length > 0 && (
        <div 
          onClick={handleCheckout}
          className={cn(
            "fixed bottom-8 right-8 z-50 flex items-center gap-3 shadow-[0_0_30px_rgba(0,50,125,0.15)] cursor-pointer hover:scale-105 transition-all duration-300",
            theme.template === 'luxury' 
              ? "glass-card pl-4 pr-6 py-3 rounded-full" 
              : "bg-[#111827] p-2.5 pl-8 rounded-full shadow-2xl"
          )}
        >
          <div 
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-white",
              theme.template === 'luxury' ? "bg-primary" : "bg-black"
            )}
            style={{ backgroundColor: theme.template === 'luxury' ? theme.primaryColor : undefined }}
          >
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div className={theme.template === 'luxury' ? "block" : "hidden md:block"}>
            <p className={cn(
              "text-[9px] font-black uppercase tracking-[0.2em] opacity-50",
              theme.template !== 'luxury' && "cart-force-white-soft"
            )}>Total Carrito</p>
            <p className={cn(
              "text-sm font-black",
              theme.template !== 'luxury' && "text-xl text-white cart-force-white"
            )}>
              ${cart.reduce((acc, p) => acc + p.price, 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}
      {/* Checkout Modal */}
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSubmit={handleFinalSubmit}
        total={cart.reduce((sum, p) => sum + p.price, 0)}
        theme={theme}
      />

      {/* Product Preview Modal */}
      <ProductPreviewModal 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
        theme={theme}
      />
    </div>
  );
};
