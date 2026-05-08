import React, { useState } from 'react';
import { ArrowLeft, User, CheckCircle2, MoreVertical, Send, Check, Image as ImageIcon, Package, X, ChevronRight, Truck, ShieldCheck, Minus, Plus, ShoppingCart } from 'lucide-react';
import { cn } from '../../utils/cn';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  description: string | null;
  category?: string;
}

interface LivePreviewProps {
  theme: any;
  previewProduct: Product | null;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ theme, previewProduct }) => {
  const [showDetail, setShowDetail] = useState(false);
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="sticky top-8 space-y-6">
      <div className="flex items-center gap-2 text-primary">
        <Package className="w-4 h-4" />
        <h3 className="text-sm font-black uppercase tracking-widest">Vista Previa Live</h3>
      </div>

      {/* Smartphone Mockup */}
      <div className="relative mx-auto w-[320px] h-[640px] bg-black rounded-[60px] border-[8px] border-[#1e1e1e] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* Detail View (Overlay inside the mockup) */}
        {showDetail && previewProduct && (
          <div className="absolute inset-0 z-50 bg-white dark:bg-[#0f1115] animate-in slide-in-from-bottom duration-300 flex flex-col">
             {/* Header Detail */}
             <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#0f1115]">
                <div className="flex items-center gap-2 text-[8px] font-bold opacity-30 uppercase tracking-[0.2em] truncate">
                   <span>Tienda</span>
                   <ChevronRight size={8} />
                   <span className="text-primary truncate">{previewProduct.name}</span>
                </div>
                <button onClick={() => { setShowDetail(false); setQuantity(1); }} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full">
                   <X size={16} />
                </button>
             </div>
             
             {/* Body Detail */}
             <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <div className="aspect-square rounded-3xl overflow-hidden bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/10">
                   {previewProduct.imageUrl ? (
                     <img src={previewProduct.imageUrl} alt={previewProduct.name} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center opacity-10">
                        <Package size={40} />
                     </div>
                   )}
                </div>

                <div className="space-y-4">
                   <div className="space-y-1">
                      {previewProduct.category && (
                        <span className="text-[8px] font-black text-primary uppercase tracking-widest">{previewProduct.category}</span>
                      )}
                      <h2 className="text-xl font-bold dark:text-white uppercase leading-none">{previewProduct.name}</h2>
                      <p className="text-[10px] text-gray-500 font-medium leading-relaxed opacity-80">
                        {previewProduct.description || 'Especificaciones premium disponibles para entrega inmediata.'}
                      </p>
                   </div>

                   <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold dark:text-white">${previewProduct.price.toLocaleString('es-CO')}</span>
                      <span className="text-[8px] font-bold opacity-30 uppercase">IVA Inc.</span>
                   </div>

                   <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-3">
                           <span className="text-[8px] font-bold opacity-30 uppercase tracking-widest">Cant.</span>
                           <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-6 h-6 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-md border border-black/5 dark:border-white/5 transition-colors"
                              >
                                <Minus size={10}/>
                              </button>
                              <span className="text-xs font-bold w-4 text-center">{quantity}</span>
                              <button 
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-6 h-6 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-md border border-black/5 dark:border-white/5 transition-colors"
                              >
                                <Plus size={10}/>
                              </button>
                           </div>
                        </div>
                        <span className="text-sm font-bold opacity-80">${(previewProduct.price * quantity).toLocaleString('es-CO')}</span>
                      </div>

                      <button 
                         className="w-full py-3.5 rounded-xl font-black uppercase text-[9px] tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                         style={{ backgroundColor: theme.buttonColor, color: theme.buttonColor === '#000000' || theme.buttonColor === '#000' ? 'white' : 'black' }}
                      >
                         <ShoppingCart size={12} />
                         Añadir a la Cesta
                      </button>
                   </div>

                   <div className="flex items-center justify-center gap-4 pt-2 opacity-60">
                      <div className="flex items-center gap-1.5">
                        <Truck size={12} className="text-primary" />
                        <span className="text-[8px] font-bold uppercase tracking-wider">Envío Gratis</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck size={12} className="text-primary" />
                        <span className="text-[8px] font-bold uppercase tracking-wider">Certificado</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* WhatsApp UI */}
        <div className="flex flex-col h-full bg-[#e5ddd5] dark:bg-[#0b141a] font-sans" style={{ fontFamily: theme.fontFamily }}>
          
          {/* Header WA */}
          <div className="bg-[#075e54] dark:bg-[#202c33] p-4 pt-10 flex items-center gap-3 text-white">
            <ArrowLeft className="w-4 h-4" />
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-white/10">
              {theme.logoUrl ? (
                <img src={theme.logoUrl} alt="Store" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm truncate">{theme.storeName || 'Mi Tienda'}</span>
                <CheckCircle2 className="w-3 h-3 text-[#25d366] fill-[#25d366] bg-white rounded-full p-[1px]" />
              </div>
              <div className="text-[10px] text-white/70">verificado</div>
            </div>
            <MoreVertical className="w-4 h-4 text-white/70" />
          </div>

          {/* Chat Area */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            
            {/* Incoming Welcome Message */}
            <div className="max-w-[85%] bg-white dark:bg-[#202c33] rounded-2xl rounded-tl-none p-3 shadow-sm relative">
              <p className="text-xs text-black dark:text-white/90">
                ¡Hola! Bienvenid@ a nuestra tienda. 🛍️
              </p>
              <span className="block text-[8px] text-gray-400 text-right mt-1">10:45 AM</span>
            </div>

            {/* Product Card Card */}
            <div 
              className="max-w-[90%] mx-auto bg-white dark:bg-[#111b21] shadow-xl overflow-hidden"
              style={{ borderRadius: `${theme.borderRadius}px`, backgroundColor: theme.bgColor }}
            >
              <div className="aspect-square bg-gray-100 dark:bg-[#2a3942] flex items-center justify-center relative">
                {previewProduct?.imageUrl || theme.logoUrl ? (
                  <img 
                    src={previewProduct?.imageUrl || theme.logoUrl} 
                    alt="Product" 
                    className={cn(
                      "w-full h-full object-cover",
                      !previewProduct?.imageUrl && "w-1/2 h-1/2 object-contain opacity-50"
                    )} 
                  />
                ) : (
                  <ImageIcon className="w-12 h-12 text-gray-300" />
                )}
                <div className="absolute top-2 right-2 bg-primary text-black text-[10px] font-black px-2 py-1 rounded-full uppercase">
                  {previewProduct?.category || 'NUEVO'}
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h4 className="font-bold text-sm text-black dark:text-white truncate">
                  {previewProduct?.name || 'Producto de Ejemplo'}
                </h4>
                <p className="text-[10px] text-primary font-black">
                  ${previewProduct?.price ? previewProduct.price.toLocaleString('es-CO') : '0'}
                </p>
                <button 
                  onClick={() => setShowDetail(true)}
                  className="w-full py-2.5 text-[10px] font-black uppercase tracking-widest transition-all"
                  style={{ 
                    backgroundColor: theme.buttonColor, 
                    color: theme.buttonColor === '#000000' || theme.buttonColor === '#000' ? 'white' : 'black', 
                    borderRadius: `${theme.borderRadius / 2}px` 
                  }}
                >
                  {theme.ctaText}
                </button>
              </div>
            </div>

            {/* User Outgoing Response */}
            <div className="flex justify-end">
              <div className="max-w-[85%] bg-[#dcf8c6] dark:bg-[#005c4b] rounded-2xl rounded-tr-none p-3 shadow-sm relative">
                <p className="text-xs text-black dark:text-white/90">
                  Quiero ver el catálogo completo por favor.
                </p>
                <span className="block text-[8px] text-[#00000073] dark:text-white/50 text-right mt-1 flex items-center justify-end gap-0.5">
                  10:46 AM <Check className="w-2.5 h-2.5 text-blue-500" />
                </span>
              </div>
            </div>

          </div>

          {/* Input Bar */}
          <div className="bg-[#f0f2f5] dark:bg-[#202c33] p-3 flex items-center gap-3">
            <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-full px-4 py-2 text-[10px] text-gray-400 border dark:border-none">
              Escribe un mensaje...
            </div>
            <div className="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center text-white">
              <Send className="w-4 h-4 fill-white translate-x-0.5" />
            </div>
          </div>

        </div>
      </div>

      {/* Note */}
      <div className="text-center space-y-2 px-8">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Nota Importante</p>
        <p className="text-[9px] text-gray-600 leading-relaxed italic">
          Este es una simulación visual. Los colores finales pueden variar levemente dependiendo de la versión de WhatsApp del cliente.
        </p>
      </div>
    </div>
  );
};
