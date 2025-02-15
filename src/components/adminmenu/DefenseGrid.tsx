import React, { useCallback } from 'react';
import { Squad, Fleet, Counter } from '@/types';
import { DefenseCard } from './DefenseCard';
import { LoadingIndicator } from '../ui/LoadingIndicator';
import { DefenseService } from '@/services/defenseService';
// import { DefenseErrorBoundary } from './DefenseErrorBoundary';
// import { motion, AnimatePresence } from 'framer-motion';

interface DefenseGridProps {
  items: (Squad | Fleet)[];
  onEdit: (defense: Squad | Fleet) => void;
  onDelete: (defense: Squad | Fleet) => void;
  onAddCounter: (defense: Squad | Fleet) => void;
  onEditCounter: (counter: Counter) => void;
  onDeleteCounter: (counterId: string) => void;
  isAdmin: boolean;
  isLoading?: boolean;
}

export const DefenseGrid: React.FC<DefenseGridProps> = ({
  items,
  onEdit,
  onDelete,
  onAddCounter,
  onEditCounter,
  onDeleteCounter,
  isAdmin,
  isLoading = false
}) => {
  // console.log('DefenseGrid rendering with items:', items); // Debug logging

  const handleDefenseEdit = useCallback((defense: Squad | Fleet) => {
    // this function is called when a defense is edited
    onEdit(defense);
  }, [onEdit]);

  const handleEditCounter = useCallback(async (counter: Counter) => {
    console.log('DefenseGrid: Received counter for edit:', counter);
    if (onEditCounter) {
        await onEditCounter(counter);
    }
}, [onEditCounter]);

  const loadCounters = useCallback(async (defenseId: string, type: 'squad' | 'fleet') => {
    try {
      const counters = await DefenseService.getCountersForDefense(defenseId, type);
      return counters;
    } catch (error) {
      console.error('Error loading counters:', error);
      return [];
    }
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingIndicator size="lg" message="Loading defenses..." />
      </div>
    );
  }

  if (!Array.isArray(items)) {
    console.error('Items is not an array:', items);
    return (
      <div className="flex flex-col items-center justify-center py-12 text-white/60">
        <p className="text-lg">Error loading items</p>
        <p className="text-sm mt-2">Please try refreshing the page</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-white/60">
        <p className="text-lg">No items found</p>
        <p className="text-sm mt-2">Click "New Squad" or "New Fleet" to add one</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {items.map((item) => (
        <DefenseCard
          key={item.id}
          defense={item}
          onEdit={handleDefenseEdit} 
          onDelete={onDelete}
          onAddCounter={onAddCounter}
          onEditCounter={onEditCounter}
          onDeleteCounter={onDeleteCounter}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
};