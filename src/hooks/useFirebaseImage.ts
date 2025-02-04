import { useState, useEffect } from 'react';
import { storage } from '@/lib/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { ImageType } from '@/lib/imageUtils';
import { getImageFileName } from '@/lib/imageMapping';

// Custom hook to load an image from Firebase Storage
export const useFirebaseImage = (id: string, type: ImageType) => {
  const [imageUrl, setImageUrl] = useState<string>('/placeholder.png');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load the image from Firebase Storage when the component mounts or the ID changes 
  useEffect(() => {
    const loadImage = async () => {
      try {
        console.log('Loading image:', {id, type});
        const folder = type.includes('ship') ? 'ships' : 'characters';
        const mappedId = getImageFileName(id, type);
        const storageRef = ref(storage, `${folder}/${mappedId}.webp`);
        console.log('Storage ref:', storageRef.fullPath);
        
        // Get the download URL for the image from Firebase Storage
        const url = await getDownloadURL(storageRef);
        console.log('Download URL:', url);
        setImageUrl(url); // Set the image URL
        setError(null); // Clear any previous error
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

    loadImage(); // Load the image when the component mounts or the ID changes
  }, [id, type]);

  return { imageUrl, loading, error };
};