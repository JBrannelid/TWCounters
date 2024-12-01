import React, { useState, useMemo, useCallback } from 'react';
import { Search, X, Anchor } from 'lucide-react';
import { Ship } from '@/types';
import { UnitImage } from '../ui/UnitImage';
import { motion } from 'framer-motion';

interface ShipSelectorProps {
  capitalShip: Ship | null;
  startingLineup: Ship[];
  reinforcements: Ship[];
  onAddUnit: (ship: Ship, position: 'capital' | 'starting' | 'reinforcement') => void;
  onRemoveUnit: (shipId: string, position: 'capital' | 'starting' | 'reinforcement') => void;
  alignment: 'light' | 'dark';
  availableUnits: Ship[];
  isCounterSelector?: boolean; 
}

export const ShipSelector: React.FC<ShipSelectorProps> = ({
  capitalShip,
  startingLineup,
  reinforcements,
  onAddUnit,
  onRemoveUnit,
  alignment,
  availableUnits,
  isCounterSelector = false  // Lägg till denna med default värde
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'capital' | 'starting' | 'reinforcement'>('capital');

  const handleSelectShip = useCallback((
    e: React.MouseEvent,
    ship: Ship, 
    position: 'capital' | 'starting' | 'reinforcement'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const normalizedShip = {
      id: ship.id,
      name: ship.name,
      type: ship.type,
      isCapital: ship.isCapital,
      alignment: ship.alignment
    };

    onAddUnit(normalizedShip, position);
    setShowSearch(false);
  }, [onAddUnit]);

  const handleSearchClick = (e: React.MouseEvent, mode: 'capital' | 'starting' | 'reinforcement') => {
    e.preventDefault();
    e.stopPropagation();
    setSelectionMode(mode);
    setShowSearch(true);
  };

  const filteredShips = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    const selectedIds = new Set([
        capitalShip?.id,
        ...startingLineup.map(s => s.id),
        ...reinforcements.map(s => s.id)
    ]);

    return availableUnits.filter(ship => {
        const matchesSearch = !searchTerm || ship.name.toLowerCase().includes(searchLower);
        const isNotSelected = !selectedIds.has(ship.id);
        const matchesAlignment = ship.alignment === alignment;
        
        // Om det är counter selector, skip type checking
        if (isCounterSelector) {
            return matchesSearch && isNotSelected && matchesAlignment;
        }
        
        // Annars behåll original logik för Add Defense
        const matchesType = selectionMode === 'capital' ? ship.isCapital : !ship.isCapital;
        return matchesSearch && isNotSelected && matchesAlignment && matchesType;
    });
}, [searchTerm, availableUnits, capitalShip, startingLineup, reinforcements, alignment, isCounterSelector, selectionMode]);

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
          placeholder="Search ships..."
        />

        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-gray-900 border border-white/10 rounded-lg shadow-lg max-h-64 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-2 border-b border-white/10">
              <span className="text-sm text-white/60">
                Select {selectionMode === 'capital' ? 'Capital Ship' : 'Ship'}
              </span>
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

            {filteredShips.length > 0 ? (
              filteredShips.map((ship) => (
                <div
                  key={ship.id}
                  className="p-3 hover:bg-white/5 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UnitImage
                        id={ship.id}
                        name={ship.name}
                        type={ship.isCapital ? 'capital-ship' : 'ship'}
                        size="sm"
                        className="rounded-full border-2 border-white/20"
                      />
                      <div>
                        <div className="text-white">{ship.name}</div>
                        <div className="text-sm text-white/60">
                          {ship.isCapital ? 'Capital Ship' : 'Ship'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleSelectShip(e, ship, selectionMode)}
                      className="px-3 py-1 text-sm rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                    >
                      Add {selectionMode === 'reinforcement' ? 'Reinforcement' : ''}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-white/60 text-center">
                No matching ships found
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Capital Ship */}
      <div>
        <h3 className="text-sm font-medium text-white/60 mb-2 flex items-center gap-2">
          <Anchor className="w-4 h-4" />
          Capital Ship
        </h3>
        <div className="relative group inline-block">
          {capitalShip ? (
            <div className="relative">
              <UnitImage
                id={capitalShip.id}
                name={capitalShip.name}
                type="capital-ship"
                size="lg"
                className="rounded-full border-2 border-blue-400"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveUnit(capitalShip.id, 'capital');
                }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => handleSearchClick(e, 'capital')}
              className="w-16 h-16 rounded-full border-2 border-dashed border-blue-400/40 flex items-center justify-center hover:border-blue-400/60 transition-colors"
            >
              <span className="text-blue-400/60">+</span>
            </button>
          )}
        </div>
      </div>

      {/* Starting Lineup */}
      <div>
        <h3 className="text-sm font-medium text-white/60 mb-2">Starting Lineup</h3>
        <div className="flex flex-wrap gap-4">
          {startingLineup.map((ship) => (
            <div key={ship.id} className="relative group">
              <UnitImage
                id={ship.id}
                name={ship.name}
                type="ship"
                size="md"
                className="rounded-full border-2 border-white/20"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveUnit(ship.id, 'starting');
                }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
          {startingLineup.length < 3 && (
            <button
              onClick={(e) => handleSearchClick(e, 'starting')}
              className="w-12 h-12 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center hover:border-white/40 transition-colors"
            >
              <span className="text-white/40">+</span>
            </button>
          )}
        </div>
      </div>

      {/* Reinforcements */}
      <div>
        <h3 className="text-sm font-medium text-white/60 mb-2">Reinforcements</h3>
        <div className="flex flex-wrap gap-4">
        {reinforcements.map((ship, index) => (
            <div key={ship.id} className="relative group">
              <div className="relative">
                <UnitImage
                  id={ship.id}
                  name={ship.name}
                  type="ship"
                  size="md"
                  className="rounded-full border-2 border-white/20"
                />
                <div className="absolute -top-1 -left-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                  {index + 1}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveUnit(ship.id, 'reinforcement');
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            </div>
          ))}
          {reinforcements.length < 3 && (
            <button
              onClick={(e) => handleSearchClick(e, 'reinforcement')}
              className="w-12 h-12 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center hover:border-white/40 transition-colors"
            >
              <span className="text-white/40">+</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};