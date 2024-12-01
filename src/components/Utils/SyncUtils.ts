export class SyncLock {
    private static locks: Map<string, boolean> = new Map();

    static async withLock<T>(key: string, operation: () => Promise<T>, timeout = 30000): Promise<T> {
      if (this.locks.get(key)) {
        console.log(`Operation ${key} is locked, waiting...`);
        return new Promise((resolve, reject) => {
          const wait = setTimeout(() => {
            this.locks.set(key, false);
            reject(new Error(`Operation ${key} timed out`));
          }, timeout);
          
          const checkLock = setInterval(() => {
            if (!this.locks.get(key)) {
              clearInterval(checkLock);
              clearTimeout(wait);
              this.executeWithLock(key, operation).then(resolve).catch(reject);
            }
          }, 100);
        });
      }
      
      return this.executeWithLock(key, operation);
    }
  
    private static async executeWithLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
      try {
        console.log(`Acquiring lock for ${key}`);
        this.locks.set(key, true);
        const result = await operation();
        return result;
      } finally {
        console.log(`Releasing lock for ${key}`);
        this.locks.set(key, false);
      }
    }
  
    static isLocked(key: string): boolean {
      return this.locks.get(key) || false;
    }
  }
  
  export class SyncQueue {
    private static queue: Array<{
      operation: () => Promise<void>;
      key: string;
    }> = [];
    private static isProcessing = false;
  
    static async add(key: string, operation: () => Promise<void>): Promise<void> {
      console.log(`Adding operation to queue: ${key}`);
      this.queue.push({ operation, key });
      
      if (!this.isProcessing) {
        await this.processQueue();
      }
    }
  
    private static async processQueue(): Promise<void> {
      if (this.isProcessing || this.queue.length === 0) return;
      
      this.isProcessing = true;
      console.log('Starting queue processing');
      
      while (this.queue.length > 0) {
        const item = this.queue.shift();
        if (item) {
          try {
            await SyncLock.withLock(item.key, item.operation);
            console.log(`Successfully processed operation: ${item.key}`);
          } catch (error) {
            console.error(`Error processing operation ${item.key}:`, error);
          }
        }
      }
      
      this.isProcessing = false;
      console.log('Queue processing completed');
    }
  }
  
  export class DebounceSync {
    private static timers: Map<string, NodeJS.Timeout> = new Map();
    private static defaultDelay = 1000; // 1 second
  
    static schedule(key: string, operation: () => Promise<void>, delay = this.defaultDelay): void {
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
      }
  
      const timer = setTimeout(async () => {
        try {
          await SyncQueue.add(key, operation);
          this.timers.delete(key);
        } catch (error) {
          console.error(`Error in debounced operation ${key}:`, error);
        }
      }, delay);
  
      this.timers.set(key, timer);
    }
  }