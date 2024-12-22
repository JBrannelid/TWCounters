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

  // Helper för att rensa data innan det sparas till Firestore
  private static cleanDataForFirestore(obj: any): any {
    console.log('cleanDataForFirestore called with:', {
      type: typeof obj,
      isArray: Array.isArray(obj),
      value: obj
    });

    if (obj === null || obj === undefined) {
      return null;
    }

    // Specialhantering för arrays - behåll dem även om de är tomma
    if (Array.isArray(obj)) {
      console.log('Processing array with length:', obj.length);
      return obj.map(item => this.cleanDataForFirestore(item));
    }

    // Hantering av objekt
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
        
        // Behåll viktiga fält även om de är tomma
        const isImportantField = [
          'characters',
          'leader',
          'startingLineup',
          'reinforcements',
          'capitalShip'
        ].includes(key);

        if (cleanedValue !== null || isImportantField) {
          cleanedObj[key] = cleanedValue;
          console.log(`Saved value for "${key}":`, cleanedValue);
        }
      }
      
      return cleanedObj;
    }

    return obj;
  }

  // Loggar ändringar
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

  static async deleteSquad(squadId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      const userId = await this.getCurrentUserId();
      
      // Ta bort squad
      const squadRef = doc(db, 'squads', squadId);
      const squadDoc = await getDoc(squadRef);
      if (!squadDoc.exists()) {
        throw new Error('Squad not found');
      }

      batch.delete(squadRef);

      // Ta bort relaterade counters
      const countersQuery = query(
        collection(db, 'counters'),
        where('targetSquad.id', '==', squadId)
      );
      const countersSnapshot = await getDocs(countersQuery);
      countersSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

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

  static async addOrUpdateSquad(squad: Squad): Promise<void> {
    return this.handleOperation(
      async () => {
        const validation = squadValidators.validateCompleteSquad(squad);
        if (!validation.isValid) {
          throw new Error(validation.error || 'Invalid squad data');
        }
  
        const userId = await this.getCurrentUserId();
        const isUpdate = await this.documentExists('squads', squad.id);
        const now = Date.now(); // Använd millisekundstidsstämpel
  
        // Om det är en ny squad, sätt createdAt till nuvarande tid
        const normalizedSquad = {
          ...squad,
          lastUpdated: now, // Använd nuvarande tidpunkt för lastUpdated
          createdAt: isUpdate ? squad.createdAt : now, // Sätt createdAt till nu om det är en ny post
          updatedBy: userId,
          type: 'squad' // Säkerställ att type alltid är satt
        };
  
        // Om createdAt är undefined (vilket skulle kunna hända för en uppdatering), ta bort den från dataobjektet
        if (normalizedSquad.createdAt === undefined) {
          delete normalizedSquad.createdAt;
        }
  
        const docRef = doc(db, 'squads', squad.id);
        // Här kan vi använda merge för att uppdatera dokumentet utan att skriva över hela dokumentet
        await setDoc(docRef, normalizedSquad, { merge: true });
  
        // Logga för att verifiera data
        console.log('Saving squad with timestamps:', normalizedSquad);
      },
      'Failed to save squad'
    );
  }  
  
  private static validateFleetData(fleet: Fleet): boolean {
    const hasValidShips = fleet.startingLineup?.every(ship => 
      ship.id && ship.name && ship.alignment
    );
    
    const hasValidCapital = !fleet.capitalShip || (
      fleet.capitalShip.id && 
      fleet.capitalShip.name && 
      fleet.capitalShip.alignment
    );

    return Boolean(
      fleet.id &&
      fleet.name &&
      fleet.alignment &&
      hasValidShips &&
      hasValidCapital
    );
  }

  static async addOrUpdateFleet(fleet: Fleet): Promise<void> {
    return SyncLock.withLock('fleet-sync', async () => {
      return this.handleOperation(
        async () => {
          if (!this.validateFleetData(fleet)) {
            throw new Error('Invalid fleet data structure');
          }
  
          const userId = await this.getCurrentUserId();
          const isUpdate = await this.documentExists('fleets', fleet.id);
          const now = Date.now(); // Använd timestamp i millisekunder
          
          const normalizedFleet = {
            ...fleet,
            lastUpdated: now,
            createdAt: isUpdate ? (fleet.createdAt || now) : now,
            updatedBy: userId,
            type: 'fleet'
          };
  
          const docRef = doc(db, 'fleets', fleet.id);
          await setDoc(docRef, normalizedFleet, { merge: true });
  
          // Logga för att verifiera data
          console.log('Saving fleet with timestamps:', normalizedFleet);
        },
        'Failed to save fleet'
      );
    });
  }

  static async deleteFleet(fleetId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      const userId = await this.getCurrentUserId();
      
      // Ta bort fleet
      const fleetRef = doc(db, 'fleets', fleetId);
      const fleetDoc = await getDoc(fleetRef);
      if (!fleetDoc.exists()) {
        throw new Error('Fleet not found');
      }

      batch.delete(fleetRef);

      // Ta bort relaterade counters
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

  // Counter operations
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
          
          const docRef = doc(db, 'counters', counterId);
          await setDoc(docRef, this.cleanDataForFirestore(counterWithId));

          return counterWithId;
        },
        'Failed to save counter'
      );
    });
  }


// In firebaseService.ts - Update deleteCounter method
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

      const counterData = counterDoc.data();
      console.log('Found counter data:', counterData);

      const batch = writeBatch(db);
      
      // Delete counter
      batch.delete(counterRef);

      // Create change log
      const changeRef = doc(collection(db, 'changes'));
      const userId = await this.getCurrentUserId();
      
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

  // Fetch operations
  static async getFleets(): Promise<Fleet[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'fleets'));
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Raw fleet data before processing:', data);
        
        // Säker hantering av timestamps
        let processedData: Partial<Fleet> = {
          ...data,
          id: doc.id,
        };
  
        // Försök konvertera timestamps om de finns
        try {
          if (data.createdAt) {
            if (data.createdAt instanceof Timestamp) { // Om det är ett Firestore Timestamp
              processedData.createdAt = data.createdAt.toDate().toISOString();
            } else if (typeof data.createdAt === 'number') { // Om det är en millisekundstidsstämpel
              processedData.createdAt = new Date(data.createdAt).toISOString();
            }
          }
  
          if (data.lastUpdated) {
            if (data.lastUpdated instanceof Timestamp) { // Om det är ett Firestore Timestamp
              processedData.lastUpdated = data.lastUpdated.toDate().toISOString();
            } else if (typeof data.lastUpdated === 'number') { // Om det är en millisekundstidsstämpel
              processedData.lastUpdated = new Date(data.lastUpdated).toISOString();
            }
          }
        } catch (timestampError) {
          console.warn('Error processing timestamps:', timestampError);
        }
  
        console.log('Processed fleet data:', processedData);
        return processedData as Fleet;
      });
    } catch (error) {
      console.error('Error getting fleets:', error);
      throw new Error('Failed to get fleets');
    }
  }
  
  static async getSquads(): Promise<Squad[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'squads'));
      if (querySnapshot.empty) {
        console.warn('No squads found');
        return [];
      }
  
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Raw squad data before processing:', data);
  
        // Säker hantering av timestamps
        let processedData: Partial<Squad> = {
          ...data,
          id: doc.id,
        };
  
        // Försök konvertera timestamps om de finns
        try {
          if (data.createdAt) {
            if (data.createdAt instanceof Timestamp) { // Om det är ett Firestore Timestamp
              processedData.createdAt = data.createdAt.toDate().toISOString();
            } else if (typeof data.createdAt === 'number') { // Om det är en millisekundstidsstämpel
              processedData.createdAt = new Date(data.createdAt).toISOString();
            }
          }
  
          if (data.lastUpdated) {
            if (data.lastUpdated instanceof Timestamp) { // Om det är ett Firestore Timestamp
              processedData.lastUpdated = data.lastUpdated.toDate().toISOString();
            } else if (typeof data.lastUpdated === 'number') { // Om det är en millisekundstidsstämpel
              processedData.lastUpdated = new Date(data.lastUpdated).toISOString();
            }
          }
        } catch (timestampError) {
          console.warn('Error processing timestamps:', timestampError);
        }
  
        console.log('Processed squad data:', processedData);
        return processedData as Squad;
      });
    } catch (error) {
      console.error('Error getting squads:', error);
      throw new Error('Failed to get squads');
    }
  }

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

  // Helper method för att kolla om dokument existerar
  private static async documentExists(collectionName: string, id: string): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  }

  // Synkronisera alla data
  static async syncAllData() {
    try {
      const [squads, fleets, counters] = await Promise.all([
        this.getSquads(),
        this.getFleets(),
        this.getCounters()
      ]);

      return {
        squads,
        fleets,
        counters,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error syncing data:', error);
      throw new Error('Failed to sync data');
    }
  }

  private static async getCurrentUserId(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }
    return user.uid;
  }
}