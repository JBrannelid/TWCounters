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
  placeholder: string;
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
    <GlassCard variant="darker" className="sticky top-0 z-30 w-full">
      <div className="w-full max-w-7xl mx-auto px-4 py-4">
        {/* Wrap everything in a flex container */}
        <div className="flex flex-col w-full gap-4">
          {/* Search Bar Container */}
          <div className="w-full">
            {children}
          </div>

          {/* Buttons Container */}
          <div className="flex flex-wrap gap-2 w-full">
            {/* Squad Button */}
            <div className="flex-1 min-w-[120px] sm:flex-none">
              <GlassCard
                variant="light"
                glowColor={activeView === 'squads' ? 'blue' : 'none'}
                isInteractive
                isSelected={activeView === 'squads'}
                onClick={() => onViewChange('squads')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Users className="w-5 h-5" />
                <span className="whitespace-nowrap">Squads</span>
              </GlassCard>
            </div>

            {/* Fleet Button */}
            <div className="flex-1 min-w-[120px] sm:flex-none">
              <GlassCard
                variant="light"
                glowColor={activeView === 'fleets' ? 'blue' : 'none'}
                isInteractive
                isSelected={activeView === 'fleets'}
                onClick={() => onViewChange('fleets')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Ship className="w-5 h-5" />
                <span className="whitespace-nowrap">Fleets</span>
              </GlassCard>
            </div>

            {/* Filters Button */}
            <div className="flex-1 min-w-[120px] sm:flex-none">
              <GlassCard
                variant="light"
                glowColor={hasActiveFilters ? 'blue' : 'none'}
                isInteractive
                isSelected={hasActiveFilters}
                onClick={onOptionsClick}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Settings className="w-5 h-5" />
                <span className="whitespace-nowrap">Filters</span>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};