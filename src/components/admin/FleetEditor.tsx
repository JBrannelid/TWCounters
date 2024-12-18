import React, { useState } from 'react';
import { Fleet, Counter, Ship } from '@/types';
import { Settings, Plus, Trash2, X } from 'lucide-react';
import { CounterList } from './CounterList';
import { UnitImage } from '../ui/UnitImage';
import { CounterButton } from './CounterButton';
import { AlignmentDropdown } from './AlignmentDropdown';
import { normalizeId } from '@/lib/imageMapping';
import { motion, AnimatePresence } from 'framer-motion';
import { UnitSelector } from '../UnitSelector';
import { useFirebase } from '@/contexts/FirebaseContext';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

interface EditModalProps {
  fleet: Fleet;
  counters: Counter[];
  availableUnits: Ship[];
  onClose: () => void;
  onUpdate: (fleet: Fleet) => void;
  onDelete: (id: string) => void;
  onUpdateCounter: (counter: Counter) => void;
  onDeleteCounter: (counterId: string) => void;
  onSelectForCounter: (defense: Fleet) => void;
}

interface FleetEditorProps {
  fleets: Fleet[];
  counters: Counter[];
  availableUnits: Ship[];
  onUpdate: (fleet: Fleet) => void;
  onDelete: (id: string) => void;
  onAddCounter: (fleet: Fleet) => void;
  onEditCounter: (counter: Counter) => void;
  onDeleteCounter: (counterId: string) => void;
}

const EditModal: React.FC<EditModalProps> = ({
  fleet,
  counters,
  availableUnits,
  onClose,
  onUpdate,
  onDelete,
  onUpdateCounter,
  onDeleteCounter,
  onSelectForCounter
}) => {
  const [name, setName] = useState(fleet.name);
  const [callOrder, setCallOrder] = useState(fleet.callOrder || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [alignment, setAlignment] = useState<'light' | 'dark'>(fleet.alignment);
  const [showSelector, setShowSelector] = useState(false);
  const [selectorMode, setSelectorMode] = useState<'capital' | 'starting' | 'reinforcement'>('capital');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useFirebase();

  const handleSave = async () => {
    if (!isOnline) {
      setError('Cannot save while offline');
      return;
    }

    try {
      setSaving(true);
      const updatedFleet: Fleet = {
        ...fleet,
        name,
        alignment,
        id: normalizeId(name),
        callOrder: callOrder.trim() || undefined
      };
      await onUpdate(updatedFleet);
      onClose();
    } catch (err) {
      console.error('Error saving fleet:', err);
      setError('Failed to save fleet');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isOnline) {
      setError('Cannot delete while offline');
      return;
    }

    try {
      setSaving(true);
      await onDelete(fleet.id);
      onClose();
    } catch (err) {
      console.error('Error deleting fleet:', err);
      setError('Failed to delete fleet');
    } finally {
      setSaving(false);
    }
  };

  const handleAddShip = (ship: Ship, position: 'capital' | 'starting' | 'reinforcement') => {
    const normalizedShip = {
      ...ship,
      id: normalizeId(ship.name)
    };

    const updatedFleet = { ...fleet };

    switch (position) {
      case 'capital':
        updatedFleet.capitalShip = normalizedShip;
        break;
      case 'starting':
        if (updatedFleet.startingLineup.length < 3) {
          updatedFleet.startingLineup = [...updatedFleet.startingLineup, normalizedShip];
        }
        break;
      case 'reinforcement':
        if (updatedFleet.reinforcements.length < 3) {
          updatedFleet.reinforcements = [...updatedFleet.reinforcements, normalizedShip];
        }
        break;
    }

    onUpdate(updatedFleet);
  };

  const handleRemoveShip = (shipId: string, position: 'capital' | 'starting' | 'reinforcement') => {
    const updatedFleet = { ...fleet };

    switch (position) {
      case 'capital':
        updatedFleet.capitalShip = null;
        break;
      case 'starting':
        updatedFleet.startingLineup = updatedFleet.startingLineup.filter(s => s.id !== shipId);
        break;
      case 'reinforcement':
        updatedFleet.reinforcements = updatedFleet.reinforcements.filter(s => s.id !== shipId);
        break;
    }

    onUpdate(updatedFleet);
  };

  const fleetCounters = counters.filter(c => c.targetSquad.id === fleet.id);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-full w-full flex items-start justify-center py-8">
        <div className="relative w-full max-w-4xl mx-4 bg-space-darker rounded-lg border border-white/10">
          {/* Header */}
          <div className="sticky top-0 z-10 flex justify-between items-center p-4 border-b border-white/10 bg-space-darker">
            <h2 className="text-xl font-bold text-white">Edit Fleet</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Fleet Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                />
              </div>
              <div>
                <AlignmentDropdown 
                  value={alignment}
                  onChange={setAlignment}
                />
              </div>
            </div>

            {/* Fleet Formation */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Fleet Formation</h3>

              {/* Capital Ship */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-white/60 mb-2">Capital Ship</h4>
                <div className="flex flex-wrap gap-4">
                  {fleet.capitalShip && (
                    <div className="relative">
                      <UnitImage
                        id={fleet.capitalShip.id}
                        name={fleet.capitalShip.name}
                        type="capital-ship"
                        size="lg"
                        className="border-2 border-blue-400"
                      />
                      <button
                        onClick={() => handleRemoveShip(fleet.capitalShip!.id, 'capital')}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
                  {!fleet.capitalShip && (
                    <button
                      onClick={() => {
                        setSelectorMode('capital');
                        setShowSelector(true);
                      }}
                      className="w-20 h-20 rounded-lg border-2 border-dashed border-blue-500/50 flex items-center justify-center hover:border-blue-500"
                    >
                      <Plus className="w-6 h-6 text-blue-500/50" />
                    </button>
                  )}
                </div>
              </div>

              {/* Starting Lineup */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-white/60 mb-2">Starting Lineup</h4>
                <div className="flex flex-wrap gap-4">
                  {fleet.startingLineup.map((ship) => (
                    <div key={ship.id} className="relative">
                      <UnitImage
                        id={ship.id}
                        name={ship.name}
                        type="ship"
                        size="md"
                        className="border-2 border-white/20"
                      />
                      <button
                        onClick={() => handleRemoveShip(ship.id, 'starting')}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {fleet.startingLineup.length < 3 && (
                    <button
                      onClick={() => {
                        setSelectorMode('starting');
                        setShowSelector(true);
                      }}
                      className="w-16 h-16 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center hover:border-white/40"
                    >
                      <Plus className="w-4 h-4 text-white/40" />
                    </button>
                  )}
                </div>
              </div>

              {/* Reinforcements */}
              <div>
                <h4 className="text-sm font-medium text-white/60 mb-2">Reinforcements</h4>
                <div className="flex flex-wrap gap-4">
                  {fleet.reinforcements.map((ship, index) => (
                    <div key={ship.id} className="relative">
                      <UnitImage
                        id={ship.id}
                        name={ship.name}
                        type="ship"
                        size="md"
                        className="border-2 border-white/20"
                      />
                      <div className="absolute -top-1 -left-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                        {index + 1}
                      </div>
                      <button
                        onClick={() => handleRemoveShip(ship.id, 'reinforcement')}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {fleet.reinforcements.length < 3 && (
                    <button
                      onClick={() => {
                        setSelectorMode('reinforcement');
                        setShowSelector(true);
                      }}
                      className="w-16 h-16 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center hover:border-white/40"
                    >
                      <Plus className="w-4 h-4 text-white/40" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Call Order */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Call Order
              </label>
              <textarea
                value={callOrder}
                onChange={(e) => setCallOrder(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white resize-none"
                rows={2}
                placeholder="Enter reinforcement call order strategy..."
              />
            </div>

            {/* Counters */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Counters</h3>
                <CounterButton
                  defense={fleet}
                  onAddCounter={() => onSelectForCounter(fleet)}
                  disabled={!isOnline || saving}
                />
              </div>

              <CounterList
                counters={fleetCounters}
                targetDefense={fleet}
                onEdit={onUpdateCounter}
                onDelete={onDeleteCounter}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                disabled={!isOnline || saving}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-space-darker p-6 rounded-lg max-w-md w-full mx-4 border border-white/10"
            >
              <h3 className="text-xl font-bold text-white mb-4">Delete Fleet</h3>
              <p className="text-white/70 mb-6">
                Are you sure you want to delete this fleet? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                  disabled={!isOnline || saving}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unit Selector */}
      {showSelector && (
        <UnitSelector<Ship>
          type="ship"
          isOpen={showSelector}
          onClose={() => setShowSelector(false)}
          onSelect={(ship) => {
            handleAddShip(ship, selectorMode);
            setShowSelector(false);
          }}
          availableUnits={availableUnits}
          alignment={fleet.alignment}
          selectionType={selectorMode}
          title={`Select ${
            selectorMode === 'capital' 
              ? 'Capital Ship' 
              : selectorMode === 'starting' 
                ? 'Starting Ship' 
                : 'Reinforcement'
          }`}
        />
      )}

      {saving && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <LoadingIndicator size="lg" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex justify-between items-center">
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export const FleetEditor: React.FC<FleetEditorProps> = ({
  fleets,
  counters,
  availableUnits,
  onUpdate,
  onDelete,
  onAddCounter,
  onEditCounter,
  onDeleteCounter
}) => {
  const { isOnline, isLoading } = useFirebase();
  const [editingFleet, setEditingFleet] = useState<Fleet | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (fleet: Fleet) => {
    if (!isOnline) {
      setError('Cannot save while offline');
      return;
    }

    try {
      setSaving(true);
      await onUpdate(fleet);
      setError(null);
    } catch (err) {
      console.error('Error updating fleet:', err);
      setError('Failed to update fleet');
      throw err; // Re-throw to be handled by the EditModal
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingIndicator size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!isOnline && (
        <Alert>
          <AlertTitle>Offline Mode</AlertTitle>
          <AlertDescription>
            You are currently offline. Changes will be saved when you reconnect.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex justify-between items-center">
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </AlertDescription>
        </Alert>
      )}

      {fleets.map((fleet) => (
        <div
          key={fleet.id}
          className="p-4 rounded-lg bg-space-dark border border-white/10"
        >
          <div className="flex justify-between items-start">
            {/* Fleet Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                {fleet.capitalShip && (
                  <UnitImage
                    id={fleet.capitalShip.id}
                    name={fleet.capitalShip.name}
                    type="capital-ship"
                    size="md"
                    className="border-2 border-blue-400"
                    />
                  )}
                  {fleet.startingLineup.map((ship) => (
                    <UnitImage
                      key={ship.id}
                      id={ship.id}
                      name={ship.name}
                      type="ship"
                      size="md"
                      className="border-2 border-white/20"
                    />
                  ))}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">{fleet.name}</h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs mt-1
                    ${fleet.alignment === 'light' 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {fleet.alignment === 'light' ? 'Light Side' : 'Dark Side'}
                  </span>
                </div>
              </div>
  
              {/* Actions */}
              <div className="flex gap-2">
                <CounterButton
                  defense={fleet}
                  onAddCounter={() => onAddCounter(fleet)}
                  disabled={!isOnline || saving}
                />
                <button
                  onClick={() => setEditingFleet(fleet)}
                  className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isOnline || saving}
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
  
            {/* Fleet Details */}
            {fleet.reinforcements.length > 0 && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <span className="text-sm text-white/40 block mb-2">Reinforcements:</span>
                <div className="flex items-center gap-2">
                  {fleet.reinforcements.map((ship, index) => (
                    <div key={ship.id} className="relative">
                      <UnitImage
                        id={ship.id}
                        name={ship.name}
                        type="ship"
                        size="sm"
                        className="border-2 border-white/20"
                      />
                      <div className="absolute -top-1 -left-1 w-5 h-5 bg-blue-500 rounded-full 
                                  flex items-center justify-center text-white text-xs">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
  
            {/* Call Order */}
            {fleet.callOrder && (
              <div className="mt-2 text-sm text-white/60">
                {fleet.callOrder}
              </div>
            )}
  
            {/* Counter List */}
            <div className="mt-4">
              <CounterList
                counters={counters.filter(c => c.targetSquad.id === fleet.id)}
                targetDefense={fleet}
                onEdit={onEditCounter}
                onDelete={onDeleteCounter}
              />
            </div>
          </div>
        ))}
  
        {/* Edit Modal */}
        {editingFleet && (
          <EditModal
            fleet={editingFleet}
            counters={counters}
            availableUnits={availableUnits}
            onClose={() => {
              setEditingFleet(null);
              setError(null);
            }}
            onUpdate={handleUpdate}
            onDelete={onDelete}
            onUpdateCounter={onEditCounter}
            onDeleteCounter={onDeleteCounter}
            onSelectForCounter={onAddCounter}
          />
        )}
      </div>
    );
  };
  
  export default FleetEditor;