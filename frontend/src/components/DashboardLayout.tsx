import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

import { useInstanceStore } from '../store/useInstanceStore';

export const DashboardLayout: React.FC = () => {
  const { fetchInstances } = useInstanceStore();
  const location = useLocation();
  const isBuilder = location.pathname === '/appearance/builder' || location.pathname === '/appearance/avri';

  React.useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  return (
    <div className="theme-shell min-h-screen flex">
      {!isBuilder && <Sidebar />}
      
      <div className={`${isBuilder ? 'w-full' : 'ml-64'} flex flex-col flex-1 min-h-screen min-w-0 transition-all duration-500`}>
        {!isBuilder && <Header />}
        <main className={`flex-1 ${isBuilder ? 'p-0' : 'p-8'} animate-in fade-in slide-in-from-bottom-4 duration-700`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
