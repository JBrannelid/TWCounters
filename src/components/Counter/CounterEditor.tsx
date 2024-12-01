// src/components/counter/CounterEditor.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Counter, Squad, Fleet, Character, Ship } from '@/types';
import { UnitSelector } from '../UnitSelector';
import { UnitImage } from '../ui/UnitImage';
import { VideoGuide } from '../VideoGuide';
import ErrorBoundary from '../ErrorBoundary';

interface CounterEditorProps {
  isOpen: boolean;
  onClose: () => void;
  targetDefense: Squad | Fleet;
  onSave: (counter: Counter) => Promise<void>;
  onDelete?: (counterId: string) => Promise<void>;
  availableUnits: (Character | Ship)[];
  existingCounter?: Counter | null;
  isFleet: boolean;
}

interface ModRequirement {
  character: string;
  description: string;
}

interface TWOmicronData {
  required: boolean;
  comment: string;
}

export const CounterEditor: React.FC<CounterEditorProps> = ({
  isOpen,
  onClose,
  targetDefense,
  onSave,
  onDelete,
  availableUnits,
  existingCounter,
  isFleet
}) => {
  const [selectedUnits, setSelectedUnits] = useState<(Character | Ship)[]>(() => {
    if (!existingCounter) return [];
    
    if (!isFleet) {
      const squad = existingCounter.counterSquad as Squad;
      // Ensure squad.characters is defined and iterable
      return [squad.leader, ...(squad.characters || [])].filter((unit): unit is Character => unit !== null);
    } else {
      const fleet = existingCounter.counterSquad as Fleet;
      return [
        fleet.capitalShip,
        ...fleet.startingLineup,
        ...fleet.reinforcements
      ].filter((unit): unit is Ship => unit !== null);
    }
  });

  const [counterType, setCounterType] = useState<'hard' | 'soft' | 'risky'>(
    existingCounter?.counterType || 'hard'
  );
  const [description, setDescription] = useState(existingCounter?.description || '');
  const [error, setError] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [saving, setSaving] = useState(false);
  const [twOmicron, setTwOmicron] = useState<TWOmicronData>({
    required: existingCounter?.twOmicronRequired || false,
    comment: existingCounter?.twOmicronComment || ''
  });
  const [videoUrl, setVideoUrl] = useState(existingCounter?.video_url || '');
  const [datacronRequired, setDatacronRequired] = useState(existingCounter?.datacronRequired || null);
  const [modRequirements, setModRequirements] = useState<ModRequirement[]>(
    existingCounter?.requirements
      ?.filter(req => req.type === 'mods')
      .map(req => {
        const [character, ...descParts] = req.description.split(':');
        return {
          character: character.trim(),
          description: descParts.join(':').trim()
        };
      }) || []
  );

  // Add logging when props change
  useEffect(() => {
    console.log('CounterEditor received props:', {
      targetDefenseType: targetDefense.type,
      targetDefenseName: targetDefense.name,
      availableUnitsCount: availableUnits.length,
      hasExistingCounter: !!existingCounter,
      isFleet
    });
  }, [targetDefense, availableUnits, existingCounter, isFleet]);

  useEffect(() => {
    if (existingCounter) {
      setCounterType(existingCounter.counterType);
      setDescription(existingCounter.description);
      // Reset selected units based on existing counter
      if (existingCounter.counterSquad.type === 'squad') {
        const squad = existingCounter.counterSquad as Squad;
        setSelectedUnits([squad.leader, ...squad.characters].filter((unit): unit is Character => unit !== null));
      } else {
        const fleet = existingCounter.counterSquad as Fleet;
        setSelectedUnits([
          fleet.capitalShip,
          ...fleet.startingLineup,
          ...fleet.reinforcements
        ].filter((unit): unit is Ship => unit !== null));
      }
    }
  }, [existingCounter]);

  const handleSave = async () => {
    if (!navigator.onLine) {
      setError('Cannot save while offline');
      return;
    }
  
    try {
      setSaving(true);
      
      if (selectedUnits.length === 0) {
        setError('Please select counter units');
        return;
      }
  
      let counterData: Counter;  // Deklarera variabeln här
      
      const baseCounter = {
        id: existingCounter?.id || `counter-${Date.now()}`,
        counterType,
        description: description.trim(),
        video_url: videoUrl || undefined,
        strategy: existingCounter?.strategy || []
      };
  
      if (isFleet) {
        const fleetUnits = selectedUnits as Ship[];
        
        // Use the validateFleetUnits function
        const validationError = validateFleetUnits(fleetUnits);
        if (validationError) {
          setError(validationError);
          return;
        }
  
        counterData = {
          ...baseCounter,
          targetSquad: targetDefense as Fleet,
          counterSquad: {
            id: `fleet-${Date.now()}`,
            type: 'fleet',
            name: `Counter for ${targetDefense.name}`,
            alignment: targetDefense.alignment,
            capitalShip: fleetUnits[0],
            startingLineup: fleetUnits.slice(1, 4),
            reinforcements: fleetUnits.slice(4),
          } as Fleet,
          requirements: []
        };
      } else {
        // Squad counter logik
        counterData = {
          ...baseCounter,
          targetSquad: targetDefense as Squad,
          counterSquad: {
            id: `squad-${Date.now()}`,
            type: 'squad',
            name: `Counter for ${targetDefense.name}`,
            alignment: targetDefense.alignment,
            leader: selectedUnits[0] as Character,
            characters: selectedUnits.slice(1) as Character[],
          } as Squad,
          twOmicronRequired: twOmicron.required,
          twOmicronComment: twOmicron.comment,
          datacronRequired: datacronRequired?.level ? datacronRequired : undefined,
          requirements: modRequirements.map(mod => ({
            type: 'mods' as const,
            description: `${mod.character}: ${mod.description}`,
            priority: 'required' as const
          }))
        };
      }
  
      await onSave(counterData);
      onClose();
    } catch (error) {
      console.error('Error saving counter:', error);
      setError(error instanceof Error ? error.message : 'Failed to save counter');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingCounter || !onDelete) return;
    
    if (!navigator.onLine) {
      setError('Cannot delete while offline');
      return;
    }

    try {
      setSaving(true);
      await onDelete(existingCounter.id);
      onClose();
    } catch (error) {
      console.error('Error deleting counter:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete counter');
    } finally {
      setSaving(false);
    }
  };

  // Add the getShipRole function
  const getShipRole = (index: number): string => {
    if (index === 0) return 'Capital Ship';
    if (index >= 1 && index <= 3) return `Starting Ship ${index}`;
    return `Reinforcement ${index - 3}`;
  };

  // Add validation for fleet-specific rules
  const validateFleetUnits = (units: Ship[]) => {
    if (units.length === 0) return 'At least one ship is required';
    if (!units[0].isCapital) return 'First ship must be a capital ship';
    if (units.length > 7) return 'Maximum of 7 ships allowed';
    return null;
  };

  return (
    <ErrorBoundary 
      fallback={
        <div className="p-6 bg-red-500/10 rounded-lg border border-red-500/20">
          <h3 className="text-lg font-medium text-red-400 mb-2">
            Counter Editor Error
          </h3>
          <p className="text-sm text-red-400/80 mb-4">
            An error occurred while editing the counter.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/10 text-white 
                       hover:bg-white/20"
            >
              Close
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg 
                       bg-red-500/20 text-red-400 hover:bg-red-500/30"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 overflow-y-auto ${!isOpen && 'pointer-events-none'}`}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="min-h-screen flex items-start justify-center py-8">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-2xl mx-4 bg-space-darker rounded-lg border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-space-darker border-b border-white/10 p-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-medium text-white">
                  {existingCounter ? 'Edit Counter' : 'Add Counter'}
                </h2>
                <button onClick={onClose} className="p-2 text-white/60 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="max-h-[calc(100vh-theme(spacing.32))] overflow-y-auto custom-scrollbar">
              <div className="p-6 space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Counter Type Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Counter Type</label>
                  <div className="flex gap-3">
                    {(['hard', 'soft', 'risky'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setCounterType(type)}
                        className={`px-4 py-2 rounded-lg capitalize ${
                          counterType === type
                            ? type === 'hard'
                              ? 'bg-green-500/20 text-green-400'
                              : type === 'soft'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                            : 'bg-white/5 text-white/60'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Counter Units */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-white">Counter Units</label>
                    <button
                      onClick={() => setShowSelector(true)}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      + Add Unit
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-4">
  {selectedUnits.filter(unit => unit && unit.id).map((unit, index) => (
    <div key={unit.id} className="relative">
      <UnitImage
        id={unit.id}
        name={unit.name}
        type={targetDefense.type === 'squad' ? 'squad-member' : 'ship'}
        size="md"
        className={`${index === 0 && isFleet ? 'border-2 border-blue-400' : ''}`}
      />
      {isFleet && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black/90 px-2 py-1 rounded text-xs text-white whitespace-nowrap">
          {getShipRole(index)}
        </div>
      )}
      <button
        onClick={() => setSelectedUnits(units => units.filter((_, i) => i !== index))}
        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
      >
        <X className="w-3 h-3 text-white" />
      </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                    rows={3}
                    placeholder="Describe how this counter works..."
                  />
                </div>

                {/* Rendera endast om det inte är en fleet */}
                {!isFleet && (
                  <>
                    {/* Datacron Requirement */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-white mb-2">
                          Datacron Requirement (Optional)
                        </h3>
                        <div className="flex gap-4">
                          <input
                            type="number"
                            min="1"
                            max="9"
                            placeholder="Level"
                            value={datacronRequired?.level || ''}
                            onChange={(e) => setDatacronRequired({
                              level: parseInt(e.target.value),
                              description: datacronRequired?.description || ''
                            })}
                            className="w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                          />
                          <input
                            type="text"
                            placeholder="Description"
                            value={datacronRequired?.description || ''}
                            onChange={(e) => setDatacronRequired({
                              level: datacronRequired?.level || 1,
                              description: e.target.value
                            })}
                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                          />
                        </div>
                      </div>

                      {/* Mod Requirements */}
                      <div>
                        <h3 className="text-sm font-medium text-white mb-2">
                          Mod Requirements (Optional)
                        </h3>
                        <div className="flex gap-4">
                          <input
                            type="text"
                            placeholder="Character"
                            value={modRequirements[0]?.character || ''}
                            onChange={(e) => setModRequirements([{
                              character: e.target.value,
                              description: modRequirements[0]?.description || ''
                            }])}
                            className="w-1/3 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                          />
                          <input
                            type="text"
                            placeholder="Description"
                            value={modRequirements[0]?.description || ''}
                            onChange={(e) => setModRequirements([{
                              character: modRequirements[0]?.character || '',
                              description: e.target.value
                            }])}
                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                          />
                        </div>
                      </div>

                      {/* TW Omicron Toggle */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="twOmicron"
                          checked={twOmicron.required}
                          onChange={(e) => setTwOmicron({
                            ...twOmicron,
                            required: e.target.checked
                          })}
                          className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500"
                        />
                        <label htmlFor="twOmicron" className="text-sm text-white">
                          Requires Territory Wars Omicron
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* Video URL */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    Video Guide URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="YouTube URL..."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                  {videoUrl && (
                    <div className="mt-2">
                      <VideoGuide videoUrl={videoUrl} />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-between gap-3 pt-4">
                  <div>
                    {existingCounter && onDelete && (
                      <button
                        onClick={handleDelete}
                        disabled={saving}
                        className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50"
                      >
                        Delete Counter
                      </button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : existingCounter ? 'Update Counter' : 'Save Counter'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Unit Selector */}
            {showSelector && (
              <UnitSelector
                type={targetDefense.type === 'squad' ? 'character' : 'ship'}
                isOpen={showSelector}
                onClose={() => setShowSelector(false)}
                onSelect={(unit) => {
                  if (isFleet) {
                    const ship = unit as Ship;
                    setSelectedUnits(prev => {
                      const prevShips = prev as Ship[];
                      // Om det är första skeppet, måste det vara ett capital ship
                      if (prevShips.length === 0) {
                        if (!ship.isCapital) {
                          setError('First ship must be a capital ship');
                          return prevShips;
                        }
                        return [ship];
                      }
                      // Max 3 skepp i starting lineup (position 1-3)
                      if (prevShips.length <= 3) {
                        return [...prevShips, ship];
                      }
                      // Max 3 skepp i reinforcements (position 4-6)
                      if (prevShips.length <= 6) {
                        return [...prevShips, ship];
                      }
                      return prevShips;
                    });
                  } else {
                    setSelectedUnits(prev => [...prev, unit]);
                  }
                  setShowSelector(false);
                }}
                availableUnits={availableUnits}
                alignment={targetDefense.alignment}
                selectionType="member"
              />
            )}
          </motion.div>
        </div>
      </motion.div>
    </ErrorBoundary>
  );
};