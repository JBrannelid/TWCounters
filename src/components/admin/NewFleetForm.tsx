import React, { useState } from 'react';
import { Fleet, Ship } from '@/types';
import { AlignmentDropdown } from './AlignmentDropdown';
import { ShipSelector } from './ShipSelector';
import { normalizeId } from '@/lib/imageMapping';
import { AlertTriangle } from 'lucide-react';

interface NewFleetFormProps {
  onSave: (fleet: Fleet) => void;
  onCancel: () => void;
  availableUnits: Ship[];
  isLoading?: boolean;
}

export const NewFleetForm: React.FC<NewFleetFormProps> = ({
  onSave,
  onCancel,
  availableUnits,
  isLoading = false
}) => {
  const [name, setName] = useState('');
  const [alignment, setAlignment] = useState<'light' | 'dark'>('light');
  const [capitalShip, setCapitalShip] = useState<Ship | null>(null);
  const [startingLineup, setStartingLineup] = useState<Ship[]>([]);
  const [reinforcements, setReinforcements] = useState<Ship[]>([]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Fleet name is required');
      return;
    }

    if (!capitalShip) {
      setError('Fleet must have a capital ship');
      return;
    }

    if (startingLineup.length === 0) {
      setError('Fleet must have at least one ship in starting lineup');
      return;
    }

    const fleet: Fleet = {
      id: normalizeId(name),
      name: name.trim(),
      type: 'fleet',
      alignment,
      capitalShip,
      startingLineup,
      reinforcements,
      description: description.trim() || undefined
    };

    onSave(fleet);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

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
            placeholder="Enter fleet name"
            disabled={isLoading}
          />
        </div>
        <div>
          <AlignmentDropdown
            value={alignment}
            onChange={setAlignment}
          />
        </div>
      </div>

      <ShipSelector
        capitalShip={capitalShip}
        startingLineup={startingLineup}
        reinforcements={reinforcements}
        onAddUnit={(ship, position) => {
          switch (position) {
            case 'capital':
              setCapitalShip(ship);
              break;
            case 'starting':
              if (startingLineup.length < 3) {
                setStartingLineup(prev => [...prev, ship]);
              }
              break;
            case 'reinforcement':
              if (reinforcements.length < 3) {
                setReinforcements(prev => [...prev, ship]);
              }
              break;
          }
        }}
        onRemoveUnit={(shipId, position) => {
          switch (position) {
            case 'capital':
              setCapitalShip(null);
              break;
            case 'starting':
              setStartingLineup(prev => prev.filter(s => s.id !== shipId));
              break;
            case 'reinforcement':
              setReinforcements(prev => prev.filter(s => s.id !== shipId));
              break;
          }
        }}
        alignment={alignment}
        availableUnits={availableUnits}
      />

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white resize-none"
          rows={3}
          placeholder="Add any notes or description..."
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
          disabled={isLoading}
        >
          Create Fleet
        </button>
      </div>
    </form>
  );
};