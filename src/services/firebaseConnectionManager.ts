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
  private websocketConnections: WebSocket[] = [];
  private initialized = false;

  private constructor() {}

  public static getInstance(): FirebaseConnectionManager {
    if (!FirebaseConnectionManager.instance) {
      FirebaseConnectionManager.instance = new FirebaseConnectionManager();
    }
    return FirebaseConnectionManager.instance;
  }

  public initialize(app: FirebaseApp): void {
    console.log('Connection Manager initialize called');
    if (this.initialized) return;
    console.log('Connection Manager already initialized, skipping');
    
    this.app = app;
    if (this.app) {
      console.log('Getting Firestore instance...');
      this.firestore = getFirestore(this.app);
      console.log('Firestore instance obtained');
      
      if (typeof document !== 'undefined') {
        console.log('Setting up event listeners...');
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        window.addEventListener('pagehide', this.handlePageHide.bind(this));
        window.addEventListener('pageshow', this.handlePageShow.bind(this));
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
        window.addEventListener('freeze', this.handleFreeze.bind(this));
        window.addEventListener('resume', this.handleResume.bind(this));
        console.log('Event listeners setup complete');
      }
      
      this.initialized = true;
      console.log('Connection Manager initialization complete');
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

  private async handleFreeze(): Promise<void> {
    await this.closeAllConnections();
    await this.disableNetworking();
  }

  private async handleResume(): Promise<void> {
    if (this.isNetworkEnabled) {
      await this.enableNetworking();
      await this.reestablishConnections();
    }
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

  public async reestablishConnections(): Promise<void> {
    if (!this.firestore) return;
    
    try {
      await enableNetwork(this.firestore);
      
      if (this.isNetworkEnabled) {
        const reconnectPromises = this.websocketConnections.map(async (ws) => {
          if (ws.readyState === WebSocket.CLOSED) {
            const url = ws.url;
            const protocols = (ws as any).protocol;
            
            ws.close();
            
            const newWs = new WebSocket(url, protocols);
            
            await new Promise<void>((resolve, reject) => {
              newWs.addEventListener('open', () => resolve());
              newWs.addEventListener('error', (error) => reject(error));
            });
            
            const index = this.websocketConnections.indexOf(ws);
            if (index !== -1) {
              this.websocketConnections[index] = newWs;
            }
            
            return newWs;
          }
          return ws;
        });
  
        await Promise.all(reconnectPromises);
      }
    } catch (error) {
      console.warn('Failed to reestablish connections:', error);
      await this.closeAllConnections();
    }
  }

  private async closeWebSocketConnections(): Promise<void> {
    const closePromises = this.websocketConnections.map(ws => {
      return new Promise<void>((resolve) => {
        ws.addEventListener('close', () => resolve(), { once: true });
        ws.close();
      });
    });
  
    await Promise.all(closePromises);
    this.websocketConnections = [];
  }
  
  public async closeAllConnections(): Promise<void> {
    try {
      await this.closeWebSocketConnections();
      await this.disableNetworking();
    } catch (error) {
      console.warn('Failed to close all connections:', error);
    }
  }

  public trackWebSocket(ws: WebSocket): void {
    this.websocketConnections.push(ws);
    
    ws.addEventListener('close', () => {
      this.websocketConnections = this.websocketConnections.filter(conn => conn !== ws);
    });
  }

  public getFirestore(): Firestore | null {
    return this.firestore;
  }
}

export const connectionManager = FirebaseConnectionManager.getInstance();