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

  // Helper method to clean data for Firestore by removing null/undefined values
  private static cleanDataForFirestore(obj: any): any {
    if (obj === null || obj === undefined) {
      return null; // Return null for null or undefined values
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanDataForFirestore(item)).filter(item => item != null); // Clean array elements
    }

    if (typeof obj === 'object') {
      const cleanedObj: any = {};
      // Clean each key-value pair in the object
      for (const [key, value] of Object.entries(obj)) {
        const cleanedValue = this.cleanDataForFirestore(value);
        if (cleanedValue != null) {
          cleanedObj[key] = cleanedValue; // Add cleaned value to new object
        }
      }
      return cleanedObj; // Return cleaned object
    }

    return obj; // Return the original value if it's neither an array nor an object
  }

  // Method to create an admin user in Firestore
  static async createAdminUser(email: string) {
    try {
      console.log('Creating admin user...');
      const userRef = doc(db, 'users', 'admin'); // Reference to the 'admin' user document
      await setDoc(userRef, {
        email,
        isAdmin: true,
        isMasterAdmin: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });
      console.log('Admin user created successfully');
      return true; // Return success if admin user is created
    } catch (error) {
      console.error('Error creating admin user:', error);
      throw error; // Throw error if creation fails
    }
  }

  // Method to synchronize all data (e.g., creating an admin user)
  static async syncAll() {
    try {
      // console.log('Starting full data sync...');
      
      // Fetch the admin email from the environment variable
      const adminEmail = process.env.ADMIN_EMAIL;
      
      // Ensure that the email is set and valid
      if (!adminEmail) {
        throw new Error('Admin email is not set in the environment variables');
      }
      
      await Promise.all([
        this.createAdminUser(adminEmail)
      ]);
  
      console.log('All data synced successfully');
      return true; 
    } catch (error) {
      console.error('Error during full sync:', error);
      throw error;
    }
  }
  
  // Method to clear all data in specified collections (use with caution!)
  static async clearAllData() {
    try {
      console.log('Starting data clear...');
      
      const collections = ['squads', 'fleets', 'counters']; // Specify collections to be cleared
      const batch = writeBatch(db); // Create a batch for atomic writes

      for (const collectionName of collections) {
        const querySnapshot = await getDocs(collection(db, collectionName)); // Get all documents in the collection
        querySnapshot.forEach((document: QueryDocumentSnapshot) => {
          batch.delete(document.ref); // Add delete operation for each document
        });
      }

      await batch.commit(); // Commit all delete operations in the batch
      console.log('All data cleared successfully');
      return true; // Return success after clearing data
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error; // Throw error if clearing data fails
    }
  }
}