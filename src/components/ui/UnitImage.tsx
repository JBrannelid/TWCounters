import { useState, useEffect, memo, useMemo } from 'react';
import { getUnitImage, getPlaceholderDataUrl } from '@/lib/imageUtils';
import { cn } from '@/lib/utils';

export type ImageType = 'character' | 'squad-leader' | 'squad-member' | 'ship' | 'capital-ship';

// Behåll image cache
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

  // Memoize SIZE_CLASSES to avoid recalculating on every render
  const sizeClasses = useMemo(() => SIZE_CLASSES[size], [size]);

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

  // Skapa sizes string baserat på komponentens storlek

  return (
    <div className={cn(
      'relative',
      'transition-all duration-300 ease-out',
      sizeClasses,
      className
    )}>
      <img
        src={imageUrl}
        alt={name}
        className={cn(
          'w-full h-full',
          'object-cover rounded-full',
          'transition-opacity duration-300',
          isLoading ? 'opacity-0 blur-md' : 'opacity-100',
          hasError ? 'grayscale opacity-50' : ''
        )}
        loading="lazy"
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
      {withTooltip && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 
                     bg-black/90 px-2 py-1 rounded text-xs text-white whitespace-nowrap 
                     opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {name}
        </div>
      )}
    </div>
  );
});

UnitImage.displayName = 'UnitImage';