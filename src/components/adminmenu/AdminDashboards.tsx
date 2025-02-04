import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Squad, Fleet, Counter, Character, Ship } from '@/types';  
import { DefenseEditor } from './DefenseEditor';
import { CounterEditor } from '@/components/Counter/CounterEditor';
import { AdminLayout } from './AdminLayout';
import { useFirebase } from '@/contexts/FirebaseContext';
import { LoadingIndicator } from '../ui/LoadingIndicator';
import { Plus, Shield, Ship as ShipIcon, Database, Settings, RefreshCw } from 'lucide-react';
import { SettingsManager } from './SettingsManager';
import { SyncManager } from './SyncManager';
import { DataManager } from './DataManager';
import { FirebaseService } from '@/services/firebaseService';
import { DefenseGrid } from './DefenseGrid';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DefenseService } from '@/services/defenseService';

interface MainContentProps {
  squads: Squad[];
  fleets: Fleet[];
  onUpdateSquad: (squad: Squad) => Promise<void>;
  onDeleteSquad: (id: string) => Promise<void>;
  onUpdateFleet: (fleet: Fleet) => Promise<void>;
  onDeleteFleet: (id: string) => Promise<void>;
  onAddCounter: (counter: Omit<Counter, "id">) => Promise<void>;
  onUpdateCounter: (counter: Counter) => Promise<void>;
}

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
  onUpdateCounter: (counter: Counter) => Promise<void>;
  onLogout: () => Promise<void>;
}

export const AdminDashboards: React.FC<AdminDashboardsProps> = ({ 
  squads,
  fleets,
  counters,
  availableCharacters,
  availableShips,
  isLoading = false,
  onUpdateSquad,
  onDeleteSquad,
  onUpdateFleet,
  onDeleteFleet,
  onAddCounter,
  onUpdateCounter,
  onDeleteCounter,
  onLogout
}) => {
  const { isOnline } = useFirebase();
  const [error, setError] = useState<string | null>(null);
  const [selectedDefense, setSelectedDefense] = useState<Squad | Fleet | null>(null);
  const [showCounterEditor, setShowCounterEditor] = useState(false);
  const [editingCounter, setEditingCounter] = useState<Counter | null>(null);
  const navigate = useNavigate();
  const [showDefenseEditor, setShowDefenseEditor] = useState(false);
  const [editingDefense, setEditingDefense] = useState<Squad | Fleet | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editorType, setEditorType] = useState<'squad' | 'fleet'>('squad');
  
  const handleEditCounter = useCallback((counter: Counter) => {
    console.log('AdminDashboards handleEditCounter called', { counter });
    if (!isOnline) {
      setError('Cannot edit counter while offline');
      return;
    }
  
    try {
      setEditingCounter(counter);
      setSelectedDefense(counter.targetSquad);
      setShowCounterEditor(true);
    } catch (error) {
      console.error('Error setting up counter edit:', error);
      setError('Failed to prepare counter edit');
    }
  }, [isOnline]);

  const handleAddCounter = (defense: Squad | Fleet) => {
    console.log('Opening counter editor for:', defense);
    try {
      if (!defense || !defense.id) {
        console.error('Invalid defense object:', defense);
        return;
      }
      setSelectedDefense(defense);
      setShowCounterEditor(true);
    } catch (error) {
      console.error('Error in handleAddCounter:', error);
    }
  };

  const handleEdit = async (defense: Squad | Fleet) => {
    console.log('handleEdit called with:', defense);
    try {
      setEditingDefense(defense);
      setEditorType(defense.type);
      setShowDefenseEditor(true);
    } catch (error) {
      console.error('Error setting up defense edit:', error);
      setError('Failed to prepare defense edit');
    }
  };

  const handleDelete = async (defense: Squad | Fleet) => {
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
  };

  const handleDeleteCounter = async (counterId: string) => {
    if (!isOnline) {
      setError('Cannot delete counter while offline');
      return;
    }

    try {
      await onDeleteCounter(counterId);
    } catch (error) {
      console.error('Error deleting counter:', error);
      setError('Failed to delete counter');
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

  function onEdit(defense: Squad | Fleet) {
    throw new Error('Function not implemented.');
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
          {/* Action buttons for adding new squads/fleets */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => {
                setEditorType('squad');
                setShowEditor(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
              Add New Squad
            </button>
            <button
              onClick={() => {
                setEditorType('fleet');
                setShowEditor(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
              Add New Fleet
            </button>
          </div>

          <DefenseGrid
            items={[...squads, ...fleets]}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddCounter={handleAddCounter}
            onEditCounter={handleEditCounter}
            onDeleteCounter={handleDeleteCounter}
            isAdmin={true}
          />
        </div>

        {/* Defense Editor Modal */}
        {showDefenseEditor && editingDefense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl">
            <DefenseEditor
              type={editingDefense.type}
              initialData={editingDefense}
              onSave={async (defense) => {
                try {
                  if ('leader' in defense) {
                    await onUpdateSquad(defense);
                  } else {
                    await onUpdateFleet(defense);
                  }
                  setShowDefenseEditor(false);
                  setEditingDefense(null);
                } catch (error) {
                  console.error('Error saving defense:', error);
                  setError('Failed to save defense');
                }
              }}
              onCancel={() => {
                setShowDefenseEditor(false);
                setEditingDefense(null);
              }}
              availableUnits={editingDefense.type === 'squad' ? availableCharacters : availableShips}
            />
          </div>
        </div>
      )}

      {showCounterEditor && selectedDefense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl">
            <CounterEditor
              targetDefense={selectedDefense}
              existingCounter={editingCounter}
              onSave={async (counter) => {
                try {
                  await onUpdateCounter(counter);
                  setShowCounterEditor(false);
                  setEditingCounter(null);
                  setSelectedDefense(null);
                } catch (error) {
                  console.error('Error saving counter:', error);
                  setError('Failed to save counter');
                }
              }}
              onCancel={() => {
                setShowCounterEditor(false);
                setEditingCounter(null);
                setSelectedDefense(null);
              }}
              availableUnits={selectedDefense.type === 'squad' ? availableCharacters : availableShips}
            />
          </div>
        </div>
      )}
        {/* Counter Editor Modal */}
        {showCounterEditor && selectedDefense && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl mx-auto">
              <CounterEditor
                targetDefense={selectedDefense}
                existingCounter={editingCounter}
                onSave={async (counter) => {
                  try {
                    console.log('Saving counter:', counter);
                    await onUpdateCounter(counter);
                    setShowCounterEditor(false);
                    setEditingCounter(null);
                    setSelectedDefense(null);
                  } catch (error) {
                    console.error('Error saving counter:', error);
                    setError('Failed to save counter');
                  }
                }}
                onCancel={() => {
                  setShowCounterEditor(false);
                  setEditingCounter(null);
                  setSelectedDefense(null);
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