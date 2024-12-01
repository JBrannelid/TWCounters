import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  connectAuthEmulator, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  connectFirestoreEmulator,
  enableMultiTabIndexedDbPersistence
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

// Add type checking for environment variables
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

  private constructor() {
    if (getApps().length === 0) {
      this.app = initializeApp(firebaseConfig);
    } else {
      this.app = getApps()[0];
    }

    this._auth = getAuth(this.app);
    this._db = getFirestore(this.app);
    this._storage = getStorage(this.app);

    // Enable offline persistence
    this.setupPersistence();

    // Setup auth state monitoring
    this.setupAuthStateMonitoring();

    // Connect to emulators in development
    if (process.env.NODE_ENV === 'development') {
      this.connectToEmulators();
    }

    this.initialized = true;
  }

  public static getInstance(): FirebaseClient {
    if (!FirebaseClient.instance) {
      FirebaseClient.instance = new FirebaseClient();
    }
    return FirebaseClient.instance;
  }

  private async setupPersistence() {
    try {
      // Using the new recommended approach
      this._db = getFirestore(this.app);
      await enableMultiTabIndexedDbPersistence(this._db);
      console.log('Offline persistence enabled');
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string };
        
        switch (firebaseError.code) {
          case 'failed-precondition':
            console.warn(
              'Multiple tabs open, offline persistence can only be enabled in one tab at a time.'
            );
            break;
          case 'unimplemented':
            console.warn(
              'The current browser does not support offline persistence.'
            );
            break;
          default:
            console.error('Error enabling offline persistence:', error);
        }
      } else {
        console.error('Unknown error enabling offline persistence:', error);
      }
    }
  }

  private setupAuthStateMonitoring() {
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

  private connectToEmulators() {
    // Only connect to emulators if they're running
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

  public get auth(): Auth {
    return this._auth;
  }

  public get db(): Firestore {
    return this._db;
  }

  public get storage(): FirebaseStorage {
    return this._storage;
  }

  public get isInitialized(): boolean {
    return this.initialized;
  }

  public async waitForInitialization(): Promise<void> {
    if (this.initialized) return;

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.initialized) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }
}

const firebaseClient = FirebaseClient.getInstance();

export const auth = firebaseClient.auth;
export const db = firebaseClient.db;
export const storage = firebaseClient.storage;

// Helper function to ensure Firebase is initialized
export const ensureFirebaseInitialized = () => firebaseClient.waitForInitialization();

export default firebaseClient;