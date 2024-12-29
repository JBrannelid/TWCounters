import { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUnitImage } from '@/lib/imageUtils';
import { Squad, Fleet } from '@/types';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  suggestions?: (Squad | Fleet)[];
  onSelectSuggestion?: (item: Squad | Fleet) => void;
  placeholder?: string;
}

export const SearchBar = memo<SearchBarProps>(({
  value,
  onChange,
  onClear,
  suggestions = [],
  onSelectSuggestion,
  placeholder = "Search teams..."
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

// Filter suggestions based on search value
const filteredSuggestions = useMemo(() => {
  // Om value är tomt, visa max 4 förslag
  if (value.trim() === '') {
    return suggestions.slice(0, 3);
  }
  // Filtrera baserat på användarens inmatning
  return suggestions
    .filter(item => item.name.toLowerCase().includes(value.toLowerCase()))
    .slice(0, 4); // Visa max 10 matchande resultat
}, [suggestions, value]);

  // Load images for suggestions
  useEffect(() => {
    const loadImages = async () => {
      const urls: Record<string, string> = {};
      for (const item of filteredSuggestions) {
        try {
          if ('leader' in item && item.leader) {
            urls[item.leader.id] = await getUnitImage(item.leader.id, 'squad-leader');
          } else if ('capitalShip' in item && item.capitalShip) {
            urls[item.capitalShip.id] = await getUnitImage(item.capitalShip.id, 'capital-ship');
          }
        } catch (error) {
          console.error(`Failed to load image for suggestion:`, error);
          urls[item.id] = '/placeholder.png';
        }
      }
      setImageUrls(urls);
    };

    if (filteredSuggestions.length > 0) {
      loadImages();
    }
  }, [filteredSuggestions]);

  // Handle selection of an item
  const handleSelect = useCallback((unit: Squad | Fleet) => {
    onSelectSuggestion?.(unit);
    setIsFocused(false);
    onChange(unit.name);
  }, [onSelectSuggestion, onChange]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full"
      style={{ position: 'relative', zIndex: 9999 }}
    >
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg 
                   text-white placeholder-white/40 focus:outline-none focus:ring-2 
                   focus:ring-blue-400/50 focus:border-transparent font-titillium"
          placeholder={placeholder}
        />
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
        
        {value && (
          <button
            onClick={() => {
              onClear();
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 
                     text-white/40 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isFocused && filteredSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute w-full mt-2"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 9999,
              backgroundColor: '#12151C',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0.5rem',
              maxHeight: '300px',
              overflowY: 'auto',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          >
            {filteredSuggestions.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 
                         transition-colors text-left"
              >
                {'leader' in item && item.leader ? (
                  <img
                    src={imageUrls[item.leader.id] || '/placeholder.png'}
                    alt={item.leader.name}
                    className="w-8 h-8 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : 'capitalShip' in item && item.capitalShip ? (
                  <img
                    src={imageUrls[item.capitalShip.id] || '/placeholder.png'}
                    alt={item.capitalShip.name}
                    className="w-8 h-8 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : null}
                <div>
                  <div className="text-white font-titillium">{item.name}</div>
                  <div className="text-sm text-white/40 font-titillium">
                    {'leader' in item ? 'Squad' : 'Fleet'}
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

SearchBar.displayName = 'SearchBar';