import { useState, useEffect } from 'react';
import { storage } from '@/lib/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { ImageType } from '@/lib/imageUtils';
import { getImageFileName } from '@/lib/imageMapping';

export const useFirebaseImage = (id: string, type: ImageType) => {
  const [imageUrl, setImageUrl] = useState<string>('/placeholder.png');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      try {
        console.log('Loading image:', {id, type});
        const folder = type.includes('ship') ? 'ships' : 'characters';
        const mappedId = getImageFileName(id, type);
        const storageRef = ref(storage, `${folder}/${mappedId}.webp`);
        console.log('Storage ref:', storageRef.fullPath);
        
        const url = await getDownloadURL(storageRef);
        console.log('Download URL:', url);
        setImageUrl(url);
        setError(null);
      } catch (err) {
        console.error('Error loading image:', {
          error: err,
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
          path: `${type}/${id}.webp`
        });
        setError(err instanceof Error ? err.message : 'Failed to load image');
        setImageUrl('/placeholder.png');
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [id, type]);

  return { imageUrl, loading, error };
};