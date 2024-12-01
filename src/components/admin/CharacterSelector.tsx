import React, { useState, useMemo, useCallback } from 'react';
import { Search, X, Shield } from 'lucide-react';
import { Character } from '@/types';
import { UnitImage } from '../ui/UnitImage';
import { motion } from 'framer-motion';

interface CharacterSelectorProps {
  leader: Character | null;
  members: Character[];
  onAddUnit: (unit: Character, isLeader: boolean) => void;
  onRemoveUnit: (unitId: string, isLeader: boolean) => void;
  alignment: 'light' | 'dark';
  showLeaderSelection?: boolean;
  availableUnits: Character[];
}

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  leader,
  members,
  onAddUnit,
  onRemoveUnit,
  alignment,
  showLeaderSelection = true,
  availableUnits
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const handleSelectCharacter = useCallback((
    e: React.MouseEvent,
    character: Character, 
    isLeader: boolean
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    const normalizedCharacter = {
      id: character.id,
      name: character.name,
      role: character.role || '',
      alignment: character.alignment,
      isGalacticLegend: character.isGalacticLegend || false
    };
  
    onAddUnit(normalizedCharacter, isLeader);
    setShowSearch(false);
  }, [onAddUnit]);

  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSearch(true);
  };

  const filteredCharacters = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    const selectedIds = new Set([leader?.id, ...members.map(m => m.id)]);

    return availableUnits.filter(char => {
      const matchesSearch = !searchTerm || char.name.toLowerCase().includes(searchLower);
      const isNotSelected = !selectedIds.has(char.id);
      const matchesAlignment = char.alignment === alignment;
      
      return matchesSearch && isNotSelected && matchesAlignment;
    });
  }, [searchTerm, availableUnits, leader, members, alignment]);

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClick={(e) => {
            e.stopPropagation();
            setShowSearch(true);
          }}
          className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                   text-white placeholder-white/40"
          placeholder="Search characters..."
        />

        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-gray-900 border border-white/10 
                     rounded-lg shadow-lg max-h-64 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-2 border-b border-white/10">
              <span className="text-sm text-white/60">Select Character</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSearch(false);
                }}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>
            
            {filteredCharacters.length > 0 ? (
              filteredCharacters.map((char) => (
                <div
                  key={char.id}
                  className="p-3 hover:bg-white/5 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UnitImage
                        id={char.id}
                        name={char.name}
                        type={!leader && showLeaderSelection ? 'squad-leader' : 'squad-member'}
                        size="sm"
                        className="rounded-full border-2 border-white/20"
                      />
                      <div>
                        <div className="text-white">{char.name}</div>
                        <div className="text-sm text-white/60">{char.role}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {showLeaderSelection && !leader && (
                        <button
                          onClick={(e) => handleSelectCharacter(e, char, true)}
                          className="px-3 py-1 text-sm rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                        >
                          Set as Leader
                        </button>
                      )}
                      {members.length < 4 && (
                        <button
                          onClick={(e) => handleSelectCharacter(e, char, false)}
                          className="px-3 py-1 text-sm rounded-md bg-white/10 text-white hover:bg-white/20"
                        >
                          Add Member
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-white/60 text-center">
                No matching characters found
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Selected Characters Display */}
      <div className="space-y-4">
        {/* Leader */}
        <div>
          <h3 className="text-sm font-medium text-white/60 mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Leader
          </h3>
          <div className="relative group inline-block">
            {leader ? (
              <div className="relative">
                <UnitImage
                  id={leader.id}
                  name={leader.name}
                  type="squad-leader"
                  size="md"
                  className="rounded-full border-2 border-blue-400"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveUnit(leader.id, true);
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full 
                           flex items-center justify-center opacity-0 group-hover:opacity-100 
                           transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSearchClick}
                className="w-12 h-12 rounded-full border-2 border-dashed border-blue-400/40 
                         flex items-center justify-center hover:border-blue-400/60 
                         transition-colors"
              >
                <span className="text-blue-400/60">+</span>
              </button>
            )}
          </div>
        </div>

        {/* Squad Members */}
        <div>
          <h3 className="text-sm font-medium text-white/60 mb-2">Squad Members</h3>
          <div className="flex flex-wrap gap-4">
            {members.map((member) => (
              <div key={member.id} className="relative group">
                <UnitImage
                  id={member.id}
                  name={member.name}
                  type="squad-member"
                  size="md"
                  className="rounded-full border-2 border-white/20"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveUnit(member.id, false);
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full 
                           flex items-center justify-center opacity-0 group-hover:opacity-100 
                           transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {members.length < 4 && (
              <button
                onClick={handleSearchClick}
                className="w-12 h-12 rounded-full border-2 border-dashed border-white/20 
                         flex items-center justify-center hover:border-white/40 
                         transition-colors"
              >
                <span className="text-white/40">+</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};