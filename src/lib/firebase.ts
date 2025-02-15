import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { AnalyticsService } from '@/services/analyticsService';
import { 
  getAuth, 
  Auth, 
  connectAuthEmulator, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Firestore, 
  connectFirestoreEmulator,
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
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';
import { connectionManager } from '@/services/firebaseConnectionManager';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || null 
};

// Validate environment variables
if (!firebaseConfig.apiKey) throw new Error('Firebase API Key is missing');
if (!firebaseConfig.authDomain) throw new Error('Firebase Auth Domain is missing');
if (!firebaseConfig.projectId) throw new Error('Firebase Project ID is missing');
if (!firebaseConfig.storageBucket) throw new Error('Firebase Storage Bucket is missing');
if (!firebaseConfig.messagingSenderId) throw new Error('Firebase Messaging Sender ID is missing');
if (!firebaseConfig.appId) throw new Error('Firebase App ID is missing');

class FirebaseClient {
  private static instance: FirebaseClient;
  private app: FirebaseApp;
  private _auth: Auth;
  private _db: Firestore;
  private _storage: FirebaseStorage;
  private _analytics: Analytics | null = null;
  private initialized: boolean = false;
  private initError: Error | null = null;
  private initializationPromise: Promise<void>;

  private constructor() {
    this.app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

    // Initialize Firestore with optimized settings
    this._db = initializeFirestore(this.app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
        cacheSizeBytes: CACHE_SIZE_UNLIMITED
      }),
      experimentalAutoDetectLongPolling: true
    });    
    
    // Initialize connection manager with the app instance
    connectionManager.initialize(this.app);
    
    this._auth = getAuth(this.app);
    this._storage = getStorage(this.app);
    
    // Initialize script loading with improved error handling with API scripts
    this.loadScript('https://apis.google.com/js/api.js')
      .then(() => console.log('Google API script loaded successfully'))
      .catch((error) => console.warn('Google API script load warning:', error));
    
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      this.initializeAnalytics();
    }

    this.initializationPromise = this.initialize();

    if (process.env.NODE_ENV === 'development') {
      this.connectToEmulators();
    }

    // Setup page visibility handling for bfcache
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          // Prepare for bfcache
          this.prepareForBFCache();
        }
      });
    }
  }

  

  private loadScript(src: string, nonce?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      if (nonce) script.nonce = nonce;

      const timeoutId = setTimeout(() => {
        reject(new Error(`Script load timeout: ${src}`));
      }, 10000);

      script.onload = () => {
        clearTimeout(timeoutId);
        resolve();
      };
      script.onerror = (error) => {
        clearTimeout(timeoutId);
        reject(error);
      };

      document.head.appendChild(script);
    });
  }

  private async initializeAnalytics(): Promise<void> {
    try {
      const analyticsSupported = await isSupported();
      if (analyticsSupported) {
        this._analytics = getAnalytics(this.app);
        AnalyticsService.initialize(this.app);
      }
    } catch (error) {
      console.warn('Analytics initialization warning:', error);
    }
  }

  private setupBFCacheSupport(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          // Prepare for bfcache
          this.prepareForBFCache();
        } else if (document.visibilityState === 'visible') {
          // Restore from bfcache
          this.restoreFromBFCache();
        }
      });

      // Handle page transitions
      window.addEventListener('pagehide', (event) => {
        if (event.persisted) {
          // Page might enter bfcache
          this.prepareForBFCache();
        }
      });

      window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
          // Page was restored from bfcache
          this.restoreFromBFCache();
        }
      });
    }
  }

  private prepareForBFCache(): void {
    // Clean up resources before page is frozen
    if (this._analytics) {
      this._analytics = null;
    }
    
    // Close WebSocket connections
    connectionManager.closeAllConnections();
  }

  private async restoreFromBFCache(): Promise<void> {
    try {
      // Reinitialize necessary services
      await this.initializeAnalytics();
      await connectionManager.reestablishConnections();
    } catch (error) {
      console.warn('Error restoring from bfcache:', error);
    }
  }


  private setupWebSocketHandling(): void {
    const originalWebSocket = window.WebSocket;
    window.WebSocket = class extends originalWebSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        connectionManager.trackWebSocket(this);
      }
    };
  }
  
  private async initialize(): Promise<void> {
    try {
      this.setupWebSocketHandling();
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
      if (!window.indexedDB) {
        console.warn('Persistence may not be fully supported in this browser');
        return;
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.warn('Persistence setup warning:', error.message);
      }
    }
  }

  private setupAuthStateMonitoring(): void {
    onAuthStateChanged(
      this._auth,
      (user) => {
        if (user) {
          console.debug('Auth state: signed in');
        } else {
          console.debug('Auth state: signed out');
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
        const db = connectionManager.getFirestore();
        if (db) {
          connectFirestoreEmulator(db, 'localhost', 8080);
        }
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
    if (!this.initialized && this.initError) throw this.initError;
    return this._auth;
  }

  public get db(): Firestore {
    if (!this.initialized && this.initError) throw this.initError;
    return this._db;
  }

  public get storage(): FirebaseStorage {
    if (!this.initialized && this.initError) throw this.initError;
    return this._storage;
  }

  public get analytics(): Analytics | null {
    return this._analytics;
  }

  public get isAnalyticsAvailable(): boolean {
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

const firebaseClient = FirebaseClient.getInstance();

export const auth = firebaseClient.auth;
export const db = firebaseClient.db;
export const storage = firebaseClient.storage;

export const ensureFirebaseInitialized = () => firebaseClient.waitForInitialization();
export const reconnectFirebase = () => firebaseClient.reconnect();

export default firebaseClient;

export const getFirebaseAnalytics = (): Analytics | null => {
  try {
    return firebaseClient.isAnalyticsAvailable ? firebaseClient.analytics : null;
  } catch (error) {
    console.warn('Analytics access warning:', error);
    return null;
  }
};