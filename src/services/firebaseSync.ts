// src/services/firebaseSync.ts

import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  writeBatch,
  getDocs,
  QueryDocumentSnapshot
} from 'firebase/firestore';

export class FirebaseSync {
  // Add new helper function
  private static cleanDataForFirestore(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanDataForFirestore(item)).filter(item => item != null);
    }

    if (typeof obj === 'object') {
      const cleanedObj: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleanedValue = this.cleanDataForFirestore(value);
        if (cleanedValue != null) {
          cleanedObj[key] = cleanedValue;
        }
      }
      return cleanedObj;
    }

    return obj;
  }


  // Skapa admin användare
  static async createAdminUser(email: string) {
    try {
      console.log('Creating admin user...');
      const userRef = doc(db, 'users', 'admin');
      await setDoc(userRef, {
        email,
        isAdmin: true,
        isMasterAdmin: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });
      console.log('Admin user created successfully');
      return true;
    } catch (error) {
      console.error('Error creating admin user:', error);
      throw error;
    }
  }

  

  // Synka all data
  static async syncAll() {
    try {
      console.log('Starting full data sync...');
      
      await Promise.all([

        this.createAdminUser('admin@example.com') // Ändra till din admin email
      ]);

      console.log('All data synced successfully');
      return true;
    } catch (error) {
      console.error('Error during full sync:', error);
      throw error;
    }
  }

  // Rensa all data (Var försiktig med denna!)
  static async clearAllData() {
    try {
      console.log('Starting data clear...');
      
      const collections = ['squads', 'fleets', 'counters'];
      const batch = writeBatch(db);

      for (const collectionName of collections) {
        const querySnapshot = await getDocs(collection(db, collectionName));
        querySnapshot.forEach((document: QueryDocumentSnapshot) => {
          batch.delete(document.ref);
        });
      }

      await batch.commit();
      console.log('All data cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
}