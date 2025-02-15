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

// Separate FirebaseClient from FirebaseProvider
export class FirebaseClient {
  private _auth: Auth;
  private _db: Firestore;
  private _storage: FirebaseStorage;
  private static instance: FirebaseClient;

  private constructor() {
    console.log('Creating new FirebaseClient instance');
    this._auth = auth;
    this._db = db;
    this._storage = storage;
  }

  public static getInstance(): FirebaseClient {
    if (!FirebaseClient.instance) {
      console.log('Initializing new FirebaseClient singleton');
      FirebaseClient.instance = new FirebaseClient();
    }
    return FirebaseClient.instance;
  }

  get auth() { return this._auth; }
  get db() { return this._db; }
  get storage() { return this._storage; }
}

export const firebaseClient = FirebaseClient.getInstance();

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('FirebaseProvider rendering');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [initStartTime] = useState(Date.now());

  // Initialize Firebase
  useEffect(() => {
    const initialize = async () => {
      console.log('Starting Firebase initialization');
      try {
        setIsLoading(true);
        setError(null);

        // Set a timeout for initialization
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Firebase initialization timeout after 30 seconds'));
          }, 30000);
        });

        // Try to initialize Firebase with timeout
        await Promise.race([
          ensureFirebaseInitialized(),
          timeoutPromise
        ]);

        console.log('Firebase initialized successfully');
        setIsInitialized(true);

        // Test connection with a simple query
        try {
          await FirebaseService.syncAllData();
          console.log('Initial data sync successful');
        } catch (syncError) {
          console.error('Initial data sync failed:', syncError);
          throw syncError;
        }

      } catch (err) {
        console.error('Firebase initialization failed:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown initialization error';
        setError(`Failed to initialize Firebase: ${errorMessage}`);
        setIsInitialized(false);
      } finally {
        setIsLoading(false);
        const initTime = Date.now() - initStartTime;
        console.log(`Firebase initialization took ${initTime}ms`);
      }
    };

    initialize();
  }, [retryCount, initStartTime]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network status: Online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('Network status: Offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const retry = async () => {
    console.log('Retrying Firebase initialization');
    setRetryCount(prev => prev + 1);
  };

  const contextValue = {
    isInitialized,
    isOnline,
    isLoading,
    error,
    retry
  };

  // Loading state
  if (isLoading) {
    console.log('FirebaseProvider in loading state');
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-space-darker">
        <div className="text-center">
          <LoadingIndicator size="lg" className="mb-4" />
          <p className="text-white/60">
            {`Initializing Firebase${retryCount > 0 ? ` (Attempt ${retryCount + 1})` : ''}...`}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    console.log('FirebaseProvider in error state:', error);
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-space-darker">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button
            onClick={retry}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Render children when initialized
  console.log('FirebaseProvider rendering children, initialized:', isInitialized);
  return (
    <FirebaseContext.Provider value={contextValue}>
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
};

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}