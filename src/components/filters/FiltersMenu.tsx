import React, { useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, X, SunMedium, Moon, RefreshCw } from 'lucide-react';
import { Filters, FilterKey } from '@/types';
import { createFocusTrap } from 'focus-trap';

interface FiltersMenuProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  onFilterChange: (key: FilterKey, value: Filters[FilterKey]) => void;
}

export const FiltersMenu: React.FC<FiltersMenuProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Hantera tangentbordsnavigering
  useEffect(() => {
    let trap: ReturnType<typeof createFocusTrap>;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      
      trap = createFocusTrap(menuRef.current!, {
        escapeDeactivates: true,
        allowOutsideClick: true,
        fallbackFocus: '[data-autofocus]'
      });
      trap.activate();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (trap) {
        trap.deactivate();
      }
    };
  }, [isOpen, onClose]);

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'searchTerm') return false;
    if (typeof value === 'boolean') return value;
    return value !== null;
  });

  // Filter categories with their options
  const filterCategories = useMemo(() => [
    {
      title: 'Alignment',
      id: 'alignment',
      options: [
        {
          key: 'alignment' as FilterKey,
          value: 'light',
          label: 'Light Side',
          icon: <SunMedium className="w-4 h-4" aria-hidden="true" />
        },
        {
          key: 'alignment' as FilterKey,
          value: 'dark',
          label: 'Dark Side',
          icon: <Moon className="w-4 h-4" aria-hidden="true" />
        }
      ]
    }
  ], []);

  const resetFilters = () => {
    onFilterChange('alignment', null);
    onFilterChange('showTWOmicronOnly', false);
    onFilterChange('showHardCounters', false);
    onFilterChange('excludeGL', false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isOpen ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 ${!isOpen && 'pointer-events-none'}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="filters-title"
    >
      <motion.div
        ref={menuRef}
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 right-0 w-full max-w-md flex flex-col 
                 bg-gradient-to-br from-space-darker/90 to-space-dark/90 
                 backdrop-blur-xl border-l border-white/10 shadow-2xl 
                 rounded-l-2xl overflow-hidden z-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Filter className={`w-5 h-5 ${hasActiveFilters ? 'text-blue-400' : 'text-white/60'}`} aria-hidden="true" />
            <h2 id="filters-title" className="text-xl font-orbitron text-white">Filters</h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Close filters"
            data-autofocus
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </motion.button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-8">
            {/* Filter Categories */}
            {filterCategories.map((category) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
                role="region"
                aria-labelledby={`category-${category.id}`}
              >
                <h3 id={`category-${category.id}`} className="text-sm font-titillium font-medium text-white/60">
                  {category.title}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {category.options.map((option) => (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onFilterChange(
                        option.key,
                        filters[option.key] === option.value ? null : option.value
                      )}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg 
                                border transition-all font-titillium ${
                        filters[option.key] === option.value
                          ? 'bg-blue-500/20 border-blue-400 text-white shadow-neon-blue'
                          : 'border-white/10 text-white/60 hover:bg-white/5'
                      }`}
                      aria-pressed={filters[option.key] === option.value}
                    >
                      {option.icon}
                      {option.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ))}

            {/* Toggle Options */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
              role="region"
              aria-labelledby="additional-options"
            >
              <h3 id="additional-options" className="text-sm font-titillium font-medium text-white/60">
                Additional Options
              </h3>
              <div className="space-y-3">
                {[
                  {
                    key: 'showTWOmicronOnly' as FilterKey,
                    label: 'TW Omicron Only',
                    description: 'Show only teams with Territory Wars Omicron abilities'
                  },
                  {
                    key: 'showHardCounters' as FilterKey,
                    label: 'Hard Counters Only',
                    description: 'Show only teams with reliable counter options'
                  },
                  {
                    key: 'excludeGL' as FilterKey,
                    label: 'Hide GL Counters',
                    description: 'Filter out counters that require Galactic Legend characters'
                  }
                ].map((option) => (
                  <motion.label
                    key={option.key}
                    whileHover={{ scale: 1.01 }}
                    className="flex items-start gap-3 p-4 rounded-lg border border-white/10 
                             hover:bg-white/5 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={filters[option.key] as boolean}
                      onChange={(e) => onFilterChange(option.key, e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 
                               checked:bg-blue-500 checked:border-blue-500 transition-colors
                               focus:ring-2 focus:ring-blue-400 focus:ring-offset-space-darker"
                    />
                    <div className="space-y-1">
                      <div className="font-titillium text-white group-hover:text-blue-400 
                                    transition-colors">
                        {option.label}
                      </div>
                      <div className="text-sm font-titillium text-white/40">
                        {option.description}
                      </div>
                    </div>
                  </motion.label>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="p-6 border-t border-white/10 bg-space-darker/90 backdrop-blur-xl">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className="flex items-center justify-center gap-2 w-full p-3 rounded-lg 
                     bg-white/5 text-white hover:bg-white/10 disabled:opacity-50 
                     disabled:cursor-not-allowed transition-colors font-titillium"
            aria-label="Reset all filters"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Reset All Filters
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};