import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { getUnitImage, getPlaceholderDataUrl } from '@/lib/imageUtils';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

export type ImageType = 'character' | 'squad-leader' | 'squad-member' | 'ship' | 'capital-ship';

// Cache the image URLs to avoid unnecessary network requests
const imageCache: Record<string, string> = {};

interface UnitImageProps {
  id: string;
  name: string;
  type: ImageType;
  size: 'sm' | 'md' | 'lg';
  className?: string;
  withTooltip?: boolean;
  isLeader?: boolean;
  isCapital?: boolean;
  onLoad?: () => void;
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8',   // 32x32px
  md: 'w-12 h-12', // 48x48px
  lg: 'w-16 h-16'  // 64x64px
};

export const UnitImage = memo<UnitImageProps>(({
  id,
  name,
  type,
  size = 'md',
  className = '',
  withTooltip = true,
  isLeader = false,
  isCapital = false,
  onLoad
}) => {
  const [imageUrl, setImageUrl] = useState<string>(() => 
    imageCache[id] || getPlaceholderDataUrl(size)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Memoize SIZE_CLASSES to avoid recalculating on every render
  const sizeClasses = useMemo(() => SIZE_CLASSES[size], [size]);

  // Check if device supports touch on mount
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window);
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const loadImage = async () => {
      // Return cached image if available
      if (imageCache[id]) {
        setImageUrl(imageCache[id]);
        setIsLoading(false);
        return;
      }

      try {
        const url = await getUnitImage(id, type);
        if (isMounted) {
          imageCache[id] = url; // Cache the image URL
          setImageUrl(url);
          setHasError(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error(`Error loading image for ${id}:`, error);
          setHasError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadImage();
    return () => { isMounted = false; };
  }, [id, type]);

    // Handle touch events
    const handleTouchStart = useCallback(() => {
      if (isTouchDevice && withTooltip) {
        setShowTooltip(true);
      }
    }, [isTouchDevice, withTooltip]);
  
    const handleTouchEnd = useCallback(() => {
      if (isTouchDevice) {
        setTimeout(() => setShowTooltip(false), 1500); // Hide after 1.5s
      }
    }, [isTouchDevice]);

    return (
      <div 
        className={cn(
          'relative group',
          'transition-all duration-300 ease-out',
          sizeClasses,
          className
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => !isTouchDevice && setShowTooltip(true)}
        onMouseLeave={() => !isTouchDevice && setShowTooltip(false)}
      >
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          decoding="async"
          className={cn(
            'w-full h-full',
            'object-cover rounded-full',
            'transition-opacity duration-300',
            isLoading ? 'opacity-0 blur-md' : 'opacity-100',
            hasError ? 'grayscale opacity-50' : ''
          )}
          onLoad={onLoad}
          onError={() => {
            setHasError(true);
            setImageUrl(getPlaceholderDataUrl(size));
          }}
        />
        
        {(isLeader || isCapital) && (
          <div 
            className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full 
                     flex items-center justify-center text-white text-xs font-bold
                     shadow-md"
          >
            {isLeader ? 'L' : 'C'}
          </div>
        )}
  
        <AnimatePresence>
          {withTooltip && showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 
                       bg-black/90 px-2 py-1 rounded text-xs text-white whitespace-nowrap 
                       z-10 pointer-events-none"
              style={{ minWidth: 'max-content' }}
            >
              {name}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  });
  
  UnitImage.displayName = 'UnitImage';
  
  export default UnitImage;