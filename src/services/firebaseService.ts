import { db, auth } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  query,
  where,
  writeBatch,
  getDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { Squad, Fleet, Counter, ChangeRecord } from '@/types';
import { squadValidators } from '@/lib/validators';
import { SyncLock } from '@/components/Utils/SyncUtils';

export class FirebaseService {
  private static async checkOnline(): Promise<boolean> {
    return navigator.onLine;
  }

  // Helper method to handle Firestore operations and error handling 
  private static async handleOperation<T>(
    operation: () => Promise<T>,
    errorMessage: string
  ): Promise<T> {
    if (!navigator.onLine) {
      throw new Error('Operation cannot be performed while offline');
    }

    try {
      return await operation();
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // helper method to clean data before saving to Firestore
  private static cleanDataForFirestore(obj: any): any {
    console.log('cleanDataForFirestore called with:', {
      type: typeof obj,
      isArray: Array.isArray(obj),
      value: obj
    });

    // if the value is null or undefined, return null to remove it from the object
    if (obj === null || obj === undefined) {
      return null;
    }

    // special handling for arrays - process each item in the array
    if (Array.isArray(obj)) {
      console.log('Processing array with length:', obj.length);
      return obj.map(item => this.cleanDataForFirestore(item));
    }

    // special handling for objects - keep only fields that have a value, or are important fields
    if (typeof obj === 'object') {
      console.log('Processing object with keys:', Object.keys(obj));
      const cleanedObj: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        console.log(`Processing key "${key}":`, {
          type: typeof value,
          isArray: Array.isArray(value),
          hasValue: value !== null && value !== undefined
        });

        const cleanedValue = this.cleanDataForFirestore(value);
        
        // Keep fields that have a value, or are important fields
        const isImportantField = [
          'characters',
          'leader',
          'startingLineup',
          'reinforcements',
          'capitalShip'
        ].includes(key);

        // If the value is not null or undefined, or if it's an important field, save it
        if (cleanedValue !== null || isImportantField) {
          cleanedObj[key] = cleanedValue;
          console.log(`Saved value for "${key}":`, cleanedValue);
        }
      }
      
      return cleanedObj;
    }

    return obj;
  }

  // Log a change record to Firestore for audit purposes
  private static async logChange(change: Omit<ChangeRecord, 'id' | 'timestamp'> & { userId: string }): Promise<void> {
    try {
      const changeRef = doc(collection(db, 'changes'));
      const changeData = {
        ...change,
        id: changeRef.id,
        timestamp: serverTimestamp(),
        changes: {
          ...change.changes,
          [change.entityType]: {
            old: change.changes[change.entityType]?.old || null,
            new: change.changes[change.entityType]?.new || null
          }
        }
      };

      await setDoc(changeRef, changeData);
    } catch (error) {
      console.error('Error logging change:', error);
    }
  }

  // Add or update squad in Firestore and create a change log entry
  static async deleteSquad(squadId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      const userId = await this.getCurrentUserId();
      
      // Remove squad 
      const squadRef = doc(db, 'squads', squadId);
      const squadDoc = await getDoc(squadRef);
      if (!squadDoc.exists()) {
        throw new Error('Squad not found');
      }

      batch.delete(squadRef);

      // Remove related counters
      const countersQuery = query(
        collection(db, 'counters'),
        where('targetSquad.id', '==', squadId)
      );
      const countersSnapshot = await getDocs(countersQuery);
      countersSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      // Create change log entry for deleted squad
      await this.logChange({
        entityId: squadId,
        entityType: 'squad',
        changeType: 'delete',
        userId,
        changes: {
          squad: { old: squadDoc.data(), new: null }
        }
      });
    } catch (error) {
      console.error('Error deleting squad:', error);
      throw new Error('Failed to delete squad');
    }
  }

  // Add or update squad in Firestore and create a change log entry
  static async addOrUpdateSquad(squad: Squad): Promise<void> {
    return this.handleOperation(
      async () => {
        const validation = squadValidators.validateCompleteSquad(squad);
        if (!validation.isValid) {
          throw new Error(validation.error || 'Invalid squad data');
        }

        // Get current user ID to set as updatedBy field in Firestore document 
        const userId = await this.getCurrentUserId();
        const isUpdate = await this.documentExists('squads', squad.id);
        const now = Date.now(); // use millisecond timestamp
  
        // if it's an new squad, set createdAt to now, otherwise keep the existing value
        const normalizedSquad = {
          ...squad,
          lastUpdated: now, // use current time as lastUpdated
          createdAt: isUpdate ? squad.createdAt : now, // set createdAt to now if it's a new squad
          updatedBy: userId,
          type: 'squad' // ensure type is set to 'squad'
        };
  
        // if createdAt is undefined, remove it from the object before saving
        if (normalizedSquad.createdAt === undefined) {
          delete normalizedSquad.createdAt;
        }
  
        const docRef = doc(db, 'squads', squad.id);
        // use merge: true to update only the fields that are provided in the data object
        await setDoc(docRef, normalizedSquad, { merge: true });
  
        console.log('Saving squad with timestamps:', normalizedSquad);
      },
      'Failed to save squad'
    );
  }  
  
  // Validate fleet data before saving to Firestore
  private static validateFleetData(fleet: Fleet): boolean {
    const hasValidShips = fleet.startingLineup?.every(ship => 
      ship.id && ship.name && ship.alignment
    );
    
    // Capital ship is optional, but if it exists, it must have valid data
    const hasValidCapital = !fleet.capitalShip || (
      fleet.capitalShip.id && 
      fleet.capitalShip.name && 
      fleet.capitalShip.alignment
    );

    // Fleet must have an id, name, alignment, valid ships and valid capital ship
    return Boolean(
      fleet.id &&
      fleet.name &&
      fleet.alignment &&
      hasValidShips &&
      hasValidCapital
    );
  }
  // Add or update fleet in Firestore and create a change log entry
  static async addOrUpdateFleet(fleet: Fleet): Promise<void> {
    return SyncLock.withLock('fleet-sync', async () => {
      return this.handleOperation(
        async () => {
          if (!this.validateFleetData(fleet)) {
            throw new Error('Invalid fleet data structure');
          }
  
          // Validate that all ships in the starting lineup have valid data
          const userId = await this.getCurrentUserId();
          const isUpdate = await this.documentExists('fleets', fleet.id);
          const now = Date.now(); // use millisecond timestamp
          
          const normalizedFleet = {
            ...fleet,
            lastUpdated: now,
            createdAt: isUpdate ? (fleet.createdAt || now) : now,
            updatedBy: userId,
            type: 'fleet'
          };
  
          const docRef = doc(db, 'fleets', fleet.id);
          await setDoc(docRef, normalizedFleet, { merge: true });
  
          console.log('Saving fleet with timestamps:', normalizedFleet);
        },
        'Failed to save fleet'
      );
    });
  }

  // Delete fleet from Firestore by id and create a change log entry
  static async deleteFleet(fleetId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      const userId = await this.getCurrentUserId();
      
      // remove fleet 
      const fleetRef = doc(db, 'fleets', fleetId);
      const fleetDoc = await getDoc(fleetRef);
      if (!fleetDoc.exists()) {
        throw new Error('Fleet not found');
      }

      batch.delete(fleetRef);

      // remove related counters
      const countersQuery = query(
        collection(db, 'counters'),
        where('targetSquad.id', '==', fleetId)
      );
      const countersSnapshot = await getDocs(countersQuery);
      countersSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      await this.logChange({
        entityId: fleetId,
        entityType: 'fleet',
        changeType: 'delete',
        userId,
        changes: {
          fleet: { old: fleetDoc.data(), new: null }
        }
      });
    } catch (error) {
      console.error('Error deleting fleet:', error);
      throw new Error('Failed to delete fleet');
    }
  }

  // Counter operations for Firestore 
  static async addOrUpdateCounter(counter: Counter): Promise<Counter> {
    return SyncLock.withLock('counter-sync', async () => {
      return this.handleOperation(
        async () => {
          const counterId = counter.id || `counter-${Date.now()}`;
          const isUpdate = await this.documentExists('counters', counterId);
          const timestamp = serverTimestamp();
          const userId = await this.getCurrentUserId();

          const counterWithId = { 
            ...counter, 
            id: counterId,
            lastUpdated: timestamp,
            createdAt: isUpdate ? undefined : timestamp,
            updatedBy: userId
          };
          
          // Save counter to Firestore 
          const docRef = doc(db, 'counters', counterId);
          await setDoc(docRef, this.cleanDataForFirestore(counterWithId));

          return counterWithId;
        },
        'Failed to save counter'
      );
    });
  }


// delete counter from Firestore by id and create a change log entry  
static async deleteCounter(counterId: string): Promise<void> {
  return this.handleOperation(
    async () => {
      console.log('Starting delete operation for counter:', counterId);
      
      // First check if counter exists
      const counterRef = doc(db, 'counters', counterId);
      const counterDoc = await getDoc(counterRef);
      
      if (!counterDoc.exists()) {
        // Instead of throwing error, return success since the end goal (counter not existing) is achieved
        console.log(`Counter ${counterId} already deleted or doesn't exist`);
        return;
      }
      // Get counter data before deleting it to create a change log 
      const counterData = counterDoc.data();
      console.log('Found counter data:', counterData);

      // Create batch operation to delete counter and create change log entry in one go 
      const batch = writeBatch(db);
      
      // Delete counter
      batch.delete(counterRef);

      // Create change log
      const changeRef = doc(collection(db, 'changes'));
      const userId = await this.getCurrentUserId();
      
      // Create change log entry for deleted counter 
      batch.set(changeRef, {
        id: changeRef.id,
        entityId: counterId,
        entityType: 'counter',
        changeType: 'delete',
        userId,
        timestamp: serverTimestamp(),
        changes: {
          counter: {
            old: counterData,
            new: null
          }
        }
      });

      // Commit batch
      await batch.commit();
      console.log('Successfully deleted counter and created change log');
    },
    'Failed to delete counter'
  );
}

  // Fetch operations for fleets
  static async getFleets(): Promise<Fleet[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'fleets'));
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        //console.log('Raw fleet data before processing:', data);
        
        // safe handling of timestamps
        let processedData: Partial<Fleet> = {
          ...data,
          id: doc.id,
        };
  
        // testa att konvertera timestamps om de finns
        try {
          if (data.createdAt) {
            if (data.createdAt instanceof Timestamp) { // if it's a Firestore Timestamp 
              processedData.createdAt = data.createdAt.toDate().toISOString();
            } else if (typeof data.createdAt === 'number') { // if it's a millisecond timestamp
              processedData.createdAt = new Date(data.createdAt).toISOString();
            }
          }
  
          if (data.lastUpdated) {
            if (data.lastUpdated instanceof Timestamp) { // if it's a Firestore Timestamp
              processedData.lastUpdated = data.lastUpdated.toDate().toISOString();
            } else if (typeof data.lastUpdated === 'number') { // if it's a millisecond timestamp
              processedData.lastUpdated = new Date(data.lastUpdated).toISOString();
            }
          }
        } catch (timestampError) {
          console.warn('Error processing timestamps:', timestampError);
        }
  
        //console.log('Processed fleet data:', processedData);
        return processedData as Fleet;
      });
    } catch (error) {
      console.error('Error getting fleets:', error);
      throw new Error('Failed to get fleets');
    }
  }
  
  // fetch squads from Firestore and return as an array of Squad objects 
  static async getSquads(): Promise<Squad[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'squads'));
      if (querySnapshot.empty) {
        console.warn('No squads found');
        return [];
      }
  
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        //console.log('Raw squad data before processing:', data);
  
        // safe handling of timestamps 
        let processedData: Partial<Squad> = {
          ...data,
          id: doc.id,
        };
  
        // Try to convert timestamps if they exist  
        try {
          if (data.createdAt) {
            if (data.createdAt instanceof Timestamp) { // if it's a Firestore Timestamp
              processedData.createdAt = data.createdAt.toDate().toISOString();
            } else if (typeof data.createdAt === 'number') { // if it's a millisecond timestamp
              processedData.createdAt = new Date(data.createdAt).toISOString();
            }
          }
  
          if (data.lastUpdated) {
            if (data.lastUpdated instanceof Timestamp) { // if it's a Firestore Timestamp
              processedData.lastUpdated = data.lastUpdated.toDate().toISOString();
            } else if (typeof data.lastUpdated === 'number') { // if it's a millisecond timestamp
              processedData.lastUpdated = new Date(data.lastUpdated).toISOString();
            }
          }
        } catch (timestampError) {
          console.warn('Error processing timestamps:', timestampError);
        }
  
        //console.log('Processed squad data:', processedData);
        return processedData as Squad;
      });
    } catch (error) {
      console.error('Error getting squads:', error);
      throw new Error('Failed to get squads');
    }
  }

// Fetch counters from Firestore and return as an array of Counter objects
static async getCounters(): Promise<Counter[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'counters'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Counter[];
  } catch (error) {
    console.error('Error getting counters:', error);
    throw new Error('Failed to get counters');
  }
}

  // Helper method to check if a document exists in a collection
  private static async documentExists(collectionName: string, id: string): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  }

  static async syncAllData(retryAttempts = 3) {
    let lastError;
    
    for (let attempt = 0; attempt < retryAttempts; attempt++) {
      try {
        if (attempt > 0) {
          // Add exponential backoff delay between retries
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
  
        const [squads, fleets, counters] = await Promise.all([
          this.getSquads().catch(error => {
            console.error('Error fetching squads:', error);
            return [];
          }),
          this.getFleets().catch(error => {
            console.error('Error fetching fleets:', error);
            return [];
          }),
          this.getCounters().catch(error => {
            console.error('Error fetching counters:', error);
            return [];
          })
        ]);
  
        return {
          squads,
          fleets,
          counters,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error(`Sync attempt ${attempt + 1} failed:`, error);
        lastError = error;
        
        // If this is the last attempt, throw the error
        if (attempt === retryAttempts - 1) {
          throw new Error(`Failed to sync data after ${retryAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
  
    throw lastError;
  }

  private static async getCurrentUserId(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    return user.uid;
  }
}