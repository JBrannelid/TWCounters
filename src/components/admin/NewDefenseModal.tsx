// /components/admin/NewDefenseModal.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Shield, Ship as ShipIcon } from 'lucide-react';
import { Squad, Fleet, Character, Ship as ShipType } from '@/types';
import { NewSquadForm } from './NewSquadForm';
import { NewFleetForm } from './NewFleetForm';

interface NewDefenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (defense: Squad | Fleet) => Promise<void>;
  initialType: 'squad' | 'fleet';
  availableUnits: Character[] | ShipType[]; 
}

export const NewDefenseModal: React.FC<NewDefenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialType = 'squad',
  availableUnits,
}) => {
  const [defenseType, setDefenseType] = useState<'squad' | 'fleet'>(initialType);

  if (!isOpen) return null;

  // Hantera sparande ENDAST när användaren explicit väljer att spara
  const handleSave = async (defense: Squad | Fleet) => {
    try {
      await onSave(defense);
      console.log('Defense saved successfully'); // Logga om sparandet lyckas
      onClose(); // Stäng modalen efter att den har sparats
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-full max-w-2xl mx-4 my-8 bg-space-darker rounded-lg border border-white/10"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDefenseType('squad')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                defenseType === 'squad' ? 'bg-blue-500' : 'bg-white/5'
              }`}
            >
              <Shield className="w-4 h-4" />
              Squad
            </button>
            <button
              onClick={() => setDefenseType('fleet')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                defenseType === 'fleet' ? 'bg-blue-500' : 'bg-white/5'
              }`}
            >
              <ShipIcon className="w-4 h-4" />
              Fleet
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg font-titillium"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="p-6">
            {defenseType === 'squad' ? (
              <NewSquadForm 
                onSave={handleSave} 
                onCancel={onClose} 
                availableUnits={availableUnits as Character[]} 
              />
            ) : (
              <NewFleetForm 
                onSave={handleSave} 
                onCancel={onClose} 
                availableUnits={availableUnits as ShipType[]}
              />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};