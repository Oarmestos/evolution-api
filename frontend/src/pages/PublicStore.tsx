import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ShoppingBag, AlertCircle } from 'lucide-react';
import { CheckoutModal } from '../components/Store/CheckoutModal';
import { BlockRenderer } from '../components/Appearance/AvriBuilder/BlockRenderer';

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
  layout?: any;
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

export const PublicStore: React.FC = () => {
  const { instanceName } = useParams<{ instanceName: string }>();
  const [data, setData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<Product[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

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
      const cleanPhone = formData.customerPhone.replace(/\D/g, '');
      const remoteJid = cleanPhone ? `${cleanPhone}@s.whatsapp.net` : instanceName;

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

      const message = `¡Hola! 👋 He realizado un pedido (#${order.id.slice(-6).toUpperCase()}) en su tienda:\n\n` +
        `👤 *Cliente:* ${formData.customerName}\n` +
        `📍 *Dirección:* ${formData.shippingAddress}, ${formData.shippingCity}\n` +
        `💳 *Pago:* ${formData.paymentMethod}\n\n` +
        `📦 *Productos:*\n${cart.map(p => `- ${p.name} ($${p.price})`).join('\n')}\n\n` +
        `💰 *Total:* $${cart.reduce((sum, p) => sum + p.price, 0).toLocaleString()}\n\n` +
        `Por favor, confírmenme para proceder con el envío.`;

      const whatsappUrl = `https://wa.me/${data.instanceName}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
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

  const { theme } = data;
  const isLightBg = isLightColor(theme.bgColor || '#0f1016');
  const textColor = theme.textColor || (isLightBg ? '#111827' : '#ffffff');

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
      
      {theme.layout ? (
        <div className="w-full">
          <BlockRenderer 
            block={
              theme.layout.id === 'root' 
                ? theme.layout 
                : { 
                    id: 'root', 
                    type: 'Container', 
                    props: theme.layout.root?.props || {
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      minHeight: '100vh',
                      backgroundColor: theme.bgColor || '#ffffff'
                    }, 
                    children: theme.layout.children || theme.layout.content || [] 
                  }
            } 
            readOnly={true} 
          />
        </div>
      ) : (
        <div className="min-h-screen flex items-center justify-center p-10 text-center">
          <div className="space-y-4">
            <h2 className="text-4xl font-black uppercase tracking-tighter">Configurando Tienda</h2>
            <p className="text-gray-400">Tu tienda estará lista en unos momentos...</p>
          </div>
        </div>
      )}

      {isCheckoutOpen && (
        <CheckoutModal 
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onSubmit={handleFinalSubmit}
          total={cart.reduce((sum, p) => sum + p.price, 0)}
          theme={theme}
        />
      )}
    </div>
  );
};
