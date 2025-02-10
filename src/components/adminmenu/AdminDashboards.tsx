import React, { useState, useCallback } from 'react';
import { Squad, Fleet, Counter, Character, Ship } from '@/types';  
import { DefenseGrid } from './DefenseGrid';
import { AdminLayout } from './AdminLayout';
import { LoadingIndicator } from '../ui/LoadingIndicator';
import { Plus } from 'lucide-react';
import { CounterEditor } from '@/components/Counter/CounterEditor';
import { DefenseEditor } from './DefenseEditor';

interface AdminDashboardsProps {
  squads: Squad[];
  fleets: Fleet[];
  counters: Counter[];
  isAdmin: boolean;
  availableCharacters: Character[];  
  availableShips: Ship[];          
  isLoading?: boolean;
  onDeleteCounter: (id: string) => Promise<void>;
  onUpdateSquad: (squad: Squad) => Promise<void>;
  onDeleteSquad: (id: string) => Promise<void>;
  onUpdateFleet: (fleet: Fleet) => Promise<void>;
  onDeleteFleet: (id: string) => Promise<void>;
  onAddCounter: (counter: Omit<Counter, "id">) => Promise<void>;
  onEdit?: (defense: Squad | Fleet) => Promise<void>;
  onUpdateCounter: (counter: Counter) => Promise<void>;
  onLogout: () => Promise<void>;
}

export const AdminDashboards: React.FC<AdminDashboardsProps> = ({ 
  squads,
  fleets,
  counters,
  availableCharacters,
  availableShips,
  onUpdateSquad,
  onDeleteSquad,
  onUpdateFleet,
  onDeleteFleet,
  onAddCounter,
  onUpdateCounter,
  onDeleteCounter,
  onLogout,
  isLoading = false
}) => {
  const [error, setError] = useState<string | null>(null);
  const [selectedDefense, setSelectedDefense] = useState<Squad | Fleet | null>(null);
  const [showCounterEditor, setShowCounterEditor] = useState(false);
  const [editingCounter, setEditingCounter] = useState<Counter | null>(null);

  const handleEditCounter = useCallback(async (counter: Counter) => {
    try {
      setEditingCounter(counter);
      setSelectedDefense(counter.targetSquad);
      setShowCounterEditor(true);
    } catch (error) {
      console.error('Error in handleEditCounter:', error);
      setError('Failed to prepare counter edit');
    }
  }, []);

  const handleAddCounter = useCallback((defense: Squad | Fleet) => {
    if (!defense?.id) {
      console.error('Invalid defense object:', defense);
      return;
    }
    setSelectedDefense(defense);
    setShowCounterEditor(true);
  }, []);

  const handleSaveCounter = async (counter: Counter) => {
    try {
      await onUpdateCounter(counter);
      setShowCounterEditor(false);
      setEditingCounter(null);
      setSelectedDefense(null);
    } catch (error) {
      console.error('Error saving counter:', error);
      setError('Failed to save counter');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout onLogout={onLogout}>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingIndicator size="lg" message="Loading data..." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout onLogout={onLogout}>
      <div className="min-h-screen bg-space-darker">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 m-4 rounded-lg">
            {error}
          </div>
        )}
        
        <div className="container mx-auto px-4 py-8">
          <DefenseGrid
            items={[...squads, ...fleets]}
            onEdit={async (defense) => {
              try {
                if ('leader' in defense) {
                  await onUpdateSquad(defense);
                } else {
                  await onUpdateFleet(defense);
                }
              } catch (error) {
                console.error('Error updating defense:', error);
                setError('Failed to update defense');
              }
            }}
            onDelete={async (defense) => {
              try {
                if ('leader' in defense) {
                  await onDeleteSquad(defense.id);
                } else {
                  await onDeleteFleet(defense.id);
                }
              } catch (error) {
                console.error('Error deleting defense:', error);
                setError('Failed to delete defense');
              }
            }}
            onAddCounter={handleAddCounter}
            onEditCounter={handleEditCounter}
            onDeleteCounter={onDeleteCounter}
            isAdmin={true}
          />
        </div>

        {/* Counter Editor Modal */}
        {showCounterEditor && selectedDefense && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl mx-auto">
              <CounterEditor
                targetDefense={selectedDefense}
                existingCounter={editingCounter}
                onSave={handleSaveCounter}
                onCancel={() => {
                  setShowCounterEditor(false);
                  setEditingCounter(null);
                  setSelectedDefense(null);
                }}
                onDelete={async (counterId: string) => {
                  try {
                    await onDeleteCounter(counterId);
                    setShowCounterEditor(false);
                    setEditingCounter(null);
                    setSelectedDefense(null);
                  } catch (error) {
                    console.error('Error deleting counter:', error);
                    setError('Failed to delete counter');
                  }
                }}
                availableUnits={selectedDefense.type === 'squad' ? availableCharacters : availableShips}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboards;