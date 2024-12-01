import { db, storage } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export class FirebaseAdminService {
  // User Management
  static async getUserRole(uid: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) return null;
      return userDoc.data();
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  static async setUserRole(uid: string, isAdmin: boolean, isMasterAdmin: boolean = false) {
    try {
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

  // Image Management
  static async uploadUnitImage(
    file: File,
    unitId: string,
    type: 'characters' | 'ships'
  ): Promise<string> {
    try {
      const storageRef = ref(storage, `${type}/${unitId}.webp`);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // Unit Management
  static async updateUnitData(
    collectionName: 'characters' | 'ships',
    unitId: string,
    data: any
  ) {
    try {
      const unitRef = doc(db, collectionName, unitId);
      await updateDoc(unitRef, {
        ...data,
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