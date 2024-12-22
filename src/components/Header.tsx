import React, { useState } from 'react';
import { Settings, LogOut, Mail } from 'lucide-react';
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
    <div className="sticky top-0 z-50">
      <GlassCard variant="darker" className="py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-end items-center gap-4">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 
                       rounded-lg bg-purple-500/20 hover:bg-purple-500/30 
                       text-purple-400 transition-all min-w-[120px]"
            >
              <Mail className="w-5 h-5" />
              <span>Contact</span>
            </button>

            {!isAdmin ? (
              <button
                onClick={onAdminClick}
                className="flex items-center justify-center gap-2 px-4 py-2 
                         rounded-lg bg-blue-500/20 hover:bg-blue-500/30 
                         text-blue-400 transition-all min-w-[120px]"
              >
                <Settings className="w-5 h-5" />
                <span>Admin</span>
              </button>
            ) : (
              <button
                onClick={onLogout}
                className="flex items-center justify-center gap-2 px-4 py-2 
                         rounded-lg bg-red-500/20 hover:bg-red-500/30 
                         text-red-400 transition-all min-w-[120px]"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </GlassCard>
      <ContactModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
};