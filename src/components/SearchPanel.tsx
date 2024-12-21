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
    <GlassCard variant="darker" className="sticky top-0 z-30 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            {children}
          </div>

          {/* View Toggles */}
          <div className="flex gap-2">
            <GlassCard
              variant="light"
              glowColor={activeView === 'squads' ? 'blue' : 'none'}
              isInteractive
              isSelected={activeView === 'squads'}
              onClick={() => onViewChange('squads')}
              className="flex items-center gap-2 px-6 py-2.5"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Squads</span>
            </GlassCard>

            <GlassCard
              variant="light"
              glowColor={activeView === 'fleets' ? 'blue' : 'none'}
              isInteractive
              isSelected={activeView === 'fleets'}
              onClick={() => onViewChange('fleets')}
              className="flex items-center gap-2 px-6 py-2.5"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Ship className="w-5 h-5" />
              <span className="font-medium">Fleets</span>
            </GlassCard>

            <GlassCard
              variant="light"
              glowColor={hasActiveFilters ? 'blue' : 'none'}
              isInteractive
              isSelected={hasActiveFilters}
              onClick={onOptionsClick}
              className="flex items-center gap-2 px-6 py-2.5"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Settings className={`w-5 h-5 ${hasActiveFilters ? 'text-blue-400' : ''}`} />
              <span className="font-medium">Filters</span>
              {hasActiveFilters && (
                <motion.div
                  className="w-2 h-2 rounded-full bg-blue-400"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                  }}
                />
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};