import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Counter, Squad, Fleet } from '@/types';

export class CounterService {
  static async addCounter(defense: Squad | Fleet, counter: Counter) {
    try {
      const defenseRef = doc(db, defense.type === 'squad' ? 'squads' : 'fleets', defense.id);
      
      // Lägg till counter i defense dokumentet
      await updateDoc(defenseRef, {
        counters: arrayUnion({
          ...counter,
          targetDefenseId: defense.id,
          targetDefenseType: defense.type
        })
      });

      // Skapa nytt counter-dokument
      const counterRef = doc(db, 'counters', counter.id);
      await updateDoc(counterRef, {
        targetDefenseId: defense.id,
        targetDefenseType: defense.type
      });

      return true;
    } catch (error) {
      console.error('Error adding counter:', error);
      throw error;
    }
  }

  static async removeCounter(defense: Squad | Fleet, counterId: string) {
    try {
      const defenseRef = doc(db, defense.type === 'squad' ? 'squads' : 'fleets', defense.id);
      
      await updateDoc(defenseRef, {
        counters: arrayRemove(counterId)
      });

      const counterRef = doc(db, 'counters', counterId);
      await updateDoc(counterRef, {
        targetDefenseId: null,
        targetDefenseType: null
      });

      return true;
    } catch (error) {
      console.error('Error removing counter:', error);
      throw error;
    }
  }
}