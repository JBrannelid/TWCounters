import { Squad, Fleet, Counter } from '@/types';
import { SyncQueue, DebounceSync } from '@/components/Utils/SyncUtils';
import { FirebaseService } from './firebaseService';

// Define the storage keys and version
const STORAGE_KEYS = {
  SQUADS: 'swgoh-tw-squads',
  FLEETS: 'swgoh-tw-fleets',
  COUNTERS: 'swgoh-tw-counters',
  VERSION: '1.0.0'
} as const;

class StorageService {
  private validateData<T>(data: T[]): boolean {
    return Array.isArray(data) && data.every(item => typeof item === 'object' && item !== null);
  }

  // Updated saveData method to handle errors better and add versioning to the data   
  private async saveData<T>(key: string, data: T[]): Promise<void> {
    try {
      console.log(`Saving data to ${key}:`, data);
      
      if (!this.validateData(data)) {
        throw new Error('Invalid data format');
      }

      const storageData = {
        data,
        version: STORAGE_KEYS.VERSION,
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem(key, JSON.stringify(storageData));
      console.log(`Data saved successfully to ${key}`);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      throw error;
    }
  }

  // Updated getData method to handle legacy data formats and errors better 
  private getData<T>(key: string, defaultValue: T[] = []): T[] {
    try {
      console.log(`Getting data from ${key}`);
      
      const stored = localStorage.getItem(key);
      if (!stored) {
        console.log(`No data found in ${key}, using default value`);
        return defaultValue;
      }

      const parsed = JSON.parse(stored);
      
      if (Array.isArray(parsed)) {
        console.log(`Found legacy data format in ${key}`);
        return parsed;
      }

      if (parsed.data && Array.isArray(parsed.data)) {
        console.log(`Found data in ${key}:`, parsed.data);
        return parsed.data;
      }

      console.log(`Invalid data format in ${key}, using default value`);
      return defaultValue;
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return defaultValue;
    }
  }

  // Updated Squad methods
  public async saveSquads(squads: Squad[]): Promise<void> {
    DebounceSync.schedule('save-squads', async () => {
      await this.saveData(STORAGE_KEYS.SQUADS, squads);
      await FirebaseService.addOrUpdateSquad(squads[squads.length - 1]);
    });
  }

  public getSquads(): Squad[] {
    return this.getData<Squad>(STORAGE_KEYS.SQUADS, []);
  }

  // Updated Fleet methods
  public async saveFleets(fleets: Fleet[]): Promise<void> {
    DebounceSync.schedule('save-fleets', async () => {
      await this.saveData(STORAGE_KEYS.FLEETS, fleets);
      await FirebaseService.addOrUpdateFleet(fleets[fleets.length - 1]);
    });
  }

  public getFleets(): Fleet[] {
    return this.getData<Fleet>(STORAGE_KEYS.FLEETS, []);
  }

  // Updated Counter methods
  public async saveCounters(counters: Counter[]): Promise<void> {
    DebounceSync.schedule('save-counters', async () => {
      await this.saveData(STORAGE_KEYS.COUNTERS, counters);
      if (counters.length > 0) {
        await FirebaseService.addOrUpdateCounter(counters[counters.length - 1]);
      }
    });
  }

  // Updated getCounters method
  public getCounters(): Counter[] {
    return this.getData<Counter>(STORAGE_KEYS.COUNTERS, []);
  }

  // Updated clearAllData method
  public async clearAllData(): Promise<void> {
    await SyncQueue.add('clear-all', async () => {
      try {
        console.log('Clearing all data');
        localStorage.removeItem(STORAGE_KEYS.SQUADS);
        localStorage.removeItem(STORAGE_KEYS.FLEETS);
        localStorage.removeItem(STORAGE_KEYS.COUNTERS);
        console.log('All data cleared successfully');
      } catch (error) {
        console.error('Error clearing data:', error);
        throw error;
      }
    });
  }
}

// Create and export a single instance
export const storage = new StorageService();

// Export the class for type usage
export type { StorageService };