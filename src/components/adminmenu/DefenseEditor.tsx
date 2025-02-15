import React, { useState, useEffect } from 'react';
import { Squad, Fleet, Character, Ship, ModRequirement } from '@/types';
import { UnitSelector } from '../UnitSelector';
import { UnitImage } from '../ui/UnitImage';
import { X, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { sanitizeInput, sanitizeHTML } from '@/lib/security/Sanitizer';
// import { GlassCard } from '../ui/GlassCard';

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
  // State management
  const [name, setName] = useState(initialData?.name || '');
  const [alignment, setAlignment] = useState(initialData?.alignment || 'light');
  const [selectedUnits, setSelectedUnits] = useState<(Character | Ship)[]>(() => {
    if (!initialData) return [];
    
    if (type === 'squad') {
      const squad = initialData as Squad;
      return [squad.leader, ...squad.characters].filter((unit): unit is Character => unit !== null);
    } else {
      const fleet = initialData as Fleet;
      return [
        fleet.capitalShip,
        ...fleet.startingLineup,
        ...fleet.reinforcements
      ].filter((unit): unit is Ship => unit !== null);
    }
  });
  const [showUnitSelector, setShowUnitSelector] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectorMode, setSelectorMode] = useState<'leader' | 'member' | 'capital' | 'starting' | 'reinforcement'>(
    type === 'squad' ? 'leader' : 'capital'
  );
  const [twOmicron, setTwOmicron] = useState({
    required: type === 'squad' ? (initialData as Squad)?.twOmicronRequired || false : false,
    comment: type === 'squad' ? (initialData as Squad)?.twOmicronComment || '' : ''
  });
  
  const [description, setDescription] = useState(initialData?.description || '');
  // const [modRequirements, setModRequirements] = useState<ModRequirement[]>(
  //   (initialData as Squad)?.modRequirements || []
  // );

  // Update state when initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setAlignment(initialData.alignment);
      
      if (type === 'squad') {
        const squad = initialData as Squad;
        setSelectedUnits([squad.leader, ...squad.characters].filter((unit): unit is Character => unit !== null));
      } else {
        const fleet = initialData as Fleet;
        setSelectedUnits([
          fleet.capitalShip,
          ...fleet.startingLineup,
          ...fleet.reinforcements
        ].filter((unit): unit is Ship => unit !== null));
      }
    }
  }, [initialData, type]);


  // Handle save button with sanitization to prevent XSS-attacks 
  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
  
    try {
      if (!sanitizeInput(name.trim())) {
        throw new Error('Name is required');
      }
  
      if (selectedUnits.length === 0) {
        throw new Error('At least one unit is required');
      }
  
      let defense: Squad | Fleet;
      
      if (type === 'squad') {
        defense = {
          id: initialData?.id || `squad-${Date.now()}`,
          type: 'squad',
          name: sanitizeInput(name.trim()),
          alignment,
          leader: selectedUnits[0] as Character,
          characters: selectedUnits.slice(1) as Character[],
          twOmicronRequired: twOmicron.required,
          twOmicronComment: twOmicron.required ? sanitizeInput(twOmicron.comment) : undefined,
          description: description.trim() ? sanitizeHTML(description.trim()) : undefined,
        } as Squad;
      } else {
        defense = {
          id: initialData?.id || `fleet-${Date.now()}`,
          type: 'fleet',
          name: sanitizeInput(name.trim()),
          alignment,
          capitalShip: selectedUnits[0] as Ship,
          startingLineup: selectedUnits.slice(1, 4) as Ship[],
          reinforcements: selectedUnits.slice(4) as Ship[],
          description: description.trim() ? sanitizeHTML(description.trim()) : undefined
        } as Fleet;
      }
  
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
        if (prev.length === 0) {
          return [unit];
        }
        return [...prev, unit];
      }
      
      const ship = unit as Ship;
      if (prev.length === 0) {
        if (!ship.isCapital) {
          setError('First ship must be a capital ship');
          return prev;
        }
        return [ship];
      }
      return [...prev, ship];
    });
    
    setShowUnitSelector(false);
  };

  // Helper functions for UI
  const getUnitRole = (index: number): string => {
    if (type === 'squad') {
      return index === 0 ? 'Leader' : `Member ${index}`;
    } else {
      if (index === 0) return 'Capital Ship';
      if (index <= 3) return `Starting Ship ${index}`;
      return `Reinforcement ${index - 3}`;
    }
  };

  return (
      <div className="bg-space-darker rounded-lg border border-white/10 p-3 sm:p-6 max-w-2xl w-full mx-2 sm:mx-4 overflow-y-auto max-h-[90vh] sm:max-h-[80vh]">
      {/* Header */}
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

      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400"
        >
          {error}
        </motion.div>
      )}

      {/* Form content */}
      <div className="space-y-6">
        {/* Name input */}
        <div>
          <label htmlFor="defense-name" className="block text-sm font-medium text-white mb-2">
            Name
          </label>
          <input
            id="defense-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-2 sm:px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm sm:text-base"
            placeholder={`Enter ${type} name`}
          />
        </div>

        {/* Alignment selector */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Alignment
          </label>
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

        {/* TW omni, description and mod selector */}
        {type === 'squad' && (
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="twOmicron"
                checked={twOmicron.required}
                onChange={(e) => setTwOmicron(prev => ({...prev, required: e.target.checked}))}
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500"
              />
              <label htmlFor="twOmicron" className="ml-2 text-sm text-white">
                Requires Territory Wars Omicron
              </label>
            </div>
            
            {twOmicron.required && (
              <input
                type="text"
                value={twOmicron.comment}
                onChange={(e) => setTwOmicron(prev => ({...prev, comment: e.target.value}))}
                placeholder="Additional omicron details..."
                className="w-full px-2 sm:px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm sm:text-base"
                />
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            className="w-full px-2 sm:px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm sm:text-base"
            rows={3}
          />
        </div>

      {/* {type === 'squad' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">
            Mod Requirements
          </label>
          {selectedUnits.map((unit, index) => (
            <div key={unit.id} className="p-4 bg-white/5 rounded-lg">
              <h4 className="text-sm font-medium text-white mb-2">{unit.name}</h4>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Set requirements (e.g., Speed +30)"
                  value={modRequirements[index]?.stats?.primary?.join(', ') || ''}
                  onChange={(e) => {
                    const newReqs = [...modRequirements];
                    newReqs[index] = {
                      ...newReqs[index],
                      character: unit.name,
                      stats: {
                        ...newReqs[index]?.stats,
                        primary: e.target.value.split(',').map(s => s.trim())
                      }
                    };
                    setModRequirements(newReqs);
                  }}
                  className="w-full px-2 sm:px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm sm:text-base"
                />
              </div>
            </div>
          ))}
        </div>
      )} */}

        {/* Selected units */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            {type === 'squad' ? 'Squad Members' : 'Ships'}
          </label>
          <div className="flex flex-wrap gap-4">
           {selectedUnits.map((unit, index) => (
              <div key={unit.id} className="relative">
                <UnitImage
                  id={unit.id}
                  name={unit.name}
                  type={type === 'squad' 
                    ? (index === 0 ? 'squad-leader' : 'squad-member')
                    : (index === 0 ? 'capital-ship' : 'ship')}
                  size="md"
                  className={index === 0 ? 'border-2 border-blue-400' : 'border-2 border-white/20'}
                  isLeader={type === 'squad' && index === 0}
                  isCapital={type === 'fleet' && index === 0}
                />
                <div className="absolute -bottom-4 sm:-bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] sm:text-xs bg-black/90 px-1 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap">
                  {getUnitRole(index)}
                </div>
                <button
                  onClick={() => {
                    setSelectedUnits(units => units.filter((_, i) => i !== index));
                  }}
                  className="absolute -top-1 -right-1 w-[20px] h-[20px] bg-red-500 rounded-full 
                          flex items-center justify-center hover:bg-red-600"
                  aria-label="Remove character"
                >
                  <X className="w-[14px] h-[14px] text-white" />
                </button>
              </div>
            ))}

            {/* Add unit button */}
            <button
              onClick={() => {
                setSelectorMode(type === 'squad'
                  ? (selectedUnits.length === 0 ? 'leader' : 'member')
                  : (selectedUnits.length === 0 ? 'capital'
                     : selectedUnits.length <= 3 ? 'starting'
                     : 'reinforcement'));
                setShowUnitSelector(true);
              }}
              className="w-16 h-16 rounded-lg border-2 border-dashed border-white/20 
                     flex items-center justify-center hover:border-white/40"
            >
              <Plus className="w-4 h-4 text-white/40" />
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
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
            {isSaving ? 'Saving...' : (initialData ? 'Update' : 'Save')}
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
          selectionType={selectorMode}
        />
      )}
    </div>
  );
};

export default DefenseEditor;