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
  enableMultiTabIndexedDbPersistence,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { 
  getStorage, 
  FirebaseStorage, 
  connectStorageEmulator 
} from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validera miljövariabler
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
  private initialized: boolean = false;
  private initError: Error | null = null;
  private initializationPromise: Promise<void>;

  private constructor() {
    // Initialisera alla properties direkt
    this.app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    this._auth = getAuth(this.app);
    this._db = initializeFirestore(this.app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      experimentalForceLongPolling: true,
    });
    this._storage = getStorage(this.app);
    
    // Initiera promise
    this.initializationPromise = this.initialize();

    // Anslut till emulatorer i utvecklingsmiljö
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
      await enableMultiTabIndexedDbPersistence(this._db);
      console.log('Offline persistence enabled');
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string };
        
        switch (firebaseError.code) {
          case 'failed-precondition':
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
            break;
          case 'unimplemented':
            console.warn('The current browser does not support offline persistence.');
            break;
          default:
            console.error('Error enabling offline persistence:', error);
        }
      } else {
        console.error('Unknown error enabling offline persistence:', error);
      }
      // Fortsätt även om persistence misslyckas
    }
  }

  private setupAuthStateMonitoring(): void {
    onAuthStateChanged(
      this._auth,
      (user) => {
        if (user) {
          console.log('User is signed in:', user.uid);
        } else {
          console.log('User is signed out');
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

  public get isInitialized(): boolean {
    return this.initialized && !this.initError;
  }

  public async waitForInitialization(): Promise<void> {
    return this.initializationPromise;
  }

  // Metod för att återansluta vid nätverksproblem
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