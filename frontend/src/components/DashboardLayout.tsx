import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

import { useInstanceStore } from '../store/useInstanceStore';

export const DashboardLayout: React.FC = () => {
  const { fetchInstances } = useInstanceStore();

  React.useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  return (
    <div className="theme-shell min-h-screen flex">
      <Sidebar />
      {/* ml-64 offsets the fixed sidebar (w-64) */}
      <div className="ml-64 flex flex-col flex-1 min-h-screen min-w-0">
        <Header />
        <main className="flex-1 p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
