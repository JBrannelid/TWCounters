import React from 'react';
import { Search, Ship, Users } from 'lucide-react';
import { BattleType, Filters } from '../types';

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
  const handleBattleTypeChange = (type: BattleType) => {
    onFilterChange('battleType', type === filters.battleType ? null : type);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search squads..."
              value={filters.searchTerm}
              onChange={(e) => onFilterChange('searchTerm', e.target.value)}
              onFocus={onSearchFocus}
              onBlur={onSearchBlur}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white bg-opacity-10 border border-white border-opacity-20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleBattleTypeChange('squad')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              filters.battleType === 'squad' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white bg-opacity-10 text-white hover:bg-opacity-20'
            }`}
          >
            <Users className="w-5 h-5" />
            Squads
          </button>
          <button
            onClick={() => handleBattleTypeChange('fleet')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              filters.battleType === 'fleet'
                ? 'bg-blue-500 text-white'
                : 'bg-white bg-opacity-10 text-white hover:bg-opacity-20'
            }`}
          >
            <Ship className="w-5 h-5" />
            Fleets
          </button>
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              (filters.alignment || filters.showTWOmicronOnly)
                ? 'bg-blue-500 text-white'
                : 'bg-white bg-opacity-10 text-white hover:bg-opacity-20'
            }`}
          >
            Options
          </button>
        </div>
      </div>
    </div>
  );
};