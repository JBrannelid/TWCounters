import React, { useState, useEffect } from 'react';
import { Squad, Fleet, Counter, Character, Ship } from '@/types';
import { X, AlertTriangle, Plus } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { UnitSelector } from '../UnitSelector';
import { VideoGuide } from '../VideoGuide';
import { UnitImage } from '../ui/UnitImage';
// import { DefenseService } from '@/services/defenseService';
// import { motion, AnimatePresence } from 'framer-motion';

interface CounterEditorProps {
  targetDefense: Squad | Fleet;
  existingCounter?: Counter | null;
  onSave: (counter: Counter) => Promise<void>;
  onCancel: () => void;
  onDelete?: (counterId: string) => Promise<void>;
  availableUnits: (Character | Ship)[];
}

export const CounterEditor: React.FC<CounterEditorProps> = ({
  targetDefense,
  existingCounter,
  onSave,
  onCancel,
  onDelete,
  availableUnits
}) => {
  useEffect(() => {
    console.log('CounterEditor mounted with props:', {
        targetDefense,
        existingCounter,
        hasAvailableUnits: availableUnits?.length
    });
}, [targetDefense, existingCounter, availableUnits]);

  const isFleet = targetDefense.type === 'fleet';
  const [selectedUnits, setSelectedUnits] = useState<(Character | Ship)[]>(() => {
    if (!existingCounter?.counterSquad) return [];

    try {
        if (targetDefense.type === 'squad') {
            const squad = existingCounter.counterSquad as Squad;
            return [squad.leader, ...(squad.characters || [])]
                .filter((unit): unit is Character => unit !== null);
        } else {
            const fleet = existingCounter.counterSquad as Fleet;
            return [
                fleet.capitalShip,
                ...fleet.startingLineup,
                ...fleet.reinforcements
            ].filter((unit): unit is Ship => unit !== null);
        }
    } catch (error) {
        console.error('Error initializing units:', error);
        return [];
    }
});

  const [counterType, setCounterType] = useState<'hard' | 'soft' | 'risky'>(
    existingCounter?.counterType || 'hard'
  );
  const [description, setDescription] = useState(existingCounter?.description || '');
  const [error, setError] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const [selectorMode, setSelectorMode] = useState<'capital' | 'starting' | 'reinforcement' | 'leader' | 'member'>(
      isFleet ? 'capital' : 'leader'
  );
  const [saving, setSaving] = useState(false);
  const [twOmicron, setTwOmicron] = useState({
      required: existingCounter?.twOmicronRequired || false,
      comment: existingCounter?.twOmicronComment || ''
  });
  const [videoUrl, setVideoUrl] = useState(existingCounter?.video_url || '');

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (selectedUnits.length === 0) {
        setError('Please select counter units');
        setSaving(false);
        return;
      }
  
      if (!description.trim()) {
        setError('Please provide a description');
        setSaving(false);
        return;
      }
  
      let counterData: Counter;
      
      // Base counter data
      const baseCounter = {
        id: existingCounter?.id || `counter-${Date.now()}`,
        counterType,
        description: description.trim(),
        video_url: videoUrl || undefined,
        strategy: existingCounter?.strategy || [],
        lastUpdated: Date.now(),
        targetSquad: targetDefense, 
        counterSquad: {},
        requirements: existingCounter?.requirements || [], 
      };
  
      if (existingCounter) {
        console.log('Updating existing counter:', existingCounter.id);
        
        if (isFleet) {
          const fleetUnits = selectedUnits as Ship[];
          counterData = {
            ...baseCounter,
            counterSquad: {
              id: existingCounter.counterSquad.id,
              type: 'fleet',
              name: `Counter for ${targetDefense.name}`,
              alignment: targetDefense.alignment,
              capitalShip: fleetUnits[0],
              startingLineup: fleetUnits.slice(1, 4),
              reinforcements: fleetUnits.slice(4),
            } as Fleet
          };
        } else {
          counterData = {
            ...baseCounter,
            counterSquad: {
              id: existingCounter.counterSquad.id,
              type: 'squad',
              name: `Counter for ${targetDefense.name}`,
              alignment: targetDefense.alignment,
              leader: selectedUnits[0] as Character,
              characters: selectedUnits.slice(1) as Character[],
            } as Squad
          };
        }
      } else {
        // create new counter
        if (isFleet) {
          const fleetUnits = selectedUnits as Ship[];
          counterData = {
            ...baseCounter,
            counterSquad: {
              id: `fleet-${Date.now()}`,
              type: 'fleet',
              name: `Counter for ${targetDefense.name}`,
              alignment: targetDefense.alignment,
              capitalShip: fleetUnits[0],
              startingLineup: fleetUnits.slice(1, 4),
              reinforcements: fleetUnits.slice(4),
            } as Fleet
          };
        } else {
          counterData = {
            ...baseCounter,
            counterSquad: {
              id: `squad-${Date.now()}`,
              type: 'squad',
              name: `Counter for ${targetDefense.name}`,
              alignment: targetDefense.alignment,
              leader: selectedUnits[0] as Character,
              characters: selectedUnits.slice(1) as Character[],
            } as Squad
          };
        }
      }
  
      console.log('Saving counter data:', counterData);
      await onSave(counterData);
      onCancel();
    } catch (error) {
      console.error('Error saving counter:', error);
      setError(error instanceof Error ? error.message : 'Failed to save counter');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-full w-full flex items-start justify-center py-8">
        <div className="w-full max-w-3xl mx-4 bg-space-darker rounded-lg border border-white/10">
          {/* Header */}
          <div className="sticky top-0 z-10 flex justify-between items-center p-4 border-b border-white/10 bg-space-darker">
            <h2 className="text-xl font-bold text-white">
              {existingCounter ? 'Edit Counter' : 'Add Counter'}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Target Defense Preview */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Target {isFleet ? 'Fleet' : 'Squad'}</h3>
              <div className="flex items-center gap-2">
                {isFleet ? (
                  <>
                    {(targetDefense as Fleet).capitalShip && (
                      <UnitImage
                        id={(targetDefense as Fleet).capitalShip!.id}
                        name={(targetDefense as Fleet).capitalShip!.name}
                        type="capital-ship"
                        size="md"
                        className="border-2 border-blue-400/50"
                      />
                    )}
                    {(targetDefense as Fleet).startingLineup.map((ship) => (
                      <UnitImage
                        key={ship.id}
                        id={ship.id}
                        name={ship.name}
                        type="ship"
                        size="md"
                        className="border-2 border-white/20"
                      />
                    ))}
                  </>
                ) : (
                  <>
                    {(targetDefense as Squad).leader && (
                      <UnitImage
                        id={(targetDefense as Squad).leader!.id}
                        name={(targetDefense as Squad).leader!.name}
                        type="squad-leader"
                        size="md"
                        className="border-2 border-blue-400/50"
                      />
                    )}
                    {(targetDefense as Squad).characters.map((char) => (
                      <UnitImage
                        key={char.id}
                        id={char.id}
                        name={char.name}
                        type="squad-member"
                        size="md"
                        className="border-2 border-white/20"
                      />
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Counter Type */}
            <div>
              <h3 className="text-sm font-medium text-white mb-2">Counter Type</h3>
              <div className="flex flex-wrap gap-3">
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
            <div>
              <h3 className="text-sm font-medium text-white mb-2">Counter Units</h3>
              <div className="flex flex-wrap gap-4">
                {selectedUnits.map((unit, index) => (
                  <div key={unit.id} className="relative">
                    <UnitImage
                      id={unit.id}
                      name={unit.name}
                      type={isFleet ? (index === 0 ? 'capital-ship' : 'ship') : (index === 0 ? 'squad-leader' : 'squad-member')}
                      size="md"
                      className={index === 0 ? 'border-2 border-blue-400' : 'border-2 border-white/20'}
                    />
                    <button
                      onClick={() => {
                        setSelectedUnits(units => units.filter((_, i) => i !== index));
                      }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full 
                               flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                {/* Add Unit Button */}
                <button
                  onClick={() => {
                    setSelectorMode(isFleet ? 
                      (selectedUnits.length === 0 ? 'capital' : 
                       selectedUnits.length <= 3 ? 'starting' : 'reinforcement') :
                      (selectedUnits.length === 0 ? 'leader' : 'member'));
                    setShowSelector(true);
                  }}
                  className="w-16 h-16 rounded-lg border-2 border-dashed border-white/20 
                           flex items-center justify-center hover:border-white/40"
                >
                  <Plus className="w-4 h-4 text-white/40" />
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white resize-y"
                rows={3}
                placeholder="Describe how this counter works..."
              />
            </div>

            {/* TW Omicron Requirements (Only for squad counters) */}
            {!isFleet && (
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
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  />
                )}
              </div>
            )}

            {/* Video URL */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
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

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
                {existingCounter && onDelete && (
                    <button
                        onClick={() => {
                            if (window.confirm('Are you sure you want to delete this counter?')) {
                                onDelete(existingCounter.id);
                            }
                        }}
                        className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                        disabled={saving}
                    >
                        Delete Counter
                    </button>
                )}
                <button
                    onClick={onCancel}
                    className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                    disabled={saving}
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 
                            disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? 'Saving...' : (existingCounter ? 'Update Counter' : 'Save Counter')}
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Unit Selector Modal */}
      {showSelector && (
        <UnitSelector
          type={isFleet ? 'ship' : 'character'}
          isOpen={showSelector}
          onClose={() => setShowSelector(false)}
          onSelect={(unit) => {
            setSelectedUnits(prev => [...prev, unit]);
            setShowSelector(false);
          }}
          availableUnits={availableUnits}
          alignment={targetDefense.alignment}
          selectionType={selectorMode}
        />
      )}

      {saving && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <LoadingIndicator size="lg" />
        </div>
      )}
    </div>
  );
};

export default CounterEditor;