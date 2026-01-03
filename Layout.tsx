
import React from 'react';
import { User, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-600 text-white p-2 rounded-lg">
            <i className="fas fa-horse-head"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Mustang Stride</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Research Platform</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">
              {user.role} {user.section !== 'N/A' && `• ${user.section}`}
            </p>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center space-x-2 text-gray-500 hover:text-red-600 transition-colors text-sm font-medium"
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
      
      <footer className="bg-white border-t border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-xs">
          &copy; 2024 Mustang Stride Platform. Built for Section Efficiency Studies.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
