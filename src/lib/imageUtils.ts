import { storage } from '../lib/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { getImageFileName } from './imageMapping';

export type ImageType = 'character' | 'squad-leader' | 'squad-member' | 'ship' | 'capital-ship';
export type ImageSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ImageDimensions {
  width: number;
  height: number;
  containerClass: string;
}

// Constants
const ASSETS_BASE_PATH = '/asset';
const DEFAULT_PLACEHOLDER = '/placeholder.png';
const IMAGE_CACHE = new Map<string, string>();
const LOADING_CACHE = new Map<string, Promise<string>>();

const IMAGE_SIZES: Record<ImageSize, ImageDimensions> = {
  xs: { width: 32, height: 32, containerClass: 'w-8 h-8' },
  sm: { width: 40, height: 40, containerClass: 'w-10 h-10' },
  md: { width: 48, height: 48, containerClass: 'w-12 h-12' },
  lg: { width: 64, height: 64, containerClass: 'w-16 h-16' },
  xl: { width: 80, height: 80, containerClass: 'w-20 h-20' }
};

const DEBUG = process.env.NODE_ENV === 'development';

const logDebug = (message: string, ...args: any[]) => {
  if (DEBUG) {
    console.debug(`[ImageUtils] ${message}`, ...args);
  }
};

export const getImageDimensions = (size: ImageSize): ImageDimensions => {
  return IMAGE_SIZES[size];
};

export const getPlaceholderDataUrl = (size: ImageSize): string => {
  const { width, height } = IMAGE_SIZES[size];
  return `data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><rect width='100%' height='100%' fill='%231a1e27'/></svg>`;
};

export const getImageStateClass = (
  isLoading: boolean,
  hasError: boolean,
  size: ImageSize,
  baseClasses: string = ""
): string => {
  const { containerClass } = IMAGE_SIZES[size];
  return `${containerClass} ${baseClasses} ${isLoading ? 'opacity-0' : 'opacity-100'} ${
    hasError ? 'grayscale opacity-50' : ''
  } object-cover rounded-full transition-all duration-300`;
};

export const getUnitImage = async (id: string | undefined, type: ImageType): Promise<string> => {
  if (!id) {
    logDebug('No ID provided for image');
    return DEFAULT_PLACEHOLDER;
  }

  const cacheKey = `${id}-${type}`;
  
  // Kontrollera cache först
  if (IMAGE_CACHE.has(cacheKey)) {
    console.log(`[Image Debug] Cache hit for ${id} (${type})`);
    return IMAGE_CACHE.get(cacheKey)!;
  }

  // Kontrollera om bilden redan laddas
  if (LOADING_CACHE.has(cacheKey)) {
    console.log(`[Image Debug] Image already loading for ${id} (${type})`);
    return LOADING_CACHE.get(cacheKey)!;
  }

  // Skapa en laddnings-promise
  const loadingPromise = (async () => {
    try {
      const fileName = getImageFileName(id, type);
      if (!fileName) {
        console.log(`[Image Debug] No file mapping for ${id} (${type})`);
        return DEFAULT_PLACEHOLDER;
      }

    // Bestäm rätt mapp baserat på typen
    const folder = type.includes('ships') ? 'ships' : 'characters';

    // Bygg den lokala sökvägen för att söka i rätt mapp
    const localPath = `/asset/${folder}/${fileName}.webp`;
    console.log(`[Image Debug] Attempting to load image from local path: ${localPath}`);

      // Försök ladda från lokala assets först
      const localImage = new Image();
      localImage.src = localPath;

      const isLocalAvailable = await new Promise((resolve) => {
        localImage.onload = () => {
          console.log(`[Image Debug] Local image loaded successfully: ${localPath}`);
          resolve(true);
        };
        localImage.onerror = () => {
          console.error(`[Image Debug] Failed to load local image from path: ${localPath}`);
          resolve(false);
        };
      });

      // Om lokal bild är tillgänglig
      if (isLocalAvailable) {
        console.log(`[Image Debug] Loaded ${id} (${type}) from local path: ${localPath}`);
        IMAGE_CACHE.set(cacheKey, localPath);
        return localPath;
      }

      // Fallback till Firebase
      const imagePath = `${folder}/${fileName}.webp`;
      try {
        const imageRef = ref(storage, imagePath);
        const firebaseUrl = await getDownloadURL(imageRef);
        IMAGE_CACHE.set(cacheKey, firebaseUrl);
        console.log(`[Image Debug] Loaded ${id} (${type}) from Firebase URL: ${firebaseUrl}`);
        return firebaseUrl;
      } catch (firebaseError) {
        console.error(`[Image Debug] Firebase failed for ${id} (${type}):`, firebaseError);
      }
    } catch (error) {
      console.error(`[Image Debug] Failed to load image for ${id} (${type}):`, error);
    } finally {
      LOADING_CACHE.delete(cacheKey);
    }

    console.log(`[Image Debug] Using placeholder for ${id} (${type})`);
    return DEFAULT_PLACEHOLDER;
  })();

  LOADING_CACHE.set(cacheKey, loadingPromise);
  return loadingPromise;
};

export const clearImageCache = () => {
  IMAGE_CACHE.clear();
};

export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const img = e.target as HTMLImageElement;
  console.error(`Image failed to load: ${img.src}`);
  img.src = DEFAULT_PLACEHOLDER;
  img.classList.add('error-image');
};