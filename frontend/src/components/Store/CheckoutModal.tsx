import React, { useState } from 'react';
import { X, User, Phone, MapPin, Building2, ChevronRight, Check, CreditCard, ShoppingBag, MessageCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    customerName: string;
    customerPhone: string;
    shippingAddress: string;
    shippingCity: string;
    paymentMethod: string;
    transactionId: string;
  }) => void;
  total: number;
  theme: {
    primaryColor: string;
    buttonColor: string;
    borderRadius: number;
    storeName?: string;
  };
}

interface InputFieldProps {
  label: string;
  icon: React.ElementType;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  primaryColor: string;
}

const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  icon: Icon, 
  placeholder, 
  value, 
  onChange, 
  type = "text",
  primaryColor
}) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">
      {label}
    </label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary" style={{ color: value ? primaryColor : 'rgba(0,0,0,0.2)' }}>
        <Icon size={18} />
      </div>
      <input 
        type={type} 
        placeholder={placeholder}
        className="w-full pl-12 pr-6 py-4 bg-[#f8f9fa] border border-transparent rounded-2xl text-sm font-bold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-black/5 focus:border-black/5"
        value={value}
        onChange={onChange}
      />
    </div>
  </div>
);

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  total,
  theme 
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    shippingAddress: '',
    shippingCity: '',
    paymentMethod: 'NEQUI',
    transactionId: ''
  });

  if (!isOpen) return null;


  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose} />
      
      <div 
        className="relative w-full max-w-xl bg-white overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-500 flex flex-col"
        style={{ borderRadius: `${theme.borderRadius * 3}px` }}
      >
        {/* Progress Header */}
        <div className="relative h-2 bg-gray-100">
          <div 
            className="h-full transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)"
            style={{ width: `${(step / 2) * 100}%`, backgroundColor: theme.primaryColor }}
          />
        </div>

        {/* Header */}
        <div className="px-10 py-8 flex items-center justify-between border-b border-gray-50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag size={14} style={{ color: theme.primaryColor }} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Finalizar Pedido</span>
            </div>
            <h3 className="text-3xl font-black uppercase tracking-tighter text-[#1a1c23] leading-none">
              {step === 1 ? 'Datos de Envío' : 'Método de Pago'}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-10 space-y-8">
          {step === 1 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InputField 
                  label="Nombre Completo" 
                  icon={User} 
                  placeholder="Ej: Juan Pérez"
                  value={formData.customerName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, customerName: e.target.value})}
                  primaryColor={theme.primaryColor}
                />
                <InputField 
                  label="WhatsApp / Teléfono" 
                  icon={Phone} 
                  placeholder="Ej: 300 123 4567"
                  value={formData.customerPhone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, customerPhone: e.target.value})}
                  primaryColor={theme.primaryColor}
                />
              </div>

              <InputField 
                label="Dirección de Entrega" 
                icon={MapPin} 
                placeholder="Ej: Calle 123 # 45-67, Apto 502"
                value={formData.shippingAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, shippingAddress: e.target.value})}
                primaryColor={theme.primaryColor}
              />

              <InputField 
                label="Ciudad" 
                icon={Building2} 
                placeholder="Ej: Medellín"
                value={formData.shippingCity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, shippingCity: e.target.value})}
                primaryColor={theme.primaryColor}
              />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-3 gap-4">
                {['NEQUI', 'DAVIPLATA', 'TRANSFERENCIA'].map(method => (
                  <button
                    key={method}
                    onClick={() => setFormData({...formData, paymentMethod: method})}
                    className={cn(
                      "group p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 relative",
                      formData.paymentMethod === method 
                        ? "bg-black border-black text-white" 
                        : "border-gray-100 hover:border-gray-300 bg-gray-50/50"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                      formData.paymentMethod === method ? "bg-white/10" : "bg-white shadow-sm"
                    )}>
                      {method === 'TRANSFERENCIA' ? (
                        <Building2 size={20} style={{ color: formData.paymentMethod === method ? '#fff' : theme.primaryColor }} />
                      ) : (
                        <CreditCard size={20} style={{ color: formData.paymentMethod === method ? '#fff' : theme.primaryColor }} />
                      )}
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em]">{method}</span>
                    {formData.paymentMethod === method && (
                      <div className="absolute top-3 right-3 bg-white rounded-full p-1 shadow-lg">
                        <Check size={10} className="text-black" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="bg-[#f8f9fa] rounded-3xl p-8 border border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                      <Check size={16} className="text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Instrucciones</span>
                  </div>
                  <span className="text-xs font-black text-gray-300">#0021</span>
                </div>
                <p className="text-sm font-bold text-[#1a1c23] leading-relaxed">
                  Envía el comprobante por WhatsApp después de confirmar. Si tienes el ID de transacción, ingrésalo debajo.
                </p>
                <input 
                  type="text" 
                  placeholder="ID de Transacción (Opcional)"
                  className="w-full px-6 py-4 bg-white border border-transparent rounded-2xl text-sm font-bold shadow-sm focus:ring-4 focus:ring-black/5 outline-none transition-all"
                  value={formData.transactionId}
                  onChange={e => setFormData({...formData, transactionId: e.target.value})}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-10 bg-gray-50/50 border-t border-gray-100 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 text-gray-500">Resumen del Pedido</span>
            <span className="text-xl font-black tracking-tighter text-[#1a1c23]">
              ${total.toLocaleString()}
            </span>
          </div>

          <button 
            onClick={handleNext}
            disabled={step === 1 && (!formData.customerName || !formData.customerPhone || !formData.shippingAddress || !formData.shippingCity)}
            className="w-full py-6 rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-20 disabled:pointer-events-none"
            style={{ backgroundColor: theme.buttonColor, color: '#ffffff' }}
          >
            {step === 1 ? (
              <>
                <span>Continuar al Pago</span>
                <ChevronRight size={18} />
              </>
            ) : (
              <>
                <MessageCircle size={18} />
                <span>Finalizar por WhatsApp</span>
              </>
            )}
          </button>

          {step === 2 && (
            <button 
              onClick={() => setStep(1)}
              className="w-full text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-colors py-2"
            >
              Volver a Envío
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
