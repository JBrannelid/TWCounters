import React, { useState } from 'react';
import { Squad, Character } from '@/types';
import { AlignmentDropdown } from './AlignmentDropdown';
import { CharacterSelector } from './CharacterSelector';
import { normalizeId } from '@/lib/imageMapping';
import { AlertTriangle } from 'lucide-react';

interface NewSquadFormProps {
  onSave: (squad: Squad) => void;
  onCancel: () => void;
  availableUnits: Character[];
  isLoading?: boolean;
}

export const NewSquadForm: React.FC<NewSquadFormProps> = ({ 
  onSave, 
  onCancel,
  availableUnits,
  isLoading = false
}) => {
  const [name, setName] = useState('');
  const [alignment, setAlignment] = useState<'light' | 'dark'>('light');
  const [leader, setLeader] = useState<Character | null>(null);
  const [members, setMembers] = useState<Character[]>([]);
  const [twOmicronRequired, setTwOmicronRequired] = useState(false);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Squad name is required');
      return;
    }

    if (!leader) {
      setError('Squad must have a leader');
      return;
    }

    if (members.length === 0) {
      setError('Squad must have at least one member');
      return;
    }

    const squad: Squad = {
      id: normalizeId(name),
      name: name.trim(),
      type: 'squad',
      alignment,
      leader,
      characters: members,
      description: description.trim() || undefined,
      twOmicronRequired
    };

    onSave(squad);
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
            Squad Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
            placeholder="Enter squad name"
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

      <CharacterSelector
        leader={leader}
        members={members}
        onAddUnit={(unit, isLeader) => {
          if (isLeader) setLeader(unit);
          else if (members.length < 4) setMembers(prev => [...prev, unit]);
        }}
        onRemoveUnit={(unitId, isLeader) => {
          if (isLeader) setLeader(null);
          else setMembers(prev => prev.filter(m => m.id !== unitId));
        }}
        alignment={alignment}
        availableUnits={availableUnits}
      />

      <div className="flex items-center">
        <input
          type="checkbox"
          id="twOmicron"
          checked={twOmicronRequired}
          onChange={(e) => setTwOmicronRequired(e.target.checked)}
          className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500"
          disabled={isLoading}
        />
        <label htmlFor="twOmicron" className="ml-2 text-sm text-white">
          Requires Territory Wars Omicron
        </label>
      </div>

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
          Create Squad
        </button>
      </div>
    </form>
  );
};