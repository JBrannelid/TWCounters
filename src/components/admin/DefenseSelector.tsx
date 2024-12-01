import React, { useState, useCallback } from 'react';
import { Squad, Fleet } from '@/types';
import { Search, X } from 'lucide-react';
import { UnitImage } from '../ui/UnitImage';
import { motion, AnimatePresence } from 'framer-motion';

interface DefenseSelectorProps {
  units: (Squad | Fleet)[];
  selectedUnit: Squad | Fleet | null;
  onSelect: (unit: Squad | Fleet | null) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const DefenseSelector: React.FC<DefenseSelectorProps> = ({
  units,
  selectedUnit,
  onSelect,
  placeholder = "Search for a squad or fleet...",
  onFocus,
  onBlur
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredUnits = units.filter(unit =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFocus = useCallback(() => {
    setIsOpen(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Prevent closing if clicking inside the dropdown
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsOpen(false);
    onBlur?.();
  }, [onBlur]);

  const handleSelect = useCallback((unit: Squad | Fleet) => {
    onSelect(unit);
    setIsOpen(false);
    setSearchTerm('');
  }, [onSelect]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setSearchTerm('');
  }, [onSelect]);

  return (
    <div 
      className="relative"
      onFocus={handleFocus}
      onBlur={handleBlur}
      tabIndex={-1}
    >
      {/* Selected Unit or Search Input */}
      <div className="relative">
        {selectedUnit ? (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-lg"
          >
            <UnitImage
              id={selectedUnit.id}
              name={selectedUnit.name}
              type={'leader' in selectedUnit ? 'squad-leader' : 'capital-ship'}
              size="sm"
            />
            <span className="text-white">{selectedUnit.name}</span>
            <button
              onClick={handleClear}
              className="ml-auto p-1 text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              placeholder={placeholder}
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && !selectedUnit && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-space-darker border border-white/10 
                     rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredUnits.length > 0 ? (
              filteredUnits.map(unit => (
                <motion.button
                  key={unit.id}
                  onClick={() => handleSelect(unit)}
                  className="w-full flex items-center gap-2 p-2 hover:bg-white/5 text-left"
                  whileHover={{ x: 4 }}
                >
                  <UnitImage
                    id={unit.id}
                    name={unit.name}
                    type={'leader' in unit ? 'squad-leader' : 'capital-ship'}
                    size="sm"
                  />
                  <div>
                    <span className="text-white">{unit.name}</span>
                    <span className="text-sm text-white/40 block">
                      {'leader' in unit ? 'Squad' : 'Fleet'}
                    </span>
                  </div>
                </motion.button>
              ))
            ) : (
              <div className="p-4 text-white/60 text-center">
                {searchTerm ? 'No units found' : 'Type to search...'}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};