import { useState, useCallback } from 'react';
import { DefenseService } from '@/services/defenseService';
import { Squad, Fleet, Counter } from '@/types';
import { normalizeId } from '@/lib/imageMapping';

export const useDefenseManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addDefense = useCallback(async (
    defense: Squad | Fleet,
    type: 'squad' | 'fleet'
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('useDefenseManager adding defense:', defense);
      
      // Skapa en djup kopia för att undvika referensproblem
      const completeDefense = JSON.parse(JSON.stringify({
        ...defense,
        id: normalizeId(defense.name),
        type,
        // Säkerställ att arrays alltid finns
        characters: defense.type === 'squad' ? (defense as Squad).characters || [] : undefined,
        startingLineup: defense.type === 'fleet' ? (defense as Fleet).startingLineup || [] : undefined,
        reinforcements: defense.type === 'fleet' ? (defense as Fleet).reinforcements || [] : undefined
      }));

      // Validera data innan vi skickar den vidare
      if (type === 'squad') {
        const squad = completeDefense as Squad;
        if (!squad.leader || !Array.isArray(squad.characters) || !squad.characters.length) {
          throw new Error('Invalid squad data: Missing leader or characters');
        }
        // Säkerställ att leader har alla nödvändiga fält
        squad.leader = {
          id: squad.leader.id,
          name: squad.leader.name,
          role: squad.leader.role || '',
          alignment: squad.leader.alignment,
          isGalacticLegend: Boolean(squad.leader.isGalacticLegend)
        };
        // Normalisera character data
        squad.characters = squad.characters.map(char => ({
          id: char.id,
          name: char.name,
          role: char.role || '',
          alignment: char.alignment,
          isGalacticLegend: Boolean(char.isGalacticLegend)
        }));
      }

      console.log('Sending validated defense:', completeDefense);
      const result = await DefenseService.addDefense(completeDefense, type);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add defense';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateDefense = useCallback(async (
    defense: Squad | Fleet,
    type: 'squad' | 'fleet'
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await DefenseService.updateDefense(defense, type);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update defense';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteDefense = useCallback(async (
    id: string,
    type: 'squad' | 'fleet'
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await DefenseService.deleteDefense(id, type);
      if (!result.success) {
        throw new Error(result.error);
      }
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete defense';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCounter = useCallback(async (counter: Omit<Counter, 'id'>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await DefenseService.addCounter(counter);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add counter';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteCounter = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await DefenseService.deleteCounter(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete counter';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCounters = useCallback(async (
    defenseId: string,
    type: 'squad' | 'fleet'
  ) => {
    return DefenseService.getCountersForDefense(defenseId, type);
  }, []);

  return {
    isLoading,
    error,
    addDefense,
    updateDefense,
    deleteDefense,
    addCounter,
    deleteCounter,
    getCounters
  };
};