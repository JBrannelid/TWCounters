import { useState, useCallback } from 'react';
import { DefenseService } from '@/services/defenseService';
import { Squad, Fleet, Counter } from '@/types';
import { normalizeId } from '@/lib/imageMapping';

// Hook for managing defense data in the app
export const useDefenseManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add a new defense to the database
  const addDefense = useCallback(async (
    defense: Squad | Fleet,
    type: 'squad' | 'fleet'
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Log the defense data before sending it to the server
      // console.log('useDefenseManager adding defense:', defense);
      
      // create a deep copy of the defense object to avoid modifying the original object 
      const completeDefense = JSON.parse(JSON.stringify({
        ...defense,
        id: normalizeId(defense.name),
        type,
        // check that all the necessary fields are present in the defense object, extract them, and assign them to the new object
        characters: defense.type === 'squad' ? (defense as Squad).characters || [] : undefined,
        startingLineup: defense.type === 'fleet' ? (defense as Fleet).startingLineup || [] : undefined,
        reinforcements: defense.type === 'fleet' ? (defense as Fleet).reinforcements || [] : undefined
      }));

      // validate the defense object before sending it to the server
      if (type === 'squad') {
        const squad = completeDefense as Squad;
        if (!squad.leader || !Array.isArray(squad.characters) || !squad.characters.length) {
          throw new Error('Invalid squad data: Missing leader or characters');
        }
        // set the leader field to an object with the necessary properties
        squad.leader = {
          id: squad.leader.id,
          name: squad.leader.name,
          role: squad.leader.role || '',
          alignment: squad.leader.alignment,
          isGalacticLegend: Boolean(squad.leader.isGalacticLegend)
        };
        // normalize the characters array by setting each character to an object with the necessary properties
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
      if (!result.success) { // check if the server response indicates an error
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

  // Update an existing defense in the database 
  const updateDefense = useCallback(async (
    defense: Squad | Fleet,
    type: 'squad' | 'fleet'
  ) => {
    setIsLoading(true); // set the loading state to true to indicate that the operation is in progress
    setError(null); // clear any previous error messages
    
    try {
      // create a deep copy of the defense object to avoid modifying the original object 
      const result = await DefenseService.updateDefense(defense, type);
      if (!result.success) { // check if the server response indicates an error 
        throw new Error(result.error); // throw an error with the error message from the server
      }
      return result.data; // return the updated defense data from the server if the operation was successful 
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update defense';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false); // set the loading state to false when the operation is complete
    }
  }, []);

  // Delete a defense from the database based on its ID and type
  const deleteDefense = useCallback(async (
    id: string,
    type: 'squad' | 'fleet'
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await DefenseService.deleteDefense(id, type); // send a request to the server to delete the defense
      if (!result.success) { // if no success response is received from the server
        throw new Error(result.error);
      }
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete defense';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false); // if an error occurs or the operation is complete, set the loading state to false
    }
  }, []);

  // Add a new counter to the database for a specific defense ID 
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

  // Delete a counter from the database based on its ID and type 
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

  // Get the counters for a specific defense ID and type
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