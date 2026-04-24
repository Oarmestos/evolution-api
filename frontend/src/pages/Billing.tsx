import React from 'react';
import { Check } from 'lucide-react';
import { useInstanceStore } from '../store/useInstanceStore';
import { cn } from '../utils/cn';

export const Billing: React.FC = () => {
  const { instances } = useInstanceStore();

  const plans = [
    { 
      name: 'Basic', 
      price: '$0', 
      desc: 'Para proyectos personales pequeños.',
      features: ['1 Instancia WhatsApp', '500 Mensajes/mes', 'Soporte Comunitario'],
      current: false 
    },
    { 
      name: 'Standard', 
      price: '$29', 
      desc: 'El equilibrio perfecto para negocios en crecimiento.',
      features: ['10 Instancias WhatsApp', '10,000 Mensajes/mes', 'Agentes de IA Ilimitados', 'Webhooks & API'],
      current: true 
    },
    { 
      name: 'Ultimate', 
      price: '$99', 
      desc: 'Control total y escalabilidad sin límites.',
      features: ['Instancias Ilimitadas', 'Mensajes Ilimitados', 'Marca Blanca', 'Soporte Prioritario 24/7'],
      current: false 
    },
  ];

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Suscripción</h2>
        <p className="text-gray-400 text-sm">Gestiona tu plan, límites de consumo y facturación.</p>
      </div>

      {/* Current Status Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#16171d] p-6 rounded-2xl border-l-4 border-primary">
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Plan Actual</p>
          <h3 className="text-3xl font-black text-primary">STANDARD</h3>
          <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-widest">Vence en 28 días</p>
        </div>

        <div className="bg-[#16171d] p-6 rounded-2xl border border-white/[0.03]">
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Límite de Instancias</p>
          <div className="flex justify-between items-end mb-2">
            <h3 className="text-3xl font-black text-white">{instances.length} / 10</h3>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${(instances.length / 10) * 100}%` }} />
          </div>
        </div>

        <div className="bg-[#16171d] p-6 rounded-2xl border border-white/[0.03]">
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Límite de Mensajes</p>
          <div className="flex justify-between items-end mb-2">
            <h3 className="text-3xl font-black text-white">0 / 10k</h3>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-primary/30" style={{ width: '0%' }} />
          </div>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {plans.map((plan) => (
          <div 
            key={plan.name}
            className={cn(
              "bg-[#16171d] p-8 rounded-3xl border flex flex-col relative overflow-hidden transition-all duration-500",
              plan.current ? "border-primary/50 shadow-2xl shadow-primary/5" : "border-white/[0.03] hover:border-white/10"
            )}
          >
            {plan.current && (
              <div className="absolute top-0 right-0 bg-primary text-black text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl">
                Plan Actual
              </div>
            )}
            
            <h4 className="text-xl font-black text-white uppercase mb-1">{plan.name}</h4>
            <p className="text-gray-500 text-xs mb-6 leading-relaxed">{plan.desc}</p>
            
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-black text-white">{plan.price}</span>
              <span className="text-gray-500 text-sm">/mes</span>
            </div>

            <div className="space-y-4 flex-1 mb-8">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-primary" />
                  </div>
                  <span className="text-xs text-gray-400 font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <button className={cn(
              "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all",
              plan.current 
                ? "bg-white/5 text-primary border border-primary/20 cursor-default" 
                : "btn-primary"
            )}>
              {plan.current ? 'Tu Plan Actual' : 'Cambiar Plan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
