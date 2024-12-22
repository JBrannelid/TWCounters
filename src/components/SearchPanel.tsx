import React, { ReactNode } from 'react';
import { Users, Ship, Settings } from 'lucide-react';
import { Filters } from '@/types';

interface SearchPanelProps {
  activeView: 'squads' | 'fleets';
  onViewChange: (view: 'squads' | 'fleets') => void;
  onOptionsClick: () => void;
  filters: Filters;
  children?: ReactNode;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  activeView,
  onViewChange,
  onOptionsClick,
  filters,
  children
}) => {
  const buttonBaseClass = `
    flex-1 sm:flex-auto 
    flex items-center justify-center gap-2 
    px-4 py-2 rounded-lg transition-colors
    min-w-[120px]
  `;

  const activeClass = 'bg-blue-500 text-white';
  const inactiveClass = 'bg-white/5 text-white hover:bg-white/10';

  return (
    <div className="w-full space-y-4 max-w-4xl mx-auto">
      {/* Search Bar */}
      <div className="w-full">
        {children}
      </div>

      {/* Buttons Container */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onViewChange('squads')}
          className={`${buttonBaseClass} ${
            activeView === 'squads' ? activeClass : inactiveClass
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="whitespace-nowrap">Squads</span>
        </button>

        <button
          onClick={() => onViewChange('fleets')}
          className={`${buttonBaseClass} ${
            activeView === 'fleets' ? activeClass : inactiveClass
          }`}
        >
          <Ship className="w-5 h-5" />
          <span className="whitespace-nowrap">Fleets</span>
        </button>

        <button
          onClick={onOptionsClick}
          className={`${buttonBaseClass} ${
            filters.alignment || filters.showTWOmicronOnly
              ? activeClass
              : inactiveClass
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="whitespace-nowrap">Filters</span>
        </button>
      </div>
    </div>
  );
};