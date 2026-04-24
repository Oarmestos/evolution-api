import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import { Channels } from './pages/Channels';
import { AIAgents } from './pages/AIAgents';
import { Billing } from './pages/Billing';
import { Flows } from './pages/Flows';
import { DevTools } from './pages/DevTools';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Landing } from './pages/Landing';
import { useAuthStore } from './store/useAuthStore';
import { useEffect } from 'react';

function App() {
  const { init } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rutas Privadas (Dashboard) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/channels" element={<Channels />} />
            <Route path="/ai" element={<AIAgents />} />
            <Route path="/flows" element={<Flows />} />
            <Route path="/dev" element={<DevTools />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Redirección por defecto */}
        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to={localStorage.getItem('avri_token') ? "/dashboard" : "/"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
