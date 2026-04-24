import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../utils/cn';
import { useAuthStore } from '../store/useAuthStore';

export const Landing: React.FC = () => {
  const token = useAuthStore((state) => state.token);

  return (
    <div className="min-h-screen bg-avri-gradient overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-dark/80 backdrop-blur-xl border-b border-white/5 px-[5%] py-4 flex justify-between items-center">
        <div className="text-2xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-widest uppercase">
          Avri
        </div>
        <div className="hidden md:flex gap-8 items-center text-sm font-medium text-gray-400">
          <a href="#features" className="hover:text-primary transition-colors">Características</a>
          <a href="#pricing" className="hover:text-primary transition-colors">Precios</a>
          <a href="#" className="hover:text-primary transition-colors">Docs</a>
        </div>
        <div className="flex gap-6 items-center">
          {token ? (
            <Link to="/dashboard" className="btn-primary py-2.5 px-6 text-sm">Ir al Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-bold text-white hover:text-primary transition-colors">Login</Link>
              <Link to="/register" className="btn-primary py-2.5 px-6 text-sm">Empezar Gratis</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="h-screen flex flex-col justify-center items-center text-center p-4">
        <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
          Comunícate. <br />
          Automatiza. <span className="text-primary">Escala.</span>
        </h1>
        <p className="text-gray-400 text-xl max-w-2xl mb-12 leading-relaxed">
          La infraestructura definitiva para potenciar tu marketing en WhatsApp. 
          Multi-agente, bots con IA y automatización sin límites en un solo SaaS.
        </p>
        <Link to={token ? "/dashboard" : "/register"} className="btn-primary py-4 px-10 text-lg">
          {token ? "Ir a mi Panel" : "Crear mi cuenta ahora"}
        </Link>
      </section>

      {/* Quick Stats / Features */}
      <section id="features" className="py-32 px-[8%]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: '📱', title: 'Multi-Instancia', desc: 'Gestiona múltiples números desde un panel centralizado.' },
            { icon: '🤖', title: 'IA Integrada', desc: 'Bots con GPT-4 entrenados con tu conocimiento.' },
            { icon: '📊', title: 'Métricas Real-time', desc: 'Analiza el rendimiento de cada conversación.' }
          ].map((f, i) => (
            <div key={i} className="glass-card p-10 group hover:border-primary/30 transition-all">
              <span className="text-5xl block mb-6">{f.icon}</span>
              <h3 className="text-2xl font-bold text-primary mb-4">{f.title}</h3>
              <p className="text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-[8%] bg-white/[0.02]">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-5xl font-black mb-6">Planes Flexibles</h2>
          <p className="text-gray-500 text-lg">Escoge el plan que mejor se adapte a tu volumen de negocio.</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-8">
          {[
            { name: 'Starter', price: '$0', features: ['1 Instancia', 'QR Estable', 'Mensajería Ilimitada', 'Soporte Ticket'], featured: false },
            { name: 'Pro', price: '$29', features: ['5 Instancias', 'Agentes IA', 'Webhooks Avanzados', 'Soporte 24/7'], featured: true },
            { name: 'Enterprise', price: '$99', features: ['20 Instancias', 'Marca Blanca', 'API Custom', 'Account Manager'], featured: false }
          ].map((p, i) => (
            <div key={i} className={cn(
              "glass-card p-12 w-full max-w-[380px] text-center flex flex-col",
              p.featured && "border-primary border-2 scale-105 bg-secondary/10"
            )}>
              <h3 className="text-xl font-bold mb-4">{p.name}</h3>
              <div className="text-5xl font-black mb-8">
                {p.price}<span className="text-sm text-gray-500 font-normal">/mes</span>
              </div>
              <ul className="space-y-4 mb-10 text-gray-400 text-sm text-left flex-1">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3">
                    <span className="text-primary">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className={cn(
                "w-full py-4 rounded-full font-bold transition-all",
                p.featured ? "btn-primary" : "btn-outline"
              )}>
                {p.name === 'Enterprise' ? 'Contactar Ventas' : 'Empezar ahora'}
              </Link>
            </div>
          ))}
        </div>
      </section>
      <footer className="bg-[#050507] py-24 px-[8%] border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="space-y-6">
            <div className="text-2xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-widest uppercase">
              Avri
            </div>
            <p className="text-gray-500 leading-relaxed text-sm">
              La plataforma líder en automatización de WhatsApp para empresas que buscan escala y eficiencia.
            </p>
          </div>
          
          <div>
            <h4 className="text-primary font-bold mb-6">Producto</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#features" className="hover:text-white transition-colors">Características</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Precios</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-primary font-bold mb-6">Soporte</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-white transition-colors">Centro de Ayuda</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Estado del Sistema</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-primary font-bold mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Términos de Uso</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-10 border-t border-white/5 text-center text-gray-600 text-sm">
          &copy; 2026 Avri Platform. Desarrollado con ❤️ para el mundo.
        </div>
      </footer>
    </div>
  );
};
