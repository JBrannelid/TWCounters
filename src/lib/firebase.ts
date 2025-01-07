import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  connectAuthEmulator, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Firestore, 
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { 
  getStorage, 
  FirebaseStorage, 
  connectStorageEmulator 
} from 'firebase/storage';
import { getAnalytics, Analytics, initializeAnalytics } from 'firebase/analytics';
import { m } from 'framer-motion';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validera miljövariabler
if (!firebaseConfig.apiKey) throw new Error('Firebase API Key is missing');
if (!firebaseConfig.authDomain) throw new Error('Firebase Auth Domain is missing');
if (!firebaseConfig.projectId) throw new Error('Firebase Project ID is missing');
if (!firebaseConfig.storageBucket) throw new Error('Firebase Storage Bucket is missing');
if (!firebaseConfig.messagingSenderId) throw new Error('Firebase Messaging Sender ID is missing');
if (!firebaseConfig.appId) throw new Error('Firebase App ID is missing');
if (!firebaseConfig.measurementId) {console.warn('Firebase Measurement ID is missing. Analytics will not work.');}

class FirebaseClient {
  private static instance: FirebaseClient;
  private app: FirebaseApp;
  private _auth: Auth;
  private _db: Firestore;
  private _storage: FirebaseStorage;
  private _analytics: Analytics; // Lägg till Analytics här
  private initialized: boolean = false;
  private initError: Error | null = null;
  private initializationPromise: Promise<void>;

  private constructor() {
    this.app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    this._auth = getAuth(this.app);
    this._db = initializeFirestore(this.app, {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
        cacheSizeBytes: 104857600
      })
    });
    this._storage = getStorage(this.app);
    
    // Enhetlig analytics-initialisering
    this._analytics = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
      ? initializeAnalytics(this.app)
      : getAnalytics(this.app);

    this.initializationPromise = this.initialize();

    if (process.env.NODE_ENV === 'development') {
      this.connectToEmulators();
    }
}

  private async initialize(): Promise<void> {
    try {
      await this.setupPersistence();
      this.setupAuthStateMonitoring();
      this.initialized = true;
    } catch (error) {
      this.initError = error as Error;
      throw error;
    }
  }

  private async setupPersistence(): Promise<void> {
    try {
      await enableIndexedDbPersistence(this._db, {
      });
      console.log('Offline persistence enabled');
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string };
        
        switch (firebaseError.code) {
          case 'failed-precondition':
            // Hantera tysta detta fel då det är förväntat med flera flikar
            console.debug('Multiple tabs open, persistence enabled in another tab.');
            break;
          case 'unimplemented':
            console.warn('The current browser does not support offline persistence.');
            break;
          default:
            console.error('Error enabling offline persistence:', error);
        }
      }
    }
  }

  private setupAuthStateMonitoring(): void {
    onAuthStateChanged(
      this._auth,
      (user) => {
        if (user) {
          //console.log('User is signed in:', user.uid);
        } else {
          //console.log('User is signed out');
        }
      },
      (error) => {
        console.error('Auth state change error:', error);
      }
    );
  }

  private connectToEmulators(): void {
    if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
      try {
        connectAuthEmulator(this._auth, 'http://localhost:9099', { disableWarnings: true });
        connectFirestoreEmulator(this._db, 'localhost', 8080);
        connectStorageEmulator(this._storage, 'localhost', 9199);
        console.log('Connected to Firebase emulators');
      } catch (error) {
        console.error('Error connecting to emulators:', error);
      }
    }
  }

  public static getInstance(): FirebaseClient {
    if (!FirebaseClient.instance) {
      FirebaseClient.instance = new FirebaseClient();
    }
    return FirebaseClient.instance;
  }

  public get auth(): Auth {
    if (this.initError) throw this.initError;
    return this._auth;
  }

  public get db(): Firestore {
    if (this.initError) throw this.initError;
    return this._db;
  }

  public get storage(): FirebaseStorage {
    if (this.initError) throw this.initError;
    return this._storage;
  }

  // Getter for Analytics
  get analytics(): Analytics {
    if (!this._analytics) {
      throw new Error('Analytics not initialized');
    }
    return this._analytics;
  }

  get isAnalyticsAvailable(): boolean {
    return this._analytics !== null;
  }

  public get isInitialized(): boolean {
    return this.initialized && !this.initError;
  }

  public async waitForInitialization(): Promise<void> {
    return this.initializationPromise;
  }

  public async reconnect(): Promise<void> {
    if (!this.initialized || this.initError) {
      this.initError = null;
      this.initialized = false;
      this.initializationPromise = this.initialize();
    }
    return this.initializationPromise;
  }
}

// Skapa och exportera en singleton-instans
const firebaseClient = FirebaseClient.getInstance();

// Exportera service-instanser
export const auth = firebaseClient.auth;
export const db = firebaseClient.db;
export const storage = firebaseClient.storage;

// Exportera hjälpfunktioner
export const ensureFirebaseInitialized = () => firebaseClient.waitForInitialization();
export const reconnectFirebase = () => firebaseClient.reconnect();

export default firebaseClient;

export const getFirebaseAnalytics = (): Analytics | null => {
  try {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
      return null;
    }
    return firebaseClient.isAnalyticsAvailable ? firebaseClient.analytics : null;
  } catch (error) {
    console.warn('Analytics access failed:', error);
    return null;
  }
};