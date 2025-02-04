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

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || null 
};

// Validate environment variables for Firebase configuration 
if (!firebaseConfig.apiKey) throw new Error('Firebase API Key is missing');
if (!firebaseConfig.authDomain) throw new Error('Firebase Auth Domain is missing');
if (!firebaseConfig.projectId) throw new Error('Firebase Project ID is missing');
if (!firebaseConfig.storageBucket) throw new Error('Firebase Storage Bucket is missing');
if (!firebaseConfig.messagingSenderId) throw new Error('Firebase Messaging Sender ID is missing');
if (!firebaseConfig.appId) throw new Error('Firebase App ID is missing');

// Firebase client class to manage Firebase services and initialization 
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

  // Private constructor to initialize Firebase services
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
    
    this._auth = getAuth(this.app);
    this._storage = getStorage(this.app);
    
    // Lazy initialize analytics only in production
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      this.initializeAnalytics();
    }

    this.initializationPromise = this.initialize();

    // Initialize script loading with improved error handling with API scripts
    this.loadScript('https://apis.google.com/js/api.js') // Load Google API script
      .then(() => console.log('Google API script loaded successfully')) // Log success
      .catch((error) => console.warn('Google API script load warning:', error)); // Log error

    if (process.env.NODE_ENV === 'development') {
      this.connectToEmulators();
    }
  }

  // Initialize Firebase analytics if supported by the browser 
  private async initializeAnalytics(): Promise<void> {
    try {
      const analyticsSupported = await isSupported(); // Check if analytics is supported by the browser
      if (analyticsSupported) { // Initialize analytics if supported
        this._analytics = getAnalytics(this.app);
        AnalyticsService.initialize(this.app);
      }
    } catch (error) {
      console.warn('Analytics initialization warning:', error);
    }
  }

  // Load a script with improved error handling and timeout support 
  private loadScript(src: string, nonce?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script'); // Create a new script element
      script.src = src; // Set the source URL for the script
      script.async = true; // Set the script to load asynchronously
      if (nonce) script.nonce = nonce; // Set the nonce attribute if provided

      const timeoutId = setTimeout(() => {
        reject(new Error(`Script load timeout: ${src}`));
      }, 10000); // 10 second timeout

      script.onload = () => { // Resolve the promise when the script loads successfully
        clearTimeout(timeoutId);
        resolve();
      };
      script.onerror = (error) => { // Reject the promise if the script fails to load
        clearTimeout(timeoutId);
        reject(error);
      };

      document.head.appendChild(script); // Append the script to the document head
    });
  }

  // Initialize Firebase services and setup persistence 
  private async initialize(): Promise<void> {
    try {
      // Setup local persistence and auth state monitoring 
      await this.setupPersistence();
      this.setupAuthStateMonitoring();
      this.initialized = true;
    } catch (error) {
      this.initError = error as Error;
      throw error;
    }
  }

  // Setup local persistence for Firestore and log any warnings
  private async setupPersistence(): Promise<void> {
    try {
      // Check if IndexedDB is available in the browser 
      if (!window.indexedDB) {
        console.warn('Persistence may not be fully supported in this browser (IndexedDB not available)');
        return;
      }
      //console.debug('Local persistence configured through initializeFirestore');
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.warn('Persistence setup warning:', error.message);
      }
    }
  }

  // Setup auth state monitoring to log user sign-in and sign-out events
  private setupAuthStateMonitoring(): void {
    onAuthStateChanged(
      this._auth, // Auth instance to monitor for state changes 
      (user) => {
        if (user) { // Log user sign-in and sign-out events 
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

  // Connect to Firebase emulators for local development 
  private connectToEmulators(): void {
    if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') { // Check if emulators are enabled and connect to local instances
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

  // Singleton instance management for Firebase client
  public static getInstance(): FirebaseClient {
    if (!FirebaseClient.instance) {
      FirebaseClient.instance = new FirebaseClient();
    }
    return FirebaseClient.instance;
  }

  // Getters for Firebase services and initialization status
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

// Create and export singleton instance
const firebaseClient = FirebaseClient.getInstance();

// Export service instances
export const auth = firebaseClient.auth;
export const db = firebaseClient.db;
export const storage = firebaseClient.storage;

// Export helper functions
export const ensureFirebaseInitialized = () => firebaseClient.waitForInitialization();
export const reconnectFirebase = () => firebaseClient.reconnect();

export default firebaseClient;

// Safely export analytics
export const getFirebaseAnalytics = (): Analytics | null => {
  try {
    return firebaseClient.isAnalyticsAvailable ? firebaseClient.analytics : null;
  } catch (error) {
    console.warn('Analytics access warning:', error);
    return null;
  }
};