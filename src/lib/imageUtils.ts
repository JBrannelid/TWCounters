import { storage } from '../lib/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { getImageFileName } from './imageMapping';

export type ImageType = 'character' | 'squad-leader' | 'squad-member' | 'ship' | 'capital-ship';
export type ImageSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Image dimensions for different sizes of images 
interface ImageDimensions {
  width: number;
  height: number;
  containerClass: string;
}

// Constants for image handling and caching 
const ASSETS_BASE_PATH = '/asset';
const DEFAULT_PLACEHOLDER = '/placeholder.png';
const IMAGE_CACHE = new Map<string, string>();
const LOADING_CACHE = new Map<string, Promise<string>>();

// Image sizes for different use cases 
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

// Get the dimensions for a specific image size
export const getImageDimensions = (size: ImageSize): ImageDimensions => {
  return IMAGE_SIZES[size];
};

// Get the URL for a placeholder image of a specific size
export const getPlaceholderDataUrl = (size: ImageSize): string => {
  const { width, height } = IMAGE_SIZES[size];
  return `data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'><rect width='100%' height='100%' fill='%231a1e27'/></svg>`;
};

// Get the class names for an image container based on its loading state and size
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

// Get the file name for an image based on its ID and type
export const getUnitImage = async (id: string | undefined, type: ImageType): Promise<string> => {
  if (!id) {
    logDebug('No ID provided for image');
    return DEFAULT_PLACEHOLDER;
  }

  const cacheKey = `${id}-${type}`; // Cache key for the image URL 
  
  // check if the image is already cached
  if (IMAGE_CACHE.has(cacheKey)) {
    console.log(`[Image Debug] Cache hit for ${id} (${type})`);
    return IMAGE_CACHE.get(cacheKey)!;
  }

  // check if the image is already loading 
  if (LOADING_CACHE.has(cacheKey)) {
    //console.log(`[Image Debug] Image already loading for ${id} (${type})`);
    return LOADING_CACHE.get(cacheKey)!;
  }

  // create a new loading promise for the image 
  const loadingPromise = (async () => {
    try {
      const fileName = getImageFileName(id, type); // Get the file name for the image
      if (!fileName) { // If no file name is found, return the default placeholder image
        console.log(`[Image Debug] No file mapping for ${id} (${type})`);
        return DEFAULT_PLACEHOLDER;
      }

    // determine the folder to search for the image based on the type
    const folder = type.includes('ship') ? 'ships' : 'characters';

    // build the local path for the image
    const localPath = `/asset/${folder}/${fileName}.webp`;
    //console.log(`[Image Debug] Attempting to load image from local path: ${localPath}`);

      // try to load the image from the local path 
      const localImage = new Image();
      localImage.src = localPath;

      // check if the local image is available if it is, cache it and return the URL
      const isLocalAvailable = await new Promise((resolve) => {
        localImage.onload = () => {
          //console.log(`[Image Debug] Local image loaded successfully: ${localPath}`);
          resolve(true);
        };
        // if the local image fails to load, log an error and resolve to false 
        localImage.onerror = () => {
          console.error(`[Image Debug] Failed to load local image from path: ${localPath}`);
          resolve(false);
        };
      });

      // if the local image is available, cache it and return the URL
      if (isLocalAvailable) {
        //console.log(`[Image Debug] Loaded ${id} (${type}) from local path: ${localPath}`);
        IMAGE_CACHE.set(cacheKey, localPath);
        return localPath;
      }

      // Fallback to Firebase storage if the local image is not available
      const imagePath = `${folder}/${fileName}.webp`;
      
      try { // try to load the image from Firebase storage
        const imageRef = ref(storage, imagePath); // Get the reference to the image in Firebase storage
        const url = await getDownloadURL(imageRef); // Get the download URL for the image
        IMAGE_CACHE.set(cacheKey, url); // Cache the URL for the image
        logDebug(`Successfully loaded Firebase image for ${id}`); // Log that the image was loaded successfully
        return url; // Return the URL for the image
      } catch (firebaseError) {
        const localPath = `${ASSETS_BASE_PATH}/${imagePath}`;
        IMAGE_CACHE.set(cacheKey, localPath);
        logDebug(`Using local path: ${localPath}`);
        return localPath;
      }
    } catch (error) {
      console.error(`Failed to load image for ${id}:`, error);
      return DEFAULT_PLACEHOLDER; // Return the default placeholder image if the image fails to load
    } finally {
      LOADING_CACHE.delete(cacheKey); // Remove the loading promise from the cache
    }
  })();
  // Cache the loading promise for the image and return it for processing 
  LOADING_CACHE.set(cacheKey, loadingPromise);
  return loadingPromise;
};

// Clear the image cache to free up memory 
export const clearImageCache = () => {
  IMAGE_CACHE.clear();
};

// Handle an error loading an image, replace it with a placeholder image 
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const img = e.target as HTMLImageElement;
  console.error(`Image failed to load: ${img.src}`);
  img.src = DEFAULT_PLACEHOLDER;
  img.classList.add('error-image');
};