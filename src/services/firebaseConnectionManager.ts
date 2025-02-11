import { FirebaseApp } from 'firebase/app';
import { 
  Firestore,
  disableNetwork,
  enableNetwork,
  getFirestore
} from 'firebase/firestore';

export class FirebaseConnectionManager {
  private static instance: FirebaseConnectionManager;
  private app: FirebaseApp | null = null;
  private firestore: Firestore | null = null;
  private isNetworkEnabled = true;

  private constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
      window.addEventListener('pagehide', this.handlePageHide.bind(this));
      window.addEventListener('pageshow', this.handlePageShow.bind(this));
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
    }
  }

  public static getInstance(): FirebaseConnectionManager {
    if (!FirebaseConnectionManager.instance) {
      FirebaseConnectionManager.instance = new FirebaseConnectionManager();
    }
    return FirebaseConnectionManager.instance;
  }

  public initialize(app: FirebaseApp): void {
    this.app = app;
    if (this.app) {
      this.firestore = getFirestore(this.app);
    }
  }

  private async handleVisibilityChange(): Promise<void> {
    if (!this.firestore) return;

    if (document.visibilityState === 'hidden') {
      await this.disableNetworking();
    } else if (document.visibilityState === 'visible' && this.isNetworkEnabled) {
      await this.enableNetworking();
    }
  }

  private async handlePageHide(event: PageTransitionEvent): Promise<void> {
    if (event.persisted) {
      await this.disableNetworking();
    }
  }

  private async handlePageShow(event: PageTransitionEvent): Promise<void> {
    if (event.persisted && this.isNetworkEnabled) {
      await this.enableNetworking();
    }
  }

  private async handleOnline(): Promise<void> {
    this.isNetworkEnabled = true;
    await this.enableNetworking();
  }

  private async handleOffline(): Promise<void> {
    this.isNetworkEnabled = false;
    await this.disableNetworking();
  }

  private async disableNetworking(): Promise<void> {
    if (this.firestore) {
      try {
        await disableNetwork(this.firestore);
      } catch (err) {
        console.warn('Failed to disable network:', err);
      }
    }
  }

  private async enableNetworking(): Promise<void> {
    if (this.firestore) {
      try {
        await enableNetwork(this.firestore);
      } catch (err) {
        console.warn('Failed to enable network:', err);
      }
    }
  }

  public getFirestore(): Firestore | null {
    return this.firestore;
  }
}

export const connectionManager = FirebaseConnectionManager.getInstance();