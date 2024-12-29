import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, storage, ensureFirebaseInitialized } from '@/lib/firebase';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { FirebaseService } from '@/services/firebaseService';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage'; 

interface FirebaseContextType {
  isInitialized: boolean;
  isOnline: boolean;
  isLoading: boolean;
  error: string | null;
  retry: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export class FirebaseClient {
  private _auth: Auth;
  private _db: Firestore;
  private _storage: FirebaseStorage;
  private static instance: FirebaseClient;

  private constructor() {
    this._auth = auth;
    this._db = db;
    this._storage = storage;
  }

  public static getInstance(): FirebaseClient {
    if (!FirebaseClient.instance) {
      FirebaseClient.instance = new FirebaseClient();
    }
    return FirebaseClient.instance;
  }

  get auth() { return this._auth; }
  get db() { return this._db; }
  get storage() { return this._storage; }
}

// Create singleton instance
export const firebaseClient = FirebaseClient.getInstance();

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const initialize = async () => {
      console.log('Starting Firebase initialization...');
      try {
        setIsLoading(true);
        setError(null);
        
        try {
          console.log('Ensuring Firebase is initialized...');
          await ensureFirebaseInitialized();
          console.log('Setting up Firestore timeout...');
          const firestoreTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Firestore connection timeout')), 10000);
          });
          console.log('Starting data sync...');
          await Promise.race([
            FirebaseService.syncAllData(),
            firestoreTimeout
          ]);
          console.log('Firebase initialization complete');
          setIsInitialized(true);
        } catch (error) {
          console.error('Firebase initialization error:', error);
          setError(error instanceof Error ? error.message : 'Failed to initialize Firebase');
        }
      } catch (err) {
        console.error('Error in initialize:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        console.log('Setting isLoading to false');
        setIsLoading(false);
      }
    };

    initialize();
  }, [retryCount]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncQueuedChanges();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const retry = async () => {
    setRetryCount(prev => prev + 1);
  };

  // Implement the syncQueuedChanges function
  const syncQueuedChanges = () => {
    // Logic to sync changes when back online
  };

  // If we're not initialized and not in error state, show loading
  if (isLoading && !error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-space-darker">
        <div className="text-center">
          <LoadingIndicator size="lg" className="mb-4" />
          <p className="text-white/60">Initializing...</p>
        </div>
      </div>
    );
  }

  // If we have an error, show error state with retry button
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-space-darker">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button
            onClick={retry}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <FirebaseContext.Provider
      value={{
        isInitialized,
        isOnline,
        isLoading,
        error,
        retry
      }}
    >
      <div className="relative">
        {!isOnline && (
          <div className="sticky top-0 bg-yellow-500/90 text-black py-2 px-4 text-center z-50">
            You are currently offline. Changes will be synced when you reconnect.
          </div>
        )}
        {children}
      </div>
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}