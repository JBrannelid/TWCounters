import React from 'react';
import { motion } from 'framer-motion';

interface SettingsPanelProps {
  onClose: () => void;
  onSave: (settings: { users: any[] }) => void; // Uppdaterad typ
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-space-darker w-full max-w-2xl rounded-lg border border-white/10"
      >
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Admin Settings</h2>
          <button
            onClick={onClose}
            className="p-2 text-green-500 hover:text-green-100 hover:bg-green-500 rounded-lg"
            >
            Tillbaka
          </button>
        </div>
        <div className="p-6">
          <p className="text-white/60">Här var det tom. Funktionen är för närvarande inaktiverad men kan användas i framtiden.</p>
        </div>
      </motion.div>
    </motion.div>
  );
};
