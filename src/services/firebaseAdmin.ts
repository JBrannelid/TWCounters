import { db, storage } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export class FirebaseAdminService {
  // User Management -fetch user role of a user by uid from Firestore database
  static async getUserRole(uid: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid)); // get user role data from Firestore
      if (!userDoc.exists()) return null; // return null if user does not exist
      return userDoc.data(); // return user role data if user exists
    } catch (error) {
      console.error('Error getting user role:', error);
      return null; // return null if error occurs
    }
  }

  // set user role to admin or master admin. This function updates the user role in Firestore database with the new values
  static async setUserRole(uid: string, isAdmin: boolean, isMasterAdmin: boolean = false) {
    try {
      // set user role data in Firestore database and merge the data if user already exists. Set timestamp for updatedAt field
      await setDoc(doc(db, 'users', uid), {
        isAdmin,
        isMasterAdmin,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('Error setting user role:', error);
      return false;
    }
  }

  // Image Management with Firebase Storage and return the download URL of the uploaded image
  static async uploadUnitImage(
    file: File,
    unitId: string,
    type: 'characters' | 'ships'
  ): Promise<string> {
    try {
      // try creating a reference to the image file in Firebase Storage
      const storageRef = ref(storage, `${type}/${unitId}.webp`); // create a reference to the image file in Firebase Storage
      await uploadBytes(storageRef, file); // upload the image file to Firebase Storage
      return await getDownloadURL(storageRef); // fetch the download URL of the uploaded image
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // Unit Management (update unit data in Firestore database)
  static async updateUnitData(
    collectionName: 'characters' | 'ships', // specify the collection name for units (characters or ships)
    unitId: string, // unit identifier
    data: any // unit data to be updated (fields like name, description, image, etc.)
  ) {
    try {
      const unitRef = doc(db, collectionName, unitId); // create a reference to the unit document in Firestore
      await updateDoc(unitRef, {
        ...data, // update the unit data with the new values
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error updating unit data:', error);
      return false;
    }
  }
}

export default FirebaseAdminService;