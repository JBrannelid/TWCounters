import { useState, useEffect, useRef, memo, useMemo } from 'react';
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

// src/components/SearchBar.tsx
export const SearchBar = memo<SearchBarProps>(({
  value,
  onChange,
  onClear,
  suggestions = [],
  onSelectSuggestion,
  placeholder = "Search teams or ships..."
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // Begränsa antal förslag till 10 för bättre prestanda
  const filteredSuggestions = useMemo(() => 
    suggestions.length > 0 
      ? suggestions
          .filter(item => 
            item.name.toLowerCase().includes(value.toLowerCase())
          )
          .slice(0, 10)
      : [],
    [suggestions, value]
  );

  // Load images for suggestions
  useEffect(() => {
    const loadImages = async () => {
      const urls: Record<string, string> = {};
      for (const item of filteredSuggestions) {
        try {
          if ('leader' in item && item.leader) {
            urls[item.leader.id] = await getUnitImage(item.leader.id, 'character');
          } else if ('capitalShip' in item && item.capitalShip) {
            urls[item.capitalShip.id] = await getUnitImage(item.capitalShip.id, 'ship');
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

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
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

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isFocused && filteredSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-space-darker border border-white/10 
                     rounded-lg shadow-lg max-h-[300px] overflow-y-auto"
          >
            {filteredSuggestions.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (onSelectSuggestion) {
                    onSelectSuggestion(item);
                  }
                  setIsFocused(false);
                }}
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