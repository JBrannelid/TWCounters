import React, { useState } from 'react';
import { Settings as SettingsIcon, LogOut, Mail, LogIn } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import ContactModal from './ContactModal';
import { Settings } from './settings/Settings';

interface HeaderProps {
  isAdmin: boolean;
  onLogout: () => void;
  onAdminClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAdmin,
  onLogout,
  onAdminClick
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="sticky top-0 z-50 w-full">
      <GlassCard variant="darker">
        <div className="w-full max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={() => setShowSettings(true)}
              className="header-button bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
              aria-label="Settings"
            >
              <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            
            <button
              onClick={() => setShowModal(true)}
              className="header-button bg-purple-500/20 hover:bg-purple-500/30 text-purple-400"
              aria-label="Contact Us"
            >
              <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Contact</span>
            </button>

            {!isAdmin ? (
              <button
                onClick={onAdminClick}
                className="header-button bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 
                         transition-colors duration-200"
                aria-label="Login"
              >
                <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Log in</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onAdminClick}
                  className="header-button bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
                  aria-label="Admin Settings"
                >
                  <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Admin</span>
                </button>
                <button
                  onClick={onLogout}
                  className="header-button bg-red-500/20 hover:bg-red-500/30 text-red-400"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
      <ContactModal isOpen={showModal} onClose={() => setShowModal(false)} />
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};