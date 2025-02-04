import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Users, Ship, Database, Cloud, Shield, 
  Settings, Menu, X, LogOut, Plus 
} from 'lucide-react';
import { GlassCard } from '../../ui/GlassCard';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onNewClick: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  currentTab,
  onTabChange,
  onLogout,
  onNewClick
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const tabs = [
    { id: 'squads', label: 'Squads', icon: Users },
    { id: 'fleets', label: 'Fleets', icon: Ship },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'sync', label: 'Sync', icon: Cloud },
    { id: 'permissions', label: 'Permissions', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const showNewButton = currentTab === 'squads' || currentTab === 'fleets';

  return (
    <div className="min-h-screen bg-space-darker">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 md:hidden">
        <GlassCard variant="darker">
          <div className="p-4 flex justify-between items-center">
            <h1 className="text-xl font-orbitron text-white">Admin Dashboard</h1>
            <div className="flex items-center gap-2">
              {showNewButton && (
                <button
                  onClick={onNewClick}
                  className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg"
                  aria-label={`Add new ${currentTab.slice(0, -1)}`}
                >
                  <Plus className="w-6 h-6" />
                </button>
              )}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-white/60 hover:text-white rounded-lg"
                aria-label="Toggle menu"
              >
                {showMobileMenu ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <AnimatePresence>
          {(showMobileMenu || window.innerWidth >= 768) && (
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className={`
                fixed md:relative 
                left-0 top-[64px] md:top-0 
                h-[calc(100vh-64px)] md:min-h-screen
                w-[280px] z-40 
                bg-space-darker md:bg-transparent
                border-r border-white/10
                transform transition-transform duration-300
                ${showMobileMenu ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
              `}
            >
              <div className="w-full h-full overflow-y-auto">
                <div className="p-6">
                  {/* Desktop Header */}
                  <div className="hidden md:flex items-center justify-between mb-8">
                    <h2 className="text-xl font-orbitron text-white">
                      Admin Controls
                    </h2>
                    {showNewButton && (
                      <button
                        onClick={onNewClick}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg
                                bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      >
                        <Plus className="w-4 h-4" />
                        Add {currentTab.slice(0, -1)}
                      </button>
                    )}
                  </div>

                  {/* Navigation */}
                  <nav className="space-y-2">
                    {tabs.map(tab => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            onTabChange(tab.id);
                            setShowMobileMenu(false);
                          }}
                          className={`
                            w-full flex items-center gap-2 px-4 py-3 rounded-lg
                            transition-colors text-left
                            ${currentTab === tab.id
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'text-white/60 hover:bg-white/5 hover:text-white'
                            }
                          `}
                        >
                          <Icon className="w-5 h-5" />
                          {tab.label}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 mt-4
                               text-red-400 hover:bg-red-500/20 rounded-lg 
                               transition-colors text-left"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </nav>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 md:overflow-hidden">
          <div className="h-full p-4 md:p-6">
            {/* Breadcrumb - Desktop Only */}
            <div className="hidden md:flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <span>Admin</span>
                <span>/</span>
                <span className="text-white">
                  {tabs.find(t => t.id === currentTab)?.label}
                </span>
              </div>
            </div>

            {/* Content with Animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;