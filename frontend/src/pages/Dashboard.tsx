import React, { useEffect } from 'react';
import { LayoutDashboard, MessageSquare, ArrowUpRight, BarChart3, Sparkles, DollarSign, Users } from 'lucide-react';
import { useInstanceStore } from '../store/useInstanceStore';
import { useStatisticsStore } from '../store/useStatisticsStore';

export const Dashboard: React.FC = () => {
  const { instances } = useInstanceStore();
  const { stats, loading, fetchStats } = useStatisticsStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statsList = [
    { 
      label: 'Mensajes Enviados', 
      value: (Number(stats?.totalMessages) || 0).toLocaleString(), 
      trend: stats?.period === 'month' ? 'Este Mes' : 'Total', 
      icon: MessageSquare, 
      color: 'text-primary' 
    },
    { 
      label: 'Ventas Totales', 
      value: `$${(Number(stats?.totalSales) || 0).toLocaleString()}`, 
      trend: 'Pagados', 
      icon: DollarSign, 
      color: 'text-green-500' 
    },
    { 
      label: 'Leads Activos', 
      value: (Number(stats?.totalLeads) || 0).toLocaleString(), 
      trend: 'Funnel CRM', 
      icon: Users, 
      color: 'text-accent' 
    },
    { 
      label: 'Instancias Activas', 
      value: (instances?.length || 0).toString(), 
      trend: 'Plan Pro', 
      icon: LayoutDashboard, 
      color: 'text-secondary' 
    },
  ];

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">Dashboard</h2>
          <p className="text-gray-400 text-sm">Resumen general de tu actividad y métricas de plataforma.</p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest animate-pulse">
            Sincronizando datos...
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsList.map((stat, i) => (
          <div key={i} className="bg-[#16171d] p-6 rounded-2xl border border-white/[0.03] relative overflow-hidden group hover:border-primary/20 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-white/5 rounded-xl group-hover:bg-primary/10 transition-colors">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className="text-[9px] font-black tracking-widest text-primary bg-primary/10 px-2 py-1 rounded-full uppercase">
                {stat.trend}
              </span>
            </div>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-white">{loading ? '...' : stat.value}</h3>
            
            {/* Subtle progress bar aesthetic */}
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#16171d] p-10 rounded-2xl border border-white/[0.03] text-center flex flex-col items-center justify-center min-h-[350px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(99,102,241,0.05),transparent_50%)]" />
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 relative z-10">
              <BarChart3 className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 relative z-10">Rendimiento Detallado</h3>
            <p className="text-gray-500 text-sm max-w-sm relative z-10">
              Las métricas detalladas por instancia y el análisis de conversión de ventas estarán disponibles próximamente.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary/10 to-transparent p-6 rounded-2xl border border-primary/10 relative group cursor-pointer">
            <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-100 transition-opacity">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h4 className="text-lg font-bold mb-2">Tip de Optimización</h4>
            <p className="text-gray-400 text-xs leading-relaxed mb-4">
              Conecta un motor de IA para automatizar tus respuestas y mejorar la retención de clientes.
            </p>
            <button className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
              Configurar <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-[#16171d] p-6 rounded-2xl border border-white/[0.03]">
             <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Accesos Rápidos</h4>
             <div className="space-y-2">
                {['Instancias', 'ChatHub', 'Productos'].map((item) => (
                  <button key={item} className="w-full text-left p-3 rounded-xl hover:bg-white/5 text-gray-300 text-sm font-medium transition-colors border border-transparent hover:border-white/5">
                    Ir a {item}
                  </button>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
