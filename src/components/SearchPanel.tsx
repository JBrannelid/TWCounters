import React, { ReactNode } from 'react';
import { Users, Ship, Settings } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { Filters } from '@/types';
import { motion } from 'framer-motion';

interface SearchPanelProps {
  activeView: 'squads' | 'fleets';
  onViewChange: (view: 'squads' | 'fleets') => void;
  onOptionsClick: () => void;
  filters: Filters;
  children?: ReactNode;
  placeholder?: string; // Gjort valfri
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  activeView,
  onViewChange,
  onOptionsClick,
  filters,
  children
}) => {
  const hasActiveFilters = Boolean(
    filters.alignment || 
    filters.showTWOmicronOnly || 
    filters.showHardCounters || 
    filters.excludeGL
  );

  return (
    <div className="w-full space-y-4">
      {/* Search Bar */}
      <div className="w-full">
        {children}
      </div>

      {/* Buttons Container */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onViewChange('squads')}
          className={`flex-1 sm:flex-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors
            ${activeView === 'squads' 
              ? 'bg-blue-500 text-white' 
              : 'bg-white/5 text-white hover:bg-white/10'}
            min-w-[120px]`}
        >
          <Users className="w-5 h-5" />
          <span className="whitespace-nowrap">Squads</span>
        </button>

        <button
          onClick={() => onViewChange('fleets')}
          className={`flex-1 sm:flex-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors
            ${activeView === 'fleets' 
              ? 'bg-blue-500 text-white' 
              : 'bg-white/5 text-white hover:bg-white/10'}
            min-w-[120px]`}
        >
          <Ship className="w-5 h-5" />
          <span className="whitespace-nowrap">Fleets</span>
        </button>

        <button
          onClick={onOptionsClick}
          className={`flex-1 sm:flex-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors
            ${hasActiveFilters 
              ? 'bg-blue-500 text-white' 
              : 'bg-white/5 text-white hover:bg-white/10'}
            min-w-[120px]`}
        >
          <Settings className="w-5 h-5" />
          <span className="whitespace-nowrap">Filters</span>
        </button>
      </div>
    </div>
  );
};