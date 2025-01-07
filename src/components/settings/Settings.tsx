import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cookie, Moon, Globe, Bell, Shield } from 'lucide-react';
import { CookieSettings } from '../CookieConsent/CookieSettings';
import { CookieSettingsContent } from '../CookieConsent/CookieSettingsContent';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SettingsSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const SettingsPlaceholder: React.FC<SettingsSectionProps> = ({ title, description, icon }) => (
  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
      {icon}
    </div>
    <h3 className="text-xl font-orbitron text-white">{title}</h3>
    <p className="text-white/60 max-w-md">{description}</p>
    <span className="px-4 py-2 rounded-full bg-white/5 text-white/40 text-sm">
      Coming Soon
    </span>
  </div>
);

export const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = React.useState<string | null>(null);

  const settingsSections = [
    {
      id: 'cookies',
      name: 'Cookie Settings',
      icon: Cookie,
      description: 'Manage your cookie preferences and privacy settings',
      component: CookieSettings
    },
    {
      id: 'appearance',
      name: 'Appearance',
      icon: Moon,
      description: 'Customize the look and feel of the application',
      comingSoon: true
    },
    {
      id: 'language',
      name: 'Language',
      icon: Globe,
      description: 'Change the application language',
      comingSoon: true
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Bell,
      description: 'Manage your notification preferences',
      comingSoon: true
    },
  ];

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-space-darker border border-white/10 rounded-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-orbitron text-white">Settings</h2>
            <button
            onClick={onClose}
            className="p-2 text-red-500 bg-red-500/10 rounded-lg
                      transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 h-[calc(90vh-5rem)]">
          {/* Navigation Sidebar */}
          <div className="bg-space-black/20 border-r border-white/10 p-4 overflow-y-auto">
            <nav className="space-y-2" role="navigation" aria-label="Settings navigation">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.comingSoon ? null : section.id)}
                  className={`w-full text-left p-4 rounded-lg transition-all relative group
                    focus:outline-none focus:ring-2 focus:ring-white/10
                    ${activeSection === section.id 
                      ? 'bg-gradient-to-r from-blue-500/20 to-blue-500/10 text-white border border-blue-500/20' 
                      : 'hover:bg-white/5 text-white/70 hover:text-white border border-transparent'}`}
                  disabled={section.comingSoon}
                  aria-selected={activeSection === section.id}
                  role="tab"
                >
                  <div className="flex items-center gap-3">
                    <section.icon 
                      className={`w-5 h-5 ${
                        activeSection === section.id ? 'text-blue-400' : 'text-white/60'
                      }`} 
                    />
                    <div>
                      <div className="font-medium">{section.name}</div>
                      <div className="text-sm text-white/40">{section.description}</div>
                    </div>
                  </div>
                  {section.comingSoon && (
                    <span className="absolute right-2 top-2 px-2 py-0.5 rounded-full 
                                   bg-white/5 text-white/40 text-xs">
                      Coming Soon
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="col-span-2 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeSection === 'cookies' ? (
                <motion.div
                  key="cookies"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  <CookieSettingsContent 
                    onSave={() => setActiveSection(null)}
                  />
                </motion.div>
              ) : activeSection ? (
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <SettingsPlaceholder
                    title={settingsSections.find(s => s.id === activeSection)?.name || ''}
                    description={settingsSections.find(s => s.id === activeSection)?.description || ''}
                    icon={React.createElement(
                      settingsSections.find(s => s.id === activeSection)?.icon || 'div',
                      { className: 'w-8 h-8 text-white/40' }
                    )}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex items-center justify-center text-white/40"
                >
                  Select a setting to configure
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};