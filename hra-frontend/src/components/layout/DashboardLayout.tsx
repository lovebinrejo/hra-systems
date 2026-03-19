import React from 'react';
import { Outlet } from 'react-router-dom';
import { clsx } from 'clsx';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import HRChatbot from '../ui/HRChatbot';
import { useAppDispatch, useAppSelector } from '../../store';
import { setSidebarOpen } from '../../store/uiSlice';

export const DashboardLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => dispatch(setSidebarOpen(false))}
        />
      )}

      {/* Sidebar - desktop always visible, mobile slide in */}
      <div className={clsx(
        'fixed lg:static inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300',
        'lg:transform-none',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
        <Sidebar onClose={() => dispatch(setSidebarOpen(false))} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-0">
          <Outlet />
        </main>
      </div>

      {/* AI HR Chatbot */}
      <HRChatbot />
    </div>
  );
};
