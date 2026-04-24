import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Modal } from '../components/Modal';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [isRecoverySent, setIsRecoverySent] = useState(false);
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <div className="min-h-screen bg-avri-gradient flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-widest uppercase mb-2">
            Avri
          </h1>
          <p className="text-gray-400">Bienvenido de nuevo. Inicia sesión para continuar.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Contraseña</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="flex justify-end px-1">
              <button 
                type="button" 
                className="text-[11px] text-primary hover:text-white transition-colors font-semibold uppercase tracking-wider"
                onClick={() => setIsForgotModalOpen(true)}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Iniciando sesión...
              </>
            ) : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-400 text-sm">
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className="text-primary hover:underline font-bold">
            Regístrate gratis
          </Link>
        </p>
      </div>

      <Modal 
        isOpen={isForgotModalOpen} 
        onClose={() => {
          setIsForgotModalOpen(false);
          setIsRecoverySent(false);
        }} 
        title="Recuperar Contraseña"
      >
        {!isRecoverySent ? (
          <div className="space-y-6">
            <p className="text-gray-400 text-sm leading-relaxed">
              Introduce tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Email de recuperación</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input 
                  type="email" 
                  required
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary/50 transition-all"
                />
              </div>
            </div>
            <button 
              onClick={() => setIsRecoverySent(true)}
              disabled={!recoveryEmail}
              className="w-full btn-primary py-4 disabled:opacity-50"
            >
              Enviar instrucciones
            </button>
          </div>
        ) : (
          <div className="text-center py-8 space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold">¡Correo enviado!</h3>
            <p className="text-gray-400">
              Hemos enviado un enlace de recuperación a <span className="text-white font-bold">{recoveryEmail}</span>. 
              Por favor, revisa tu bandeja de entrada y la carpeta de spam.
            </p>
            <button 
              onClick={() => setIsForgotModalOpen(false)}
              className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all"
            >
              Entendido
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};
