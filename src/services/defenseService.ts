import { storage } from '@/services/storage';
import { Squad, Fleet, Counter } from '@/types';
import { normalizeId } from '@/lib/imageMapping';
import { FirebaseService } from './firebaseService';
interface DefenseOperation {
  success: boolean;
  error?: string;
  data?: any;
}

export class DefenseService {
  private static validateSquad(squad: Squad): boolean {
    return !!(
      squad.name &&
      squad.id &&
      squad.alignment &&
      squad.leader &&
      squad.type === 'squad' &&
      Array.isArray(squad.characters)
    );
  }

  private static validateFleet(fleet: Fleet): boolean {
    return !!(
      fleet.name &&
      fleet.id &&
      fleet.alignment &&
      fleet.type === 'fleet' &&
      Array.isArray(fleet.startingLineup) &&
      Array.isArray(fleet.reinforcements) &&
      (fleet.capitalShip || fleet.startingLineup.length > 0)
    );
  }

  private static validateCounter(counter: Counter): boolean {
    return !!(
      counter.targetSquad &&
      counter.counterSquad &&
      counter.counterType &&
      counter.description
    );
  }

  static async addDefense(
    defense: Squad | Fleet,
    type: 'squad' | 'fleet'
  ): Promise<DefenseOperation> {
    try {
      console.log('DefenseService received:', { defense, type });
      
      const normalizedDefense = {
        ...defense,
        id: normalizeId(defense.name),
        type
      };

      const isValid = type === 'squad' 
        ? this.validateSquad(normalizedDefense as Squad)
        : this.validateFleet(normalizedDefense as Fleet);

      if (!isValid) {
        console.error('Validation failed:', normalizedDefense);
        throw new Error(`Invalid ${type} data: Missing required fields`);
      }

      console.log('Sending to Firebase:', normalizedDefense);
      // Check for existing defense with same ID
      const existingDefenses = type === 'squad' 
        ? await FirebaseService.getSquads()
        : await FirebaseService.getFleets();
      
      if (existingDefenses.some(d => d.id === normalizedDefense.id)) {
        throw new Error(`A ${type} with this name already exists`);
      }

      // Add to Firebase
      if (type === 'squad') {
        await FirebaseService.addOrUpdateSquad(normalizedDefense as Squad);
      } else {
        await FirebaseService.addOrUpdateFleet(normalizedDefense as Fleet);
      }

      return { success: true, data: normalizedDefense };
    } catch (error) {
      console.error('Error adding defense:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to add defense'
      };
    }
  }

  static async updateDefense(
    defense: Squad | Fleet,
    type: 'squad' | 'fleet'
  ): Promise<DefenseOperation> {
    try {
      console.log('Updating defense:', { defense, type });
      
      const normalizedDefense = {
        ...defense,
        id: normalizeId(defense.name)
      };

      const isValid = type === 'squad' 
        ? this.validateSquad(normalizedDefense as Squad)
        : this.validateFleet(normalizedDefense as Fleet);

      if (!isValid) {
        throw new Error('Invalid defense data');
      }

      if (type === 'squad') {
        const currentSquads = storage.getSquads();
        const updatedSquads = currentSquads.map(s => 
          s.id === normalizedDefense.id ? normalizedDefense as Squad : s
        );
        await storage.saveSquads(updatedSquads);
      } else {
        const currentFleets = storage.getFleets();
        const updatedFleets = currentFleets.map(f => 
          f.id === normalizedDefense.id ? normalizedDefense as Fleet : f
        );
        await storage.saveFleets(updatedFleets);
      }

      console.log('Defense updated successfully:', normalizedDefense);
      return { success: true, data: normalizedDefense };
    } catch (error) {
      console.error('Error updating defense:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update defense'
      };
    }
  }

  static async deleteDefense(
    id: string,
    type: 'squad' | 'fleet'
  ): Promise<DefenseOperation> {
    try {
      console.log('Deleting defense:', { id, type });
      
      if (type === 'squad') {
        const currentSquads = storage.getSquads();
        const updatedSquads = currentSquads.filter(s => s.id !== id);
        await storage.saveSquads(updatedSquads);
      } else {
        const currentFleets = storage.getFleets();
        const updatedFleets = currentFleets.filter(f => f.id !== id);
        await storage.saveFleets(updatedFleets);
      }

      // Remove related counters
      const currentCounters = storage.getCounters();
      const updatedCounters = currentCounters.filter(counter => 
        counter.targetSquad.id !== id && counter.counterSquad.id !== id
      );
      await storage.saveCounters(updatedCounters);

      console.log('Defense deleted successfully:', id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting defense:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete defense'
      };
    }
  }

  static async addCounter(counter: Omit<Counter, 'id'>): Promise<DefenseOperation> {
    try {
      console.log('Adding counter:', counter);
      
      const newCounter: Counter = {
        ...counter,
        id: `counter-${Date.now()}`,
        requirements: counter.requirements || [],
        strategy: counter.strategy || []
      };

      if (!this.validateCounter(newCounter)) {
        throw new Error('Invalid counter data');
      }

      const existingCounters = storage.getCounters();
      
      const isDuplicate = existingCounters.some(
        (existing: Counter) => 
          existing.targetSquad.id === newCounter.targetSquad.id &&
          existing.counterSquad.id === newCounter.counterSquad.id
      );

      if (isDuplicate) {
        return {
          success: false,
          error: 'A similar counter already exists'
        };
      }

      await storage.saveCounters([...existingCounters, newCounter]);

      console.log('Counter added successfully:', newCounter);
      return { success: true, data: newCounter };
    } catch (error) {
      console.error('Error adding counter:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add counter'
      };
    }
  }

  static async deleteCounter(id: string): Promise<DefenseOperation> {
    try {
      console.log('Deleting counter:', id);
      
      const currentCounters = storage.getCounters();
      const updatedCounters = currentCounters.filter(c => c.id !== id);
      await storage.saveCounters(updatedCounters);

      console.log('Counter deleted successfully:', id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting counter:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete counter'
      };
    }
  }

  static async getCountersForDefense(
    defenseId: string,
    type: 'squad' | 'fleet'
  ): Promise<Counter[]> {
    try {
      const allCounters = storage.getCounters();
      return allCounters.filter((counter: Counter) => {
        const isTargetDefense = counter.targetSquad.id === defenseId;
        const isCounterDefense = counter.counterSquad.id === defenseId;
        
        if (type === 'fleet') {
          const isTargetCapitalShip = 'capitalShip' in counter.targetSquad && 
            counter.targetSquad.capitalShip?.id === defenseId;
          return isTargetDefense || isCounterDefense || isTargetCapitalShip;
        }
        
        return isTargetDefense || isCounterDefense;
      });
    } catch (error) {
      console.error('Error getting counters:', error);
      return [];
    }
  }
}