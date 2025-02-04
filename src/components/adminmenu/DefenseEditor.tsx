import React, { useState } from 'react';
import { Squad, Fleet, Character, Ship } from '@/types';
import { UnitSelector } from '../UnitSelector';
import { UnitImage } from '../ui/UnitImage';
import { X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';

interface DefenseEditorProps {
  type: 'squad' | 'fleet';
  initialData?: Squad | Fleet;
  onSave: (defense: Squad | Fleet) => Promise<void>;
  onCancel: () => void;
  availableUnits: (Character | Ship)[];
}

export const DefenseEditor: React.FC<DefenseEditorProps> = ({
  type,
  initialData,
  onSave,
  onCancel,
  availableUnits
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [alignment, setAlignment] = useState(initialData?.alignment || 'light');
  const [showUnitSelector, setShowUnitSelector] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState<(Character | Ship)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);

    try {
      if (!name.trim()) {
        throw new Error('Name is required');
      }

      if (selectedUnits.length === 0) {
        throw new Error('At least one unit is required');
      }

      const defense = type === 'squad'
        ? {
            id: initialData?.id || `squad-${Date.now()}`,
            type: 'squad' as const,
            name: name.trim(),
            alignment,
            leader: selectedUnits[0] as Character,
            characters: selectedUnits.slice(1) as Character[],
          }
        : {
            id: initialData?.id || `fleet-${Date.now()}`,
            type: 'fleet' as const,
            name: name.trim(),
            alignment,
            capitalShip: selectedUnits[0] as Ship,
            startingLineup: selectedUnits.slice(1, 4) as Ship[],
            reinforcements: selectedUnits.slice(4) as Ship[],
          };

      await onSave(defense);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnitSelect = (unit: Character | Ship) => {
    if (!unit) return;

    setSelectedUnits(prev => {
      if (type === 'squad') {
        const character = unit as Character;
        if (prev.length === 0) {
          return [character];
        }
        return [...prev, character];
      }
      
      const ship = unit as Ship;
      if (prev.length === 0) {
        if (!ship.isCapital) {
          setError('First ship must be a capital ship');
          return prev;
        }
        return [ship];
      }
      if (prev.length <= 3) {
        return [...prev, ship];
      }
      if (prev.length <= 6) {
        return [...prev, ship];
      }
      return prev;
    });
    
    setShowUnitSelector(false);
  };

  const getUnitRole = (index: number): string => {
    if (type === 'squad') {
      return index === 0 ? 'Leader' : `Member ${index}`;
    } else {
      if (index === 0) return 'Capital Ship';
      if (index <= 3) return `Starting Ship ${index}`;
      return `Reinforcement ${index - 3}`;
    }
  };

  const getSelectionType = (): 'leader' | 'member' | 'capital' | 'starting' | 'reinforcement' => {
    if (type === 'squad') {
      return selectedUnits.length === 0 ? 'leader' : 'member';
    } else {
      return selectedUnits.length === 0 
        ? 'capital' 
        : selectedUnits.length <= 3 
          ? 'starting' 
          : 'reinforcement';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-space-darker rounded-lg border border-white/10 p-6 max-w-2xl w-full mx-4"
    >
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-xl font-orbitron text-white">
          {initialData ? 'Edit' : 'New'} {type === 'squad' ? 'Squad' : 'Fleet'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          aria-label="Close editor"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400"
        >
          {error}
        </motion.div>
      )}

      <div className="space-y-6">
        {/* Name input */}
        <div>
          <label htmlFor="defense-name" className="block text-sm font-medium text-white mb-2">Name</label>
          <input
            id="defense-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white 
                     focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            placeholder={`Enter ${type} name`}
          />
        </div>

        {/* Alignment selector */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Alignment</label>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setAlignment('light')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg transition-colors ${
                alignment === 'light'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-400/20'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
              aria-pressed={alignment === 'light'}
            >
              Light Side
            </button>
            <button
              onClick={() => setAlignment('dark')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg transition-colors ${
                alignment === 'dark'
                  ? 'bg-red-500/20 text-red-400 border border-red-400/20'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
              aria-pressed={alignment === 'dark'}
            >
              Dark Side
            </button>
          </div>
        </div>

        {/* Units section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="text-sm font-medium text-white">
              {type === 'squad' ? 'Squad Members' : 'Ships'}
            </label>
            <button
              onClick={() => setShowUnitSelector(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 
                       text-blue-400 hover:bg-blue-500/30 transition-colors"
              disabled={type === 'fleet' && selectedUnits.length >= 7}
            >
              <Plus className="w-4 h-4" />
              Add Unit
            </button>
          </div>

          <div className="flex flex-wrap gap-4 min-h-[100px] p-4 bg-white/5 rounded-lg border border-white/10">
            {selectedUnits.map((unit, index) => (
              <div key={unit.id} className="relative group">
                <UnitImage
                  id={unit.id}
                  name={unit.name}
                  type={type === 'squad' 
                    ? (index === 0 ? 'squad-leader' : 'squad-member') 
                    : (index === 0 ? 'capital-ship' : 'ship')}
                  size="md"
                  className="rounded-full border-2 border-blue-500/50"
                  isLeader={type === 'squad' && index === 0}
                  isCapital={type === 'fleet' && index === 0}
                />
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 
                             bg-black/90 px-2 py-1 rounded text-xs text-white whitespace-nowrap 
                             opacity-0 group-hover:opacity-100 transition-opacity">
                  {getUnitRole(index)}
                </div>
                <button
                  onClick={() => {
                    setSelectedUnits(units => units.filter((_, i) => i !== index));
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full 
                           flex items-center justify-center hover:bg-red-600
                           opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove ${unit.name}`}
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {selectedUnits.length === 0 && (
              <div className="w-full text-center text-white/40 py-4">
                No units selected. Click "Add Unit" to begin.
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 
                     transition-colors w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                     w-full sm:w-auto"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Unit Selector Modal */}
      {showUnitSelector && (
        <UnitSelector
          type={type === 'squad' ? 'character' : 'ship'}
          isOpen={showUnitSelector}
          onClose={() => setShowUnitSelector(false)}
          onSelect={handleUnitSelect}
          availableUnits={availableUnits}
          alignment={alignment}
          selectionType={getSelectionType()}
        />
      )}
    </motion.div>
  );
};

export default DefenseEditor;