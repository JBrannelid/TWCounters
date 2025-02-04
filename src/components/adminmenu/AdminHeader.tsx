import React from 'react';
import { LogOut, Settings } from 'lucide-react';

interface AdminHeaderProps {
  onLogout: () => Promise<void>;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onLogout }) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {/* Add settings handler */}}
        className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg"
        aria-label="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>
      <button
        onClick={onLogout}
        className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
        aria-label="Log out"
      >
        <LogOut className="w-5 h-5" />
        <span className="hidden md:inline">Log out</span>
      </button>
    </div>
  );
};

export default AdminHeader;