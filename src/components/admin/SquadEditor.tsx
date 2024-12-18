import React, { useState } from 'react';
import { Squad, Counter, Character } from '@/types';
import { Settings, Plus, Trash2, X } from 'lucide-react';
import { CounterList } from './CounterList';
import { UnitImage } from '../ui/UnitImage';
import { CounterButton } from './CounterButton';
import { AlignmentDropdown } from './AlignmentDropdown';
import { normalizeId } from '@/lib/imageMapping';
import { motion, AnimatePresence } from 'framer-motion';
import { UnitSelector } from '../UnitSelector';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useFirebase } from '@/contexts/FirebaseContext';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';

interface EditModalProps {
  squad: Squad;
  counters: Counter[];
  availableUnits: Character[];
  onClose: () => void;
  onUpdate: (squad: Squad) => void;
  onDelete: (id: string) => void;
  onUpdateCounter: (counter: Counter) => void;
  onDeleteCounter: (counterId: string) => void;
  onAddCounter: (squad: Squad) => void;
  isOnline: boolean;
  saving: boolean;
}

interface SquadEditorProps {
  squads: Squad[];
  counters: Counter[];
  availableUnits: Character[];
  onUpdate: (squad: Squad) => void;
  onDelete: (id: string) => void;
  onAddCounter: (squad: Squad) => void;
  onEditCounter: (counter: Counter) => void;
  onDeleteCounter: (counterId: string) => void;
}

const EditModal: React.FC<EditModalProps> = ({
  squad,
  counters,
  availableUnits,
  onClose,
  onUpdate,
  onDelete,
  onUpdateCounter,
  onDeleteCounter,
  onAddCounter,
  isOnline,
  saving = false
}) => {
  const [name, setName] = useState(squad.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [alignment, setAlignment] = useState<'light' | 'dark'>(squad.alignment);
  const [description, setDescription] = useState(squad.description || '');
  const [twOmicronRequired, setTwOmicronRequired] = useState(squad.twOmicronRequired || false);
  const [showSelector, setShowSelector] = useState(false);
  const [selectorMode, setSelectorMode] = useState<'leader' | 'member'>('leader');

  const handleSave = async () => {
    if (!isOnline) {
      return; // Prevent saving while offline
    }

    try {
      const updatedSquad: Squad = {
        ...squad,
        name,
        alignment,
        id: normalizeId(name),
        description: description.trim() || undefined,
        twOmicronRequired
      };
      await onUpdate(updatedSquad);
      onClose();
    } catch (error) {
      console.error('Error saving squad:', error);
    }
  };

  const handleDelete = () => {
    onDelete(squad.id);
    onClose();
  };

// Uppdatera handleRemoveCharacter
const handleRemoveCharacter = (characterId: string, isLeader: boolean) => {
  const updatedSquad = { ...squad };
  
  if (isLeader) {
    updatedSquad.leader = null;
  } else {
    updatedSquad.characters = updatedSquad.characters.filter(c => c.id !== characterId);
  }

  onUpdate(updatedSquad);
};

// Uppdatera handleAddCharacter
const handleAddCharacter = (character: Character, isLeader: boolean) => {
  const normalizedCharacter = {
    ...character,
    id: normalizeId(character.name)
  };

  const updatedSquad = { ...squad };

  if (isLeader) {
    updatedSquad.leader = normalizedCharacter;
  } else {
    if (updatedSquad.characters.length < 4) {
      updatedSquad.characters = [...updatedSquad.characters, normalizedCharacter];
    }
  }

  onUpdate(updatedSquad);
};

  const squadCounters = counters.filter(c => c.targetSquad.id === squad.id);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-full w-full flex items-start justify-center py-8">
        <div className="relative w-full max-w-4xl mx-4 bg-space-darker rounded-lg border border-white/10">
          {/* Header */}
          <div className="sticky top-0 z-10 flex justify-between items-center p-4 border-b border-white/10 bg-space-darker">
            <h2 className="text-xl font-bold text-white">Edit Squad</h2>
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
                  Squad Name
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

            {/* Squad Formation */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Squad Formation</h3>

              {/* Leader */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-white/60 mb-2">Leader</h4>
                <div className="flex flex-wrap gap-4">
                  {squad.leader && (
                    <div className="relative">
                      <UnitImage
                        id={squad.leader.id}
                        name={squad.leader.name}
                        type="squad-leader"
                        size="lg"
                        className="border-2 border-blue-400"
                      />
                      <button
                        onClick={() => handleRemoveCharacter(squad.leader!.id, true)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
                  {!squad.leader && (
                    <button
                      onClick={() => {
                        setSelectorMode('leader');
                        setShowSelector(true);
                      }}
                      className="w-20 h-20 rounded-lg border-2 border-dashed border-blue-500/50 flex items-center justify-center hover:border-blue-500"
                    >
                      <Plus className="w-6 h-6 text-blue-500/50" />
                    </button>
                  )}
                </div>
              </div>

              {/* Squad Members */}
              <div>
                <h4 className="text-sm font-medium text-white/60 mb-2">Squad Members</h4>
                <div className="flex flex-wrap gap-4">
                  {squad.characters.map((char) => (
                    <div key={char.id} className="relative">
                      <UnitImage
                        id={char.id}
                        name={char.name}
                        type="squad-member"
                        size="md"
                        className="border-2 border-white/20"
                      />
                      <button
                        onClick={() => handleRemoveCharacter(char.id, false)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {squad.characters.length < 4 && (
                    <button
                      onClick={() => {
                        setSelectorMode('member');
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

            {/* Additional Options */}
            <div className="space-y-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white resize-none"
                  rows={2}
                  placeholder="Add any additional notes about this squad..."
                />
              </div>

              {/* TW Omicron Toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="twOmicron"
                  checked={twOmicronRequired}
                  onChange={(e) => setTwOmicronRequired(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500 
                           focus:ring-blue-500 focus:ring-offset-space-darker"
                />
                <label htmlFor="twOmicron" className="ml-2 text-sm text-white">
                  Requires Territory Wars Omicron
                </label>
              </div>
            </div>

            {/* Counters */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Counters</h3>
                <CounterButton
                  defense={squad}
                  onAddCounter={() => onAddCounter(squad)}
                />
              </div>

              <CounterList
                counters={squadCounters}
                targetDefense={squad}
                onEdit={onUpdateCounter}
                onDelete={onDeleteCounter}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!isOnline || saving}
                className={`px-4 py-2 rounded-lg ${
                  !isOnline || saving
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
              >
                {saving ? 'Saving...' : 'Save Changes'}
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
              <h3 className="text-xl font-bold text-white mb-4">Delete Squad</h3>
              <p className="text-white/70 mb-6">
                Are you sure you want to delete this squad? This action cannot be undone.
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
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {saving && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <LoadingIndicator size="lg" />
        </div>
      )}

      {showSelector && (
        <UnitSelector<Character>
          type="character"
          isOpen={showSelector}
          onClose={() => setShowSelector(false)}
          onSelect={(character) => {
            handleAddCharacter(character, selectorMode === 'leader'); // Lägg till isLeader parameter
            setShowSelector(false);
          }}
          availableUnits={availableUnits}
          alignment={squad.alignment}
          selectionType={selectorMode}
          title={`Select ${selectorMode === 'leader' ? 'Leader' : 'Member'}`}
        />
      )}
    </div>
  );
};

export const SquadEditor: React.FC<SquadEditorProps> = ({
  squads,
  counters,
  availableUnits,
  onUpdate,
  onDelete,
  onAddCounter,
  onEditCounter,
  onDeleteCounter
}) => {
  const { isOnline, isLoading } = useFirebase();
  const [saving, setSaving] = useState(false);
  const [editingSquad, setEditingSquad] = useState<Squad | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateSquad = async (squad: Squad) => {
    if (!isOnline) {
      setError('Cannot save while offline');
      return;
    }

    try {
      setSaving(true);
      await onUpdate(squad);
      setError(null);
    } catch (error) {
      console.error('Error updating squad:', error);
      setError('Failed to update squad');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSquad = async (id: string) => {
    try {
      await onDelete(id);
      setError(null);
    } catch (error) {
      console.error('Error deleting squad:', error);
      setError('Failed to delete squad');
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
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {squads.map((squad) => (
        <div
          key={squad.id}
          className="p-4 rounded-lg bg-space-dark border border-white/10"
        >
          <div className="flex justify-between items-start">
            {/* Squad Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                {squad.leader && (
                  <UnitImage
                    id={squad.leader.id}
                    name={squad.leader.name}
                    type="squad-leader"
                    size="md"
                    className="border-2 border-blue-400"
                  />
                )}
                {squad.characters.map((char) => (
                  <UnitImage
                    key={char.id}
                    id={char.id}
                    name={char.name}
                    type="squad-member"
                    size="md"
                    className="border-2 border-white/20"
                  />
                ))}
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">{squad.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs
                    ${squad.alignment === 'light' 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {squad.alignment === 'light' ? 'Light Side' : 'Dark Side'}
                  </span>
                  {squad.twOmicronRequired && (
                    <span className="inline-block px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400">
                      TW Omicron
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <CounterButton
                defense={squad}
                onAddCounter={() => onAddCounter(squad)}
                disabled={!isOnline}
              />
              <button
                onClick={() => setEditingSquad(squad)}
                className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg"
                disabled={!isOnline}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Squad Description */}
          {squad.description && (
            <div className="mt-2 text-sm text-white/60">
              {squad.description}
            </div>
          )}

          {/* Counter List */}
          <div className="mt-4">
            <CounterList
              counters={counters.filter(c => c.targetSquad.id === squad.id)}
              targetDefense={squad}
              onEdit={onEditCounter}
              onDelete={onDeleteCounter}
            />
          </div>
        </div>
      ))}

      {/* Edit Modal */}
      {editingSquad && (
        <EditModal
          squad={editingSquad}
          counters={counters}
          availableUnits={availableUnits}
          onClose={() => {
            setEditingSquad(null);
            setError(null);
          }}
          onUpdate={handleUpdateSquad}
          onDelete={handleDeleteSquad}
          onUpdateCounter={onEditCounter}
          onDeleteCounter={onDeleteCounter}
          onAddCounter={onAddCounter}
          isOnline={isOnline}
          saving={saving}
        />
      )}
    </div>
  );
};

export default SquadEditor;