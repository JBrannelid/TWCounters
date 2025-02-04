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

// Seperate FirebaseClient from FirebaseProvider
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

export const firebaseClient = FirebaseClient.getInstance();

// separate FirebaseProvider from FirebaseContext
export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Initialize Firebase
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true); // Set loading to true
        setError(null);
        await ensureFirebaseInitialized();
        
        const firestoreTimeout = new Promise((_, reject) => { // Set a timeout for the firestore connection
          setTimeout(() => reject(new Error('Firestore connection timeout')), 10000);
        });

        // Wait for the firestore connection to be established
        await Promise.race([
          FirebaseService.syncAllData(),
          firestoreTimeout
        ]);

        setIsInitialized(true); // Set isInitialized to true if the connection is successful
      } catch (err) {
        console.error('Error in initialize:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    initialize(); // call the initialize function when the component mounts
  }, [retryCount]); // Retry (when the retry function is called)

  // Event listener to check if the user is online or offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const retry = async () => {
    setRetryCount(prev => prev + 1); // Increment the retry count to trigger a retry in the useEffect hook above  
  };

  const contextValue = {
    isInitialized,
    isOnline,
    isLoading,
    error,
    retry
  };

  if (isLoading && !error) {
    // Show a loading indicator while initializing Firebase when loading the website
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-space-darker">
        <div className="text-center">
          <LoadingIndicator size="lg" className="mb-4" />
          <p className="text-white/60">Initializing...</p>
        </div>
      </div>
    );
  }

  if (error) { // Show an error message if there is an error during initialization of Firebase
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

  // If everything is initialized successfully, return the FirebaseContext.Provider
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

// Custom hook to use the Firebase context in components 
export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}