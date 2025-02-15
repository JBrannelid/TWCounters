import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Ship, Settings, Menu, X, BarChart2, Database, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  onLogout?: () => Promise<void>;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { 
      label: 'Dashboard', 
      icon: <BarChart2 className="w-5 h-5" />, 
      path: '/admin' 
    },
    { 
      label: 'Squads', 
      icon: <Shield className="w-5 h-5" />, 
      path: '/admin/squads' 
    },
    { 
      label: 'Fleets', 
      icon: <Ship className="w-5 h-5" />, 
      path: '/admin/fleets' 
    },
    { 
      label: 'Settings', 
      icon: <Settings className="w-5 h-5" />, 
      path: '/admin/settings' 
    },
    { 
      label: 'Data Manager', 
      icon: <Database className="w-5 h-5" />, 
      path: '/admin/data' 
    },
    { 
      label: 'Sync', 
      icon: <RefreshCw className="w-5 h-5" />, 
      path: '/admin/sync' 
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-space-darker">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-space-black border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="text-xl font-orbitron text-white">Admin Dashboard</h1>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
          >
            Logout
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/10"
            >
              <nav className="p-4">
                {menuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2
                      ${location.pathname === item.path
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 min-h-[calc(100vh-64px)] bg-space-black border-r border-white/10">
          <nav className="sticky top-16 p-4">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2
                  ${location.pathname === item.path
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </div>
    </div>
  );
};