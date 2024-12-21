import { useState, useCallback, useMemo, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Character, Ship } from '@/types';
import { UnitImage } from './ui/UnitImage';
import { motion, AnimatePresence } from 'framer-motion';

export type SelectionType = 
  | 'leader' 
  | 'member' 
  | 'capital' 
  | 'starting'
  | 'reinforcement';

export interface UnitSelectorProps<T extends Ship | Character> {
  type: T extends Ship ? 'ship' : 'character';
  isOpen: boolean;
  onClose: () => void;
  onSelect: (unit: T) => void;
  availableUnits: T[];
  alignment: 'light' | 'dark';
  selectionType: SelectionType;
  title?: string;
  isCounterContext?: boolean;
}

export function UnitSelector<T extends Ship | Character>({
  type,
  isOpen,
  onClose,
  onSelect,
  availableUnits,
  alignment,
  selectionType,
  title = 'Select Unit',
  isCounterContext
}: UnitSelectorProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUnits = useMemo(() => {
    if (!availableUnits?.length) {
      return [];
    }

    return availableUnits.filter(unit => {
      const matchesSearch = !searchTerm || unit.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Ship-specific filtering
      if (type === 'ship') {
        const ship = unit as Ship;
        
        // Om det är counter context, inkludera capital ships
        if (isCounterContext) {
          return matchesSearch && ship.isCapital; // Allow all ships, including capital ships
        }

        // Om selectionType är 'capital', inkludera kapitalfartyg
        if (selectionType === 'capital') {
          return matchesSearch && ship.isCapital;
        }
      }
      return matchesSearch;
  });
}, [availableUnits, searchTerm, alignment, type, selectionType, isCounterContext]);

  useEffect(() => {
    console.log('UnitSelector mounted/updated:', {
      type,
      alignment,
      availableUnitsCount: availableUnits.length,
      selectionType,
      firstUnitName: availableUnits[0]?.name,
      filteredCount: filteredUnits.length
    });
  }, [type, alignment, availableUnits, selectionType, filteredUnits]);

  useEffect(() => {
    console.log('Available Units:', availableUnits);
  }, [availableUnits]);

// I UnitSelector.tsx
const handleSelect = useCallback((unit: T) => {
  onSelect(unit);
  // Låt parent komponenten hantera stängning
}, [onSelect]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md bg-space-darker rounded-lg border border-white/10"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">
                {title}
              </h3>
              <button 
                onClick={onClose}
                className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-between items-center p-2 border-b border-white/10">
              <span className="text-sm font-titillium text-white/60">
                Select {selectionType === 'leader' ? 'Leader' : 'Unit'}
              </span>
            </div>

            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                         text-white placeholder-white/40"
                  placeholder={`Search ${type}s...`}
                  autoFocus
                />
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  {filteredUnits.length > 0 ? (
                    filteredUnits.map(unit => (
                      <motion.button
                        key={unit.id}
                        onClick={() => handleSelect(unit)}
                        className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg 
                               text-left transition-colors"
                        whileHover={{ x: 4 }}
                      >
                        <UnitImage
                          id={unit.id}
                          name={unit.name}
                          type={type === 'character' 
                            ? (selectionType === 'leader' ? 'squad-leader' : 'squad-member')
                            : (selectionType === 'capital' ? 'capital-ship' : 'ship')
                          }
                          size="sm"
                          className="rounded-full border-2 border-blue-500/50"
                          isLeader={selectionType === 'leader'}
                          isCapital={selectionType === 'capital'}
                        />
                        <div>
                          <div className="text-white">{unit.name}</div>
                          {'role' in unit && (
                            <div className="text-sm text-white/60">{(unit as Character).role}</div>
                          )}
                          {'isCapital' in unit && unit.isCapital && (
                            <div className="text-sm text-blue-400">Capital Ship</div>
                          )}
                        </div>
                      </motion.button>
                    ))
                  ) : (
                    <div className="text-center text-white/60 py-4">
                      {searchTerm.trim() 
                        ? `No ${type}s found matching "${searchTerm}"`
                        : `No ${type}s available`
                      }
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}