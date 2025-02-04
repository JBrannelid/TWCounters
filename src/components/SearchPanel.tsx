import React, { ReactNode } from 'react';
import { Users, Ship, Settings } from 'lucide-react';
import { Filters } from '@/types';

// SearchPanel component to display the search bar and view selection buttons 
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
  // Check if any filter is active
  const hasActiveFilters = 
    filters.alignment !== null || 
    filters.showTWOmicronOnly || 
    filters.showHardCounters || 
    filters.excludeGL ||        
    Boolean(filters.searchTerm);

  // Define the base styles for the buttons and the active/inactive classes
  const buttonBaseClass = `
    flex-1 sm:flex-auto 
    flex items-center justify-center gap-2 
    px-4 py-2 rounded-lg transition-colors
    min-w-[120px]
    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
    focus:ring-offset-space-darker
  `;

  const activeClass = 'bg-blue-500 text-white'; // Active button styles 
  const inactiveClass = 'bg-white/5 text-white hover:bg-white/10'; // Inactive button styles

  return (
    <div 
      className="w-full space-y-4 max-w-4xl mx-auto" 
      style={{ position: 'relative', zIndex: 100 }}
      role="search"
      aria-label="Territory Wars search panel"
    >
      {/* Search Container */}
      <div className="w-full relative" style={{ zIndex: 1000 }}>
        {children}
      </div>

      {/* Buttons Container */}
      <div 
        className="flex flex-wrap gap-2" 
        style={{ position: 'relative', zIndex: 50 }}
        role="tablist"
        aria-label="View selection"
      >
        <button
          onClick={() => onViewChange('squads')}
          className={`${buttonBaseClass} ${
            activeView === 'squads' ? activeClass : inactiveClass
          }`}
          role="tab"
          aria-selected={activeView === 'squads'}
          aria-controls="squads-panel"
          id="squads-tab"
        >
          <Users className="w-5 h-5" aria-hidden="true" />
          <span className="whitespace-nowrap">Squads</span>
        </button>

        <button
          onClick={() => onViewChange('fleets')}
          className={`${buttonBaseClass} ${
            activeView === 'fleets' ? activeClass : inactiveClass
          }`}
          role="tab"
          aria-selected={activeView === 'fleets'}
          aria-controls="fleets-panel"
          id="fleets-tab"
        >
          <Ship className="w-5 h-5" aria-hidden="true" />
          <span className="whitespace-nowrap">Fleets</span>
        </button>

        <button
          onClick={onOptionsClick}
          className={`${buttonBaseClass} ${
            hasActiveFilters ? activeClass : inactiveClass
          }`}
          aria-expanded={filters.alignment !== null || filters.showTWOmicronOnly}
          aria-haspopup="dialog"
          aria-label="Filter options"
        >
          <Settings className="w-5 h-5" aria-hidden="true" />
          <span className="whitespace-nowrap">Filters</span>
        </button>
      </div>

      {/* Hidden but semantically present panels for ARIA */}
      <div 
        role="tabpanel" 
        id="squads-panel" 
        aria-labelledby="squads-tab"
        className="sr-only"
      >
        Squad search content
      </div>
      <div 
        role="tabpanel" 
        id="fleets-panel" 
        aria-labelledby="fleets-tab"
        className="sr-only"
      >
        Fleet search content
      </div>
    </div>
  );
};