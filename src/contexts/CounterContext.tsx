import React, { createContext, useContext, useState, useCallback } from 'react';
import { Squad, Fleet, Counter } from '@/types';
import { useFirebase } from '@/contexts/FirebaseContext';
import { FirebaseService } from '@/services/firebaseService';

interface CounterState {
  showEditor: boolean;
  targetDefense: Squad | Fleet | null;
  editingCounter: Counter | null;
}

interface CounterContextType {
  state: CounterState;
  updateState: (updates: Partial<CounterState>) => void;
  resetState: () => void;
  updateCounter: (counter: Counter) => Promise<void>;
}

const initialState: CounterState = {
  showEditor: false,
  targetDefense: null,
  editingCounter: null
};

const CounterContext = createContext<CounterContextType | undefined>(undefined);

export const CounterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<CounterState>(initialState);
  const { isOnline } = useFirebase();

  const updateState = useCallback((updates: Partial<CounterState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  const updateCounter = useCallback(async (counter: Counter) => {
    if (!isOnline) {
      throw new Error('Cannot update counter while offline');
    }
    
    try {
      // Implementera Firebase counter update logic
      await FirebaseService.addOrUpdateCounter(counter);  // Använder counter parametern
      
      // Uppdatera lokalt state om det behövs
      setState(prev => ({
        ...prev,
        editingCounter: null // Reset editing state efter uppdatering
      }));

    } catch (error) {
      console.error('Failed to update counter:', error);
      throw error;
    }
  }, [isOnline]);

  return (
    <CounterContext.Provider value={{ state, updateState, resetState, updateCounter }}>
      {children}
    </CounterContext.Provider>
  );
};

export const useCounter = () => {
  const context = useContext(CounterContext);
  if (context === undefined) {
    throw new Error('useCounter must be used within a CounterProvider');
  }
  return context;
};