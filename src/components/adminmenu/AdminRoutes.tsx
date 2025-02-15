/**
 * Main component for handling admin routes and functionality.
 * This file contains the dashboard, squad list, and fleet list components,
 * as well as the main routing logic for the admin section.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { FirebaseService } from '@/services/firebaseService';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SyncManager } from './SyncManager';
import { DataManager } from './DataManager';
import { SettingsManager } from './SettingsManager';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { Plus, AlertTriangle } from 'lucide-react';
import { DefenseEditor } from './DefenseEditor';
import { CounterEditor } from '@/components/Counter/CounterEditor';
import { characters, capital_ships, ships as regular_ships} from '@/data/initialData';
import { Squad, Fleet, Counter, Character, Ship, Filters } from '@/types';
import { useFirebase } from '@/contexts/FirebaseContext';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { SquadList } from '@/components/SquadList';
import { FleetList } from '@/components/FleetList';
// import { useAuth } from '@/contexts/AuthContext';

// const MasterAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const { isMasterAdmin } = useAuth();
  
//   if (!isMasterAdmin) {
//     return <Navigate to="/admin" replace />;
//   }
  
//   return <>{children}</>;
// };  

// Dashboard Component - Handles the main admin dashboard view
const Dashboard: React.FC<{
  squads: Squad[];
  fleets: Fleet[];
  counters: Counter[]; 
  onEdit: (defense: Squad | Fleet) => Promise<void>;
  onDelete: (defense: Squad | Fleet) => Promise<void>; 
  onAddNewDefense: (defense: Squad | Fleet) => Promise<void>;
  availableCharacters: Character[];  
  availableShips: Ship[];        
  onRefreshData: () => Promise<void>;         
}> = ({ 
  squads, 
  fleets, 
  counters, 
  onEdit,
  onAddNewDefense,
  availableCharacters,
  availableShips,
  onRefreshData 
}) => {
  // Stats state for tracking various counts
  const [stats, setStats] = useState({
    totalSquads: 0,
    totalFleets: 0,
    totalCounters: 0,
    lightSideSquads: 0,
    darkSideSquads: 0,
    lightSideFleets: 0,
    darkSideFleets: 0
  });

  // UI state management
  const [showEditor, setShowEditor] = useState(false);
  const [editorType, setEditorType] = useState<'squad' | 'fleet'>('squad');
  const [error, setError] = useState<string | null>(null);

  // Update stats whenever data changes
  useEffect(() => {
    setStats({
      totalSquads: squads.length,
      totalFleets: fleets.length,
      totalCounters: counters.length,
      lightSideSquads: squads.filter(s => s.alignment === 'light').length,
      darkSideSquads: squads.filter(s => s.alignment === 'dark').length,
      lightSideFleets: fleets.filter(f => f.alignment === 'light').length,
      darkSideFleets: fleets.filter(f => f.alignment === 'dark').length
    });
  }, [squads, fleets, counters]);

  // Handler for adding new defense
  const handleAddNew = (type: 'squad' | 'fleet') => {
    setEditorType(type);
    setShowEditor(true);
  };

  // Chart data preparation
  const chartData = [
    { name: 'Squads', Light: stats.lightSideSquads, Dark: stats.darkSideSquads },
    { name: 'Fleets', Light: stats.lightSideFleets, Dark: stats.darkSideFleets }
  ];

  return (
    <div className="p-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header with Add buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-orbitron text-white">Dashboard Overview</h1>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => handleAddNew('squad')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Squad</span>
          </button>
          
          <button
            onClick={() => handleAddNew('fleet')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Fleet</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-space-dark p-6 rounded-lg border border-white/10">
          <h3 className="text-lg font-medium text-white mb-2">Total Squads</h3>
          <p className="text-3xl font-orbitron text-blue-400">{stats.totalSquads}</p>
        </div>
        
        <div className="bg-space-dark p-6 rounded-lg border border-white/10">
          <h3 className="text-lg font-medium text-white mb-2">Total Fleets</h3>
          <p className="text-3xl font-orbitron text-blue-400">{stats.totalFleets}</p>
        </div>
        
        <div className="bg-space-dark p-6 rounded-lg border border-white/10">
          <h3 className="text-lg font-medium text-white mb-2">Total Counters</h3>
          <p className="text-3xl font-orbitron text-blue-400">{stats.totalCounters}</p>
        </div>
      </div>
      {/* Chart Section */}
      <div className="bg-space-dark p-6 rounded-lg border border-white/10">
        <h3 className="text-lg font-medium text-white mb-4">Alignment Distribution</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Light" fill="#3B82F6" />
              <Bar dataKey="Dark" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Defense Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl">
            <DefenseEditor
              type={editorType}
              onSave={async (defense) => {
                try {
                  await onAddNewDefense(defense);
                  setShowEditor(false);
                } catch (error) {
                  setError(error instanceof Error ? error.message : 'Failed to save defense');
                }
              }}
              onCancel={() => setShowEditor(false)}
              availableUnits={editorType === 'squad' ? availableCharacters : availableShips}
            />
          </div>
        </div>
      )}
    </div>
  );
};
// Main Admin Routes Component
export const AdminRoutes: React.FC = () => {
  // Firebase and state management
  const { isOnline } = useFirebase();
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [squads, setSquads] = useState<Squad[]>([]);
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);
  const [availableShips, setAvailableShips] = useState<Ship[]>([]);
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDefense, setSelectedDefense] = useState<Squad | Fleet | null>(null);
  const [showCounterEditor, setShowCounterEditor] = useState(false);
  const [showDefenseEditor, setShowDefenseEditor] = useState(false);
  const [editingDefense, setEditingDefense] = useState<Squad | Fleet | null>(null);
  const [editingCounter, setEditingCounter] = useState<Counter | null>(null);
  const [defenseType, setDefenseType] = useState<'squad' | 'fleet'>('squad');

  // Load initial data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [loadedSquads, loadedFleets, loadedCounters] = await Promise.all([
        FirebaseService.getSquads(),
        FirebaseService.getFleets(),
        FirebaseService.getCounters()
      ]);

      setSquads(loadedSquads);
      setSquads(loadedSquads);
      setFleets(loadedFleets);
      setCounters(loadedCounters);

      const allShips = [...Object.values(capital_ships), ...Object.values(regular_ships)];
      setAvailableShips(allShips as Ship[]);
      setAvailableCharacters(Object.values(characters) as Character[]);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler for adding new defense
  const handleAddNewDefense = async (defense: Squad | Fleet) => {
    try {
      if (!isOnline) {
        throw new Error('Cannot add defense while offline');
      }

      if ('leader' in defense) {
        await FirebaseService.addOrUpdateSquad(defense as Squad);
        setSquads(prev => [...prev, defense as Squad]);
      } else {
        await FirebaseService.addOrUpdateFleet(defense as Fleet);
        setFleets(prev => [...prev, defense as Fleet]);
      }
      await loadData();
    } catch (error) {
      console.error('Error adding new defense:', error);
      throw error;
    }
  };

  // Handler for editing existing defense
  const handleEdit = async (defense: Squad | Fleet) => {
    try {
      if (!isOnline) {
        setError('Cannot edit while offline');
        return;
      }
      setEditingDefense(defense);
      setShowDefenseEditor(true);
    } catch (error) {
      console.error('Error in handleEdit:', error);
      setError('Failed to prepare defense edit');
    }
  };

  // Handler for deleting defense
  const handleDelete = async (defense: Squad | Fleet) => {
    try {
      console.log('Starting delete for defense:', defense);
      
      if (!isOnline) {
        setError('Cannot delete while offline');
        return;
      }

      if ('leader' in defense) {
        console.log('Deleting squad with ID:', defense.id);
        await FirebaseService.deleteSquad(defense.id);
        console.log('Squad deleted from Firebase');
        setSquads(prev => prev.filter(s => s.id !== defense.id));
        console.log('Local squad state updated');
      } else {
        console.log('Deleting fleet with ID:', defense.id);
        await FirebaseService.deleteFleet(defense.id);
        console.log('Fleet deleted from Firebase');
        setFleets(prev => prev.filter(f => f.id !== defense.id));
        console.log('Local fleet state updated');
      }
      
      console.log('Starting data reload');
      await loadData(); // Reloads all data after deletion
      console.log('Data reload complete');
    } catch (error) {
      console.error('Error deleting defense:', error);
      setError('Failed to delete defense');
    }
  };

  // Counter-related handlers
  const handleEditCounter = async (counter: Counter) => {
    try {
      if (!isOnline) {
        setError('Cannot edit counter while offline');
        return;
      }
      setSelectedDefense(counter.targetSquad);
      setEditingCounter(counter);
      setShowCounterEditor(true);
    } catch (error) {
      console.error('Error in handleEditCounter:', error);
      setError('Failed to prepare counter edit');
    }
  };

  const handleAddCounter = (defense: Squad | Fleet) => {
    if (!isOnline) {
      setError('Cannot add counter while offline');
      return;
    }
    setSelectedDefense(defense);
    setShowCounterEditor(true);
  };

  const handleDeleteCounter = async (counterId: string) => {
    try {
      if (!isOnline) {
        setError('Cannot delete counter while offline');
        return;
      }
      await FirebaseService.deleteCounter(counterId);
      setCounters(prev => prev.filter(c => c.id !== counterId));
      await loadData();
    } catch (error) {
      console.error('Error deleting counter:', error);
      setError('Failed to delete counter');
    }
  };

  const getCountersForDefense = (defenseId: string, type: 'squad' | 'fleet'): Counter[] => {
    return counters.filter(counter => {
      const isTargetDefense = counter.targetSquad?.id === defenseId;
      const isCounterDefense = counter.counterSquad?.id === defenseId;
      const isCapitalShip = type === 'fleet' && 
        'capitalShip' in counter.targetSquad && 
        counter.targetSquad.capitalShip?.id === defenseId;
      
      return isTargetDefense || isCounterDefense || isCapitalShip;
    });
  };
  
  const defaultFilters: Filters = {
    battleType: null,
    alignment: null,
    showTWOmicronOnly: false,
    showHardCounters: false,
    excludeGL: false,
    searchTerm: ''
  }; 
  
    // Loading state handling
    if (isLoading) {
      return (
        <AdminLayout>
          <div className="flex items-center justify-center min-h-screen">
            <LoadingIndicator size="lg" message="Loading data..." />
          </div>
        </AdminLayout>
      );
    }

  // Main render with updated routes
  return (
    <AdminLayout>
      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Routes>
        {/* Dashboard Route */}
        <Route 
          path="/" 
          element={
            <Dashboard 
              squads={squads}
              fleets={fleets}
              counters={counters}
              onEdit={handleEdit}
              onDelete={handleDelete} 
              onAddNewDefense={handleAddNewDefense}
              availableCharacters={availableCharacters}
              availableShips={availableShips}
              onRefreshData={loadData}  
            />
          } 
        />

        {/* Squads Management Route */}
        <Route 
          path="/squads" 
          element={
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-orbitron text-white">Squad Management</h1>
                <button
                  onClick={() => {
                    setEditingDefense(null);
                    setDefenseType('squad');
                    setShowDefenseEditor(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4" />
                  New Squad
                </button>
              </div>
              
              <SquadList
                squads={squads}
                filteredSquads={squads}
                selectedSquadId={selectedDefense?.id || null}
                onSelectSquad={(id) => {
                  const squad = squads.find(s => s.id === id);
                  setSelectedDefense(squad || null);
                }}
                getCounters={(id) => getCountersForDefense(id, 'squad')}
                isAdmin={true}
                onDeleteCounter={handleDeleteCounter}
                onEditCounter={handleEditCounter}
                filters={defaultFilters}
                onEdit={handleEdit}
                onDelete={handleDelete} 
                onAddCounter={handleAddCounter}
              />

              {/* Defense Editor Modal */}
              {showDefenseEditor && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="w-full max-w-3xl">
                    <DefenseEditor
                      type="squad"
                      onSave={async (defense) => {
                        try {
                          await handleAddNewDefense(defense);
                          setShowDefenseEditor(false);
                        } catch (error) {
                          setError(error instanceof Error ? error.message : 'Failed to save squad');
                        }
                      }}
                      onCancel={() => setShowDefenseEditor(false)}
                      availableUnits={availableCharacters}
                    />
                  </div>
                </div>
              )}
            </div>
          } 
        />

        {/* Fleets Management Route */}
        <Route 
          path="/fleets" 
          element={
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-orbitron text-white">Fleet Management</h1>
                <button
                  onClick={() => {
                    setEditingDefense(null);
                    setDefenseType('fleet');
                    setShowDefenseEditor(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4" />
                  New Fleet
                </button>
              </div>
              
              <FleetList
                fleets={fleets}
                filteredFleets={fleets}
                selectedFleetId={selectedDefense?.id || null}
                onSelectFleet={(id) => {
                  const fleet = fleets.find(f => f.id === id);
                  setSelectedDefense(fleet || null);
                }}
                getCounters={(id) => getCountersForDefense(id, 'fleet')}
                isAdmin={true}
                onDeleteCounter={handleDeleteCounter}
                onEditCounter={handleEditCounter}
                filters={defaultFilters}
                onEdit={handleEdit}
                onAddCounter={handleAddCounter}
                onDelete={handleDelete} 
              />

              {/* Defense Editor Modal */}
              {showDefenseEditor && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="w-full max-w-3xl">
                    <DefenseEditor
                      type="fleet"
                      onSave={async (defense) => {
                        try {
                          await handleAddNewDefense(defense);
                          setShowDefenseEditor(false);
                        } catch (error) {
                          setError(error instanceof Error ? error.message : 'Failed to save fleet');
                        }
                      }}
                      onCancel={() => setShowDefenseEditor(false)}
                      availableUnits={availableShips}
                    />
                  </div>
                </div>
              )}
            </div>
          } 
        />

          {/* Settings Route */}
          <Route path="/settings" element={<SettingsManager />} />
          
          {/* Sync Route */}
          <Route path="/sync" element={<SyncManager />} />
          
          {/* Protected Data Management Route */}
          <Route 
            path="/sync" 
            // Allow access to admin and Master Admins at the moment 
            element={
              // <MasterAdminRoute>
                <SyncManager />
              // <MasterAdminRoute />
            } 
          />
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/admin" replace />} />

        {/* Other Routes */}
        <Route path="/settings" element={<SettingsManager />} />
        <Route path="/sync" element={<SyncManager />} />
        <Route path="/data" element={<DataManager />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>

      {/* Counter Editor Modal */}
      {showCounterEditor && selectedDefense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl mx-auto">
            <CounterEditor
              targetDefense={selectedDefense}
              existingCounter={editingCounter}
              onSave={async (counter) => {
                try {
                  await FirebaseService.addOrUpdateCounter(counter);
                  await loadData();
                  setShowCounterEditor(false);
                  setSelectedDefense(null);
                  setEditingCounter(null);
                } catch (error) {
                  console.error('Error saving counter:', error);
                  setError('Failed to save counter');
                }
              }}
              onCancel={() => {
                setShowCounterEditor(false);
                setSelectedDefense(null);
                setEditingCounter(null);
              }}
              onDelete={handleDeleteCounter}
              availableUnits={
                'leader' in selectedDefense ? availableCharacters : availableShips
              }
            />
          </div>
        </div>
      )}

      {/* Defense Editor Modal for Editing */}
      {showDefenseEditor && editingDefense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="w-full max-w-3xl">
            <DefenseEditor
              type={editingDefense.type}
              initialData={editingDefense}
              onSave={async (defense) => {
                try {
                  if ('leader' in defense) {
                    await FirebaseService.addOrUpdateSquad(defense as Squad);
                    setSquads(prev => prev.map(s => s.id === defense.id ? defense as Squad : s));
                  } else {
                    await FirebaseService.addOrUpdateFleet(defense as Fleet);
                    setFleets(prev => prev.map(f => f.id === defense.id ? defense as Fleet : f));
                  }
                  await loadData();
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
    </AdminLayout>
  );
};

export default AdminRoutes;