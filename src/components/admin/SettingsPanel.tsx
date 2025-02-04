import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Users, Shield, Database, Cloud } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

interface SettingsPanelProps {
  onClose: () => void;
  onSave: (settings: any) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'permissions', label: 'Permissions', icon: Shield },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'sync', label: 'Sync Settings', icon: Cloud },
  ];

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave({});
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-4xl"
        onClick={e => e.stopPropagation()}
      >
        <GlassCard
          variant="darker"
          className="overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-white/10">
            <h2 className="text-xl font-orbitron text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Admin Settings
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex min-h-[500px]">
            {/* Sidebar */}
            <div className="w-64 border-r border-white/10 p-4">
              <nav className="space-y-2">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2 rounded-lg
                        transition-colors text-left
                        ${activeTab === tab.id
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="h-full"
                >
                  {activeTab === 'general' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Site Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                          placeholder="Enter site name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Description
                        </label>
                        <textarea
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white h-24 resize-none"
                          placeholder="Enter site description"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'users' && (
                    <div className="text-white/60">
                      User management settings will appear here
                    </div>
                  )}

                  {/* Add more tab content as needed */}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};