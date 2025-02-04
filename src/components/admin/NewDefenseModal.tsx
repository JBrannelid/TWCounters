import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Shield, Ship as ShipIcon, Plus } from 'lucide-react';
import { Squad, Fleet, Character, Ship } from '@/types';
import { NewSquadForm } from './NewSquadForm';
import { NewFleetForm } from './NewFleetForm';
import { GlassCard } from '../ui/GlassCard';

interface NewDefenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (defense: Squad | Fleet) => Promise<void>;
  initialType: 'squad' | 'fleet';
  availableUnits: Character[] | Ship[];
}

export const NewDefenseModal: React.FC<NewDefenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialType = 'squad',
  availableUnits,
}) => {
  const [defenseType, setDefenseType] = useState<'squad' | 'fleet'>(initialType);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (defense: Squad | Fleet) => {
    setIsLoading(true);
    setError(null);
    try {
      await onSave(defense);
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      setError(error instanceof Error ? error.message : 'Failed to save defense');
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
        className="w-full max-w-2xl"
        onClick={e => e.stopPropagation()}
      >
        <GlassCard
          variant="darker"
          className="overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDefenseType('squad')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  defenseType === 'squad' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4" />
                Squad
              </button>
              <button
                onClick={() => setDefenseType('fleet')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  defenseType === 'fleet' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <ShipIcon className="w-4 h-4" />
                Fleet
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-4 bg-red-500/10 border-b border-red-500/20">
              <div className="flex items-center gap-2 text-red-400">
                <span className="text-sm">{error}</span>
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto p-1 hover:bg-red-400/10 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Form Content */}
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="space-y-6">
              {defenseType === 'squad' ? (
                <NewSquadForm 
                  onSave={handleSave} 
                  onCancel={onClose} 
                  availableUnits={availableUnits as Character[]}
                  isLoading={isLoading}
                />
              ) : (
                <NewFleetForm 
                  onSave={handleSave} 
                  onCancel={onClose} 
                  availableUnits={availableUnits as Ship[]}
                  isLoading={isLoading}
                />
              )}
            </div>
          </div>

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-space-darker/50 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-white/60">Saving...</span>
              </div>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};