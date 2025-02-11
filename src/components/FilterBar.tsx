import React, { useState } from 'react';
import { Search, Ship, Users } from 'lucide-react';
import { BattleType, Filters } from '../types';
import { validateAndSanitizeFormField } from '@/lib/security/formValidation';
import { sanitizeInput, sanitizeSearchQuery } from '@/lib/security/Sanitizer';

interface FilterBarProps {
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: any) => void;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  showFilterMenu: boolean;
  setShowFilterMenu: (show: boolean) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onSearchFocus,
  onSearchBlur,
  showFilterMenu,
  setShowFilterMenu,
}) => {
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Secure handling of battle type changes with input validation
    const handleBattleTypeChange = (type: BattleType) => {
    // Validate the battle type value
    const validation = validateAndSanitizeFormField(type, 'battleType', {
      required: true,
      allowHTML: false
    });

    if (validation.isValid) {
      // If the same type is selected, reset to null (toggle off)
      onFilterChange('battleType', type === filters.battleType ? null : type);
    } else {
      console.error('Invalid battle type:', type);
    }
  };

  // Secure search input handling with validation and sanitization
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validation = validateAndSanitizeFormField(e.target.value, 'search', {
      maxLength: 100,
      isSearch: true,
      allowHTML: false
    });

    if (validation.isValid) {
      // Additional security by sanitizing the search query
      const sanitizedQuery = sanitizeSearchQuery(validation.sanitizedValue);
      onFilterChange('searchTerm', sanitizedQuery);
      setShowSuggestions(Boolean(sanitizedQuery));
    } else {
      // If validation fails, clear the search term
      onFilterChange('searchTerm', '');
      setShowSuggestions(false);
      console.error('Invalid search input:', validation.error);
    }
  };

  const handleSearchFocus = () => {
    setShowSuggestions(Boolean(filters.searchTerm));
    onSearchFocus();
  };

  const handleSearchBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
    onSearchBlur();
  };

  // Secure filter menu toggle with input sanitization
  const handleFilterMenuToggle = () => {
    // Sanitize the current state before toggling
    const currentState = sanitizeInput(String(!showFilterMenu));
    setShowFilterMenu(currentState === 'true');
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-6">
        {/* Search Input with Security Measures */}
        <div className="flex-1 relative">
          <div className="relative">
            <input
              type="search"
              placeholder="Search squads..."
              value={filters.searchTerm}
              onChange={handleSearchChange}
              onFocus={onSearchFocus}
              onBlur={onSearchBlur}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white bg-opacity-10 
                       border border-white border-opacity-20 text-white 
                       placeholder-gray-400 focus:outline-none focus:ring-2 
                       focus:ring-blue-500"
              maxLength={100}
              pattern="[a-zA-Z0-9\s-_]*"
              aria-label="Search squads or fleets"
              role="searchbox"
              aria-expanded={showSuggestions}
              aria-controls="search-suggestions"
              aria-owns="search-suggestions"
            />
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" aria-hidden="true" />
          </div>
        </div>
        
        {/* Battle Type Filters with Security Measures */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleBattleTypeChange('squad')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              filters.battleType === 'squad' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white bg-opacity-10 text-white hover:bg-opacity-20'
            }`}
            aria-pressed={filters.battleType === 'squad'}
            role="switch"
          >
            <Users className="w-5 h-5" />
            <span>Squads</span>
          </button>
          
          <button
            onClick={() => handleBattleTypeChange('fleet')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              filters.battleType === 'fleet'
                ? 'bg-blue-500 text-white'
                : 'bg-white bg-opacity-10 text-white hover:bg-opacity-20'
            }`}
            aria-pressed={filters.battleType === 'fleet'}
            role="switch"
          >
            <Ship className="w-5 h-5" aria-hidden="true" />
            <span>Fleets</span>
          </button>
          
          {/* Filter Menu Toggle with Security */}
          <button
            onClick={handleFilterMenuToggle}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              (filters.alignment || filters.showTWOmicronOnly)
                ? 'bg-blue-500 text-white'
                : 'bg-white bg-opacity-10 text-white hover:bg-opacity-20'
            }`}
            aria-expanded={showFilterMenu}
            aria-controls="filter-menu"
            aria-label="Filter options"
          >
            Options
          </button>
        </div>
      </div>
    </div>
  );
};

// Type guard for battle type validation
function isValidBattleType(value: string): value is BattleType {
  return ['squad', 'fleet'].includes(value);
}