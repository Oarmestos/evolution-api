import React from 'react';

interface WebPreviewProps {
  layout: any;
}

export const WebPreview: React.FC<WebPreviewProps> = ({ layout }) => {
  const content = layout?.content || [];
  const rootProps = layout?.root?.props || {};
  const primaryColor = rootProps.primaryColor || "#00E5FF";

  return (
    <div className="w-[200%] h-[200%] bg-white overflow-hidden rounded-[40px] flex flex-col scale-50 origin-top-left border-[6px] border-white/10 shadow-2xl font-['Inter']">
      
      {/* Real-like Header */}
      <div className="h-20 bg-gradient-to-r from-[#00E5FF] to-[#4F46E5] flex items-center px-12 justify-between shrink-0 shadow-lg">
        <div className="text-2xl font-black text-white uppercase tracking-widest">{rootProps.storeName || "MI TIENDA"}</div>
        <div className="flex items-center gap-6">
           <div className="px-6 py-2 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white flex items-center gap-2 border border-white/10">
              CARRITO (0)
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {content.map((item: any, index: number) => {
          const props = item.props || {};

          if (item.type === 'Hero') {
            return (
              <div key={index} className="min-h-[500px] bg-gradient-to-br from-[#001946] via-[#1e1b4b] to-[#4c1d95] flex flex-col items-center justify-center p-20 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                <h1 className="text-7xl font-black text-white uppercase tracking-tighter mb-8 max-w-5xl leading-[0.9] z-10">
                  {props.title || "Tu Tienda Online"}
                </h1>
                <p className="text-xl text-white/60 max-w-2xl mb-12 font-medium leading-relaxed z-10 italic">
                  {props.subtitle || "Los mejores productos al alcance de un clic."}
                </p>
                <div 
                  className="px-12 py-5 rounded-md font-black uppercase tracking-widest text-sm shadow-xl z-10 border-b-4 border-black/20"
                  style={{ backgroundColor: primaryColor, color: '#001946' }}
                >
                  Ver Detalles +
                </div>
              </div>
            );
          }

          if (item.type === 'ProductGrid') {
            return (
              <div key={index} className="p-24 bg-slate-50/50">
                <div className="flex flex-col items-center mb-20 text-center">
                  <div className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-4">2024 Selección</div>
                  <h2 className="text-5xl font-black text-[#1a1b23] uppercase tracking-tighter">{props.title || "Nuestros Productos"}</h2>
                  <div className="h-1.5 w-24 bg-[#00E5FF] mt-6 rounded-full" />
                </div>
                <div className="grid grid-cols-4 gap-10">
                   {[1,2,3,4].map(i => (
                     <div key={i} className="bg-white rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col gap-6 items-center text-center group hover:-translate-y-2 transition-all">
                       <div className="aspect-square w-full bg-slate-900 rounded-2xl flex items-center justify-center text-cyan-400 font-bold">
                          IMG
                       </div>
                       <div className="space-y-2">
                         <div className="text-xs font-black uppercase tracking-widest text-gray-400">Categoría</div>
                         <div className="text-lg font-black text-[#1a1b23] uppercase">Producto Premium</div>
                         <div className="text-xl font-black text-[#4F46E5]">$99.00</div>
                       </div>
                     </div>
                   ))}
                </div>
              </div>
            );
          }

          if (item.type === 'Container') {
            return (
              <div key={index} className="px-24 py-20 grid grid-cols-2 gap-12 bg-white">
                 {[1,2].map(i => (
                    <div key={i} className="h-72 bg-slate-50 rounded-[40px] border border-slate-100 p-12 flex flex-col justify-center">
                       <div className="h-8 w-48 bg-slate-200 rounded-lg mb-6" />
                       <div className="h-4 w-full bg-slate-100 rounded-full mb-2" />
                       <div className="h-4 w-[80%] bg-slate-100 rounded-full" />
                    </div>
                 ))}
              </div>
            );
          }

          if (item.type === 'Spacer') {
            return <div key={index} className="bg-white" style={{ height: (props.height || 20) * 1.5 }} />;
          }

          if (item.type === 'Footer') {
            return (
              <div key={index} className="p-32 bg-slate-50 border-t border-slate-100 flex flex-col items-center gap-12">
                 <div className="text-4xl font-black text-slate-200 uppercase tracking-[0.2em]">{rootProps.storeName || "MI TIENDA"}</div>
                 <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <span>Privacidad</span>
                    <span>Términos</span>
                    <span>Contacto</span>
                 </div>
                 <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">{props.text}</p>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};
