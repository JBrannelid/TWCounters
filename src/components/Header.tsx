import React, { useState } from 'react';
import { Star, Settings, LogOut, Coffee, Mail } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import ContactModal from './ContactModal';

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

  return (
    <div>
      <GlassCard variant="darker" className="sticky top-0 z-50 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* <Star className="w-6 h-6 text-yellow-400" /> */}
            </div>
            
            <div className="flex items-center gap-2">
              <a
                href="https://www.buymeacoffee.com/jbrannelid"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FFDD00] hover:bg-[#FFDD00]/90 text-black transition-all"
              >
                <Coffee className="w-5 h-5" />
              </a>

              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 transition-all"
              >
                <Mail className="w-5 h-5" />
                Contact
              </button>

              {!isAdmin ? (
                <button
                  onClick={onAdminClick}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-all"
                >
                  <Settings className="w-5 h-5" />
                  Admin
                </button>
              ) : (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
      <ContactModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
};