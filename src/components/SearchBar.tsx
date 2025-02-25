import { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Squad, Fleet } from '@/types';
import { UnitImage } from './ui/UnitImage';
import { validateAndSanitizeFormField } from '@/lib/security/formValidation';
import { sanitizeInput, sanitizeSearchQuery } from '@/lib/security/Sanitizer';

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
  const [lastValidValue, setLastValidValue] = useState(value);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // safe search query value after validation and sanitization and keep last valid value
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validation = validateAndSanitizeFormField(e.target.value, 'search', {
      maxLength: 100,
      isSearch: true,
      allowHTML: false
    });

    if (validation.isValid) {
      // Safe search query value after validation and sanitization 
      const sanitizedQuery = sanitizeSearchQuery(validation.sanitizedValue);
      setLastValidValue(sanitizedQuery);
      setValidationError(null);
      onChange(sanitizedQuery);
    } else {
      setValidationError(validation.error || 'Invalid search input');
      // keep last valid value
      e.target.value = lastValidValue;
    }
  };

  // Filtrera suggestions base on search query
  const filteredSuggestions = useMemo(() => {
    const sanitizedValue = sanitizeSearchQuery(value.trim().toLowerCase());
    if (sanitizedValue === '') {
      return suggestions.slice(0, 30);
    }
    return suggestions
      .filter(item => item.name.toLowerCase().includes(sanitizedValue))
      .slice(0, 4);
  }, [suggestions, value]);

  // Safe keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Prevent XSS attack via keyboard events
    const safeKey = sanitizeInput(e.key);
    
    switch (safeKey) {
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
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          className={`w-full pl-10 pr-10 py-2 bg-white/5 border 
                     ${validationError ? 'border-red-500' : 'border-white/10'} 
                     rounded-lg text-white placeholder-white/40 focus:outline-none 
                     focus:ring-2 focus:ring-blue-400/50 focus:border-transparent 
                     font-titillium`}
          placeholder={placeholder}
          aria-label="Search"
          role="searchbox"
          aria-autocomplete="list"
          maxLength={100}
          pattern="[a-zA-Z0-9\s-_]*"
          aria-invalid={!!validationError}
          aria-errormessage={validationError ? 'search-error' : undefined}
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

        {validationError && (
          <div 
            id="search-error"
            className="absolute -bottom-6 left-0 text-sm text-red-400"
            role="alert"
          >
            {validationError}
          </div>
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
                      rounded-lg shadow-lg max-h-60 overflow-x-hidden custom-scrollbar z-50"
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