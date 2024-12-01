import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Character, Ship } from '@/types';
import { UnitImage } from './UnitImage';
import { getImageDimensions } from '@/lib/imageUtils';
import debounce from 'lodash/debounce';

interface UnitSlotProps {
  unit?: Character | Ship | null;
  type: 'character' | 'ship';
  isLeader?: boolean;
  isCapital?: boolean;
  onAdd?: (unit: Character | Ship) => void;
  onRemove?: () => void;
  availableUnits: (Character | Ship)[];
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  disableSelector?: boolean;
}

export const UnitSlot: React.FC<UnitSlotProps> = React.memo(({
  unit,
  type,
  isLeader,
  isCapital,
  onAdd,
  onRemove,
  availableUnits,
  readonly = false,
  size = 'md',
  disableSelector = false
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { containerClass } = getImageDimensions(size);

  useEffect(() => {
    if (!showSearch) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearch]);

  useEffect(() => {
    setImageLoaded(false);
  }, [unit]);

  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
    }, 300),
    []
  );

  const filterUnit = useCallback((unit: Ship | Character, term: string) => {
    return unit.name.toLowerCase().includes(term.toLowerCase());
  }, []);

  const filteredUnits = useMemo(() => {
    if (!searchTerm.trim() || readonly || disableSelector) return [];
    
    if (!Array.isArray(availableUnits) || availableUnits.length === 0) {
      return [];
    }

    const term = searchTerm.toLowerCase();
    return availableUnits.filter(unit => filterUnit(unit, term));
  }, [availableUnits, searchTerm, readonly, disableSelector, filterUnit]);

  const getUnitType = () => {
    if (type === 'character') {
      return isLeader ? 'squad-leader' : 'squad-member';
    }
    return isCapital ? 'capital-ship' : 'ship';
  };

  const renderUnit = () => {
    if (!unit) return null;

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: imageLoaded ? 1 : 0 }}
        className={`relative group ${containerClass}`}
      >
        <UnitImage
          id={unit.id}
          name={unit.name}
          type={getUnitType()}
          size={size}
          isLeader={isLeader}
          isCapital={isCapital}
          withTooltip={true}
          onLoad={() => setImageLoaded(true)}
          className={cn(
            "transition-all duration-200",
            !imageLoaded && "opacity-0",
            (isLeader || isCapital) && "ring-2 ring-blue-400/60"
          )}
        />
        
        {!readonly && onRemove && imageLoaded && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full 
                     flex items-center justify-center hover:bg-red-600
                     opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <X className="w-3 h-3 text-white" />
          </motion.button>
        )}
      </motion.div>
    );
  };

  const renderPlaceholder = () => {
    if (unit && !imageLoaded) {
      return (
        <div className={cn(
          "absolute inset-0",
          "animate-pulse bg-white/10 rounded-full",
          containerClass
        )} />
      );
    }
    
    if (!readonly && !unit) {
      return (
        <motion.button
          onClick={() => {
            if (disableSelector && onAdd) {
              onAdd(undefined as any);
            } else if (!disableSelector) {
              setShowSearch(true);
            }
          }}
          className={cn(
            containerClass,
            "rounded-full flex items-center justify-center border-2 border-dashed",
            (isLeader || isCapital) 
              ? "border-blue-400/40 hover:border-blue-400/60" 
              : "border-white/20 hover:border-white/40"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4 text-white/40" />
        </motion.button>
      );
    }
    
    return null;
  };

  return (
    <div className="relative inline-block" ref={searchRef}>
      <AnimatePresence mode="wait">
        {showSearch && !disableSelector ? (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 w-64 bg-space-darker border border-white/10 rounded-lg shadow-lg"
          >
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search..."
                  onChange={(e) => debouncedSetSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg 
                           text-white placeholder-white/40"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              {filteredUnits.map((unit) => (
                <motion.button
                  key={unit.id}
                  onClick={() => {
                    onAdd?.(unit);
                    setShowSearch(false);
                    setSearchTerm('');
                  }}
                  className="w-full p-2 flex items-center gap-2 hover:bg-white/5 text-left"
                  whileHover={{ x: 4 }}
                >
                  <div className="flex-shrink-0">
                    <UnitImage
                      id={unit.id}
                      name={unit.name}
                      type={getUnitType()}
                      size="sm"
                      withTooltip={false}
                    />
                  </div>
                  <span className="text-white">{unit.name}</span>
                </motion.button>
              ))}
              {filteredUnits.length === 0 && searchTerm.trim() !== '' && (
                <div className="p-3 text-white/60 text-center">
                  No {type}s found
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="relative">
            {renderUnit()}
            {renderPlaceholder()}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

UnitSlot.displayName = 'UnitSlot';