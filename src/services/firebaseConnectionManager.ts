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

  private constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
      window.addEventListener('pagehide', this.handlePageHide.bind(this));
      window.addEventListener('pageshow', this.handlePageShow.bind(this));
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));

      // Add bfcache specific handlers
      window.addEventListener('freeze', this.handleFreeze.bind(this));
      window.addEventListener('resume', this.handleResume.bind(this));
    }
  }

  private async handleFreeze() {
    await this.closeAllConnections();
    await this.disableNetworking();
  }

  private async handleResume() {
    if (this.isNetworkEnabled) {
      await this.enableNetworking();
      await this.reestablishConnections();
    }
  }

  public async reestablishConnections() {
    if (!this.firestore) return;
    
    try {
      // re-enable network
      await enableNetwork(this.firestore);
      
      if (this.isNetworkEnabled) {
        // Reconnect all WebSocket connections
        const reconnectPromises = this.websocketConnections.map(async (ws) => {
          if (ws.readyState === WebSocket.CLOSED) {
            // save the current state
            const url = ws.url;
            const protocols = (ws as any).protocol;
            
            // close the old connection
            ws.close();
            
            // create a new connection with the same state as the old one and wait for it to open
            const newWs = new WebSocket(url, protocols);
            
            // wait for the new connection to open
            await new Promise<void>((resolve, reject) => {
              newWs.addEventListener('open', () => resolve());
              newWs.addEventListener('error', (error) => reject(error));
            });
            
            //  replace the old connection with the new one
            const index = this.websocketConnections.indexOf(ws);
            if (index !== -1) {
              this.websocketConnections[index] = newWs;
            }
            
            return newWs;
          }
          return ws;
        });
  
        // wait for all connections to be reestablished before continuing
        await Promise.all(reconnectPromises);
        
        console.log('Successfully reestablished all WebSocket connections');
      }
    } catch (error) {
      console.warn('Failed to reestablish connections:', error);
      // if reestablishing connections fails, close all connections and disable networking
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

  public trackWebSocket(ws: WebSocket) {
    this.websocketConnections.push(ws);
    
    ws.addEventListener('close', () => {
      this.websocketConnections = this.websocketConnections.filter(conn => conn !== ws);
    });
  }

  // Rest of the existing methods...
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