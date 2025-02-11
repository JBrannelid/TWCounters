import React, { ReactNode, useCallback } from 'react';
import { Users, Ship, Settings } from 'lucide-react';
import { Filters } from '@/types';
import { validateAndSanitizeFormField } from '@/lib/security/formValidation';
import { sanitizeInput } from '@/lib/security/Sanitizer';
import { ErrorBoundary } from 'react-error-boundary';

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
  // Secure view type validation
  const isValidView = (view: string): view is 'squads' | 'fleets' => {
    return ['squads', 'fleets'].includes(view);
  };

  // Secure handling of view changes with validation
  const handleViewChange = useCallback((view: 'squads' | 'fleets') => {
    // Validate the view type
    const validation = validateAndSanitizeFormField(view, 'view', {
      required: true,
      allowHTML: false
    });

    if (validation.isValid && isValidView(validation.sanitizedValue)) {
      onViewChange(validation.sanitizedValue);
    } else {
      console.error('Invalid view type:', view);
    }
  }, [onViewChange]);

  // Check if any filter is active with secure value checking
  const hasActiveFilters = useCallback(() => {
    try {
      return Boolean(
        sanitizeInput(String(filters.alignment)) !== 'null' || 
        filters.showTWOmicronOnly || 
        filters.showHardCounters || 
        filters.excludeGL ||        
        Boolean(sanitizeInput(filters.searchTerm))
      );
    } catch (error) {
      console.error('Error checking active filters:', error);
      return false;
    }
  }, [filters]);

  // Define secure button base styles
  const buttonBaseClass = `
    flex-1 sm:flex-auto 
    flex items-center justify-center gap-2 
    px-4 py-2 rounded-lg transition-colors
    min-w-[120px]
    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
    focus:ring-offset-space-darker
  `;

  const activeClass = 'bg-blue-500 text-white';
  const inactiveClass = 'bg-white/5 text-white hover:bg-white/10';

  return (
    <div 
      className="w-full space-y-4 max-w-4xl mx-auto" 
      role="search"
      aria-label="Territory Wars search panel"
    >
      {/* Search Container with proper ARIA roles */}
      <div 
        className="w-full relative" 
        style={{ zIndex: 1000 }}
        role="searchbox"
        aria-label="Search container"
      >
        {children}
      </div>

      {/* Navigation Buttons */}
      <div 
        className="flex flex-wrap gap-2" 
        role="tablist"
        aria-label="View selection"
      >
        <button
          onClick={() => handleViewChange('squads')}
          className={`${buttonBaseClass} ${
            activeView === 'squads' ? activeClass : inactiveClass
          }`}
          role="tab"
          aria-selected={activeView === 'squads'}
          aria-controls="squads-view"
          id="squads-tab"
        >
          <Users className="w-5 h-5" aria-hidden="true" />
          <span>Squads</span>
        </button>

        <button
          onClick={() => handleViewChange('fleets')}
          className={`${buttonBaseClass} ${
            activeView === 'fleets' ? activeClass : inactiveClass
          }`}
          role="tab"
          aria-selected={activeView === 'fleets'}
          aria-controls="fleets-view"
          id="fleets-tab"
        >
          <Ship className="w-5 h-5" aria-hidden="true" />
          <span>Fleets</span>
        </button>

        <button
          onClick={onOptionsClick}
          className={`${buttonBaseClass} ${
            hasActiveFilters() ? activeClass : inactiveClass
          }`}
          aria-expanded={hasActiveFilters()}
          aria-controls="filter-menu"
          aria-haspopup="dialog"
          type="button"
        >
        <Settings className="w-5 h-5" aria-hidden="true" />
        <span>Filters</span>
        </button>
      </div>

      {/* Hidden but semantically present panels for ARIA */}
      <div id="squads-view" role="tabpanel" aria-labelledby="squads-tab" hidden={activeView !== 'squads'} />
      <div id="fleets-view" role="tabpanel" aria-labelledby="fleets-tab" hidden={activeView !== 'fleets'} />
    </div>
  );
};

// Error boundary wrapper for the SearchPanel component
export const SecureSearchPanel: React.FC<SearchPanelProps> = (props) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="text-red-400 p-4">
          Error loading search panel. Please try refreshing the page.
        </div>
      }
    >
      <SearchPanel {...props} />
    </ErrorBoundary>
  );
};