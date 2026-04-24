import React from 'react';
import { LayoutDashboard, MessageSquare, Bot, ArrowUpRight, BarChart3, Sparkles } from 'lucide-react';
import { useInstanceStore } from '../store/useInstanceStore';

export const Dashboard: React.FC = () => {
  const { instances } = useInstanceStore();

  const stats = [
    { label: 'Mensajes (Mes)', value: '0', trend: '+0%', icon: MessageSquare, color: 'text-primary' },
    { label: 'Instancias Activas', value: instances.length.toString(), trend: 'Plan Pro', icon: LayoutDashboard, color: 'text-secondary' },
    { label: 'Conversaciones IA', value: '0', trend: 'OpenAI Synced', icon: Bot, color: 'text-accent' },
  ];

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Dashboard</h2>
        <p className="text-gray-400 text-sm">Resumen general de tu actividad y métricas de plataforma.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[#16171d] p-6 rounded-2xl border border-white/[0.03] relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-white/5 rounded-xl">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className="text-[9px] font-black tracking-widest text-primary bg-primary/10 px-2 py-1 rounded-full uppercase">
                {stat.trend}
              </span>
            </div>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-white">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-[#16171d] p-10 rounded-2xl border border-white/[0.03] text-center flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Rendimiento Detallado</h3>
            <p className="text-gray-500 text-sm max-w-sm">
              Las métricas detalladas y el análisis de tokens estarán disponibles próximamente.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary/10 to-transparent p-6 rounded-2xl border border-primary/10">
            <Sparkles className="w-6 h-6 text-primary mb-4" />
            <h4 className="text-lg font-bold mb-2">Tip de Optimización</h4>
            <p className="text-gray-400 text-xs leading-relaxed mb-4">
              Conecta un motor de IA para automatizar tus respuestas y mejorar la retención de clientes.
            </p>
            <button className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
              Configurar <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
