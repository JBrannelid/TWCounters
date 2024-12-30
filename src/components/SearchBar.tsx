import { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Squad, Fleet } from '@/types';
import { UnitImage } from './ui/UnitImage';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  suggestions?: (Squad | Fleet)[];
  onSelectSuggestion?: (item: Squad | Fleet) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const SearchBar = memo<SearchBarProps>(({
  value,
  onChange,
  onClear,
  suggestions = [],
  onSelectSuggestion,
  placeholder = "Search squads...",
  onFocus,
  onBlur
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on search value
  const filteredSuggestions = useMemo(() => {
    if (value.trim() === '') {
      return suggestions.slice(0, 3);
    }
    return suggestions
      .filter(item => item.name.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 4);
  }, [suggestions, value]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => prev > -1 ? prev - 1 : prev);
        break;
      case 'Enter':
        if (activeIndex >= 0 && filteredSuggestions[activeIndex]) {
          onSelectSuggestion?.(filteredSuggestions[activeIndex]);
          setIsFocused(false);
          setActiveIndex(-1);
        }
        break;
      case 'Escape':
        setIsFocused(false);
        setActiveIndex(-1);
        break;
    }
  }, [filteredSuggestions, activeIndex, onSelectSuggestion]);

  // Scroll active suggestion into view
  useEffect(() => {
    if (activeIndex >= 0 && suggestionsRef.current) {
      const activeElement = suggestionsRef.current.children[activeIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [activeIndex]);

  // Click outside handling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full"
      onKeyDown={handleKeyDown}
    >
      <div 
        className="relative"
        role="combobox"
        aria-expanded={isFocused}
        aria-haspopup="listbox"
        aria-controls="search-suggestions"
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg 
                   text-white placeholder-white/40 focus:outline-none focus:ring-2 
                   focus:ring-blue-400/50 focus:border-transparent font-titillium"
          placeholder={placeholder}
          aria-label="Search"
          role="searchbox"
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined
          }
        />
        <Search 
          className="absolute left-3 top-2.5 w-4 h-4 text-white/40" 
          aria-hidden="true"
        />
        
        {value && (
          <button
            onClick={() => {
              onClear();
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 
                     text-white/40 hover:text-white"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isFocused && filteredSuggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            id="search-suggestions"
            role="listbox"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute w-full mt-2 bg-space-darker border border-white/10 
                     rounded-lg shadow-lg max-h-60 overflow-y-auto z-50"
          >
            {filteredSuggestions.map((item, index) => (
              <motion.div
                key={item.id}
                id={`suggestion-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onClick={() => {
                  onSelectSuggestion?.(item);
                  setIsFocused(false);
                }}
                className={`flex items-center gap-2 p-2 cursor-pointer
                          ${index === activeIndex ? 'bg-white/10' : 'hover:bg-white/5'}
                          transition-colors`}
                whileHover={{ x: 4 }}
              >
                <UnitImage
                  id={item.id}
                  name={item.name}
                  type={'leader' in item ? 'squad-leader' : 'capital-ship'}
                  size="sm"
                  aria-hidden="true"
                />
                <div>
                  <span className="text-white">{item.name}</span>
                  <span className="text-sm text-white/40 block">
                    {'leader' in item ? 'Squad' : 'Fleet'}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

SearchBar.displayName = 'SearchBar';