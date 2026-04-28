import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const DashboardLayout: React.FC = () => {
  return (
    <div className="theme-shell min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="ml-64 p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
