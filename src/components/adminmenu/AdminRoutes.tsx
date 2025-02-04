import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { DefenseGrid } from './DefenseGrid';
import { FirebaseService } from '@/services/firebaseService';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SyncManager } from './SyncManager';
import { DataManager } from './DataManager';
import { SettingsManager } from './SettingsManager';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { Plus } from 'lucide-react';
import { DefenseEditor } from './DefenseEditor';
import { CounterEditor } from '@/components/Counter/CounterEditor';
import { characters, capital_ships, ships as regular_ships, ships } from '@/data/initialData';
import { Squad, Fleet, Counter, Character, Ship } from '@/types';


// Dashboard Component
const Dashboard: React.FC<{
  squads: Squad[];
  fleets: Fleet[];
  counters: Counter[]; 
  onEdit: (defense: Squad | Fleet) => Promise<void>;
  availableCharacters: Character[];  
  availableShips: Ship[];           
}> = ({ 
  squads, 
  fleets, 
  counters, 
  onEdit,
  availableCharacters,
  availableShips 
}) => {
    const [stats, setStats] = useState({
    totalSquads: 0,
    totalFleets: 0,
    totalCounters: 0,
    lightSideSquads: 0,
    darkSideSquads: 0,
    lightSideFleets: 0,
    darkSideFleets: 0
  });

  const [showEditor, setShowEditor] = useState(false);
  const [editorType, setEditorType] = useState<'squad' | 'fleet'>('squad');

  useEffect(() => {
    const fetchStats = async () => {

      setStats({
        totalSquads: squads.length,
        totalFleets: fleets.length,
        totalCounters: counters.length, 
        lightSideSquads: squads.filter(s => s.alignment === 'light').length,
        darkSideSquads: squads.filter(s => s.alignment === 'dark').length,
        lightSideFleets: fleets.filter(f => f.alignment === 'light').length,
        darkSideFleets: fleets.filter(f => f.alignment === 'dark').length
      });
    };

    fetchStats();
  }, [squads, fleets, counters]);

  const handleAddNew = (type: 'squad' | 'fleet') => {
    setEditorType(type);
    setShowEditor(true);
  };

  const chartData = [
    { name: 'Squads', Light: stats.lightSideSquads, Dark: stats.darkSideSquads },
    { name: 'Fleets', Light: stats.lightSideFleets, Dark: stats.darkSideFleets }
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-orbitron text-white">Dashboard Overview</h1>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => handleAddNew('squad')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 
                     text-white rounded-lg hover:bg-blue-600 transition-colors
                     w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Squad</span>
          </button>
          
          <button
            onClick={() => handleAddNew('fleet')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 
                     text-white rounded-lg hover:bg-blue-600 transition-colors
                     w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Fleet</span>
          </button>
        </div>
      </div>
      
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

      {showEditor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl">
            <DefenseEditor
              type={editorType}
              onSave={async (defense) => {
                await onEdit(defense);
                setShowEditor(false);
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

// Squad List Component
const SquadsList: React.FC<{
  squads: Squad[];
  availableUnits: (Character | Ship)[];
  onEdit: (defense: Squad | Fleet) => Promise<void>;
  onDelete: (defense: Squad | Fleet) => Promise<void>;
  onAddCounter: (defense: Squad | Fleet) => void;
  onEditCounter: (counter: Counter) => void;
  onDeleteCounter: (counterId: string) => Promise<void>;
}> = ({ 
  squads, 
  availableUnits,
  onEdit, 
  onDelete, 
  onAddCounter, 
  onEditCounter,
  onDeleteCounter 
}) => {
  const [showEditor, setShowEditor] = useState(false);
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-orbitron text-white">Squad Management</h1>
        <button
          onClick={() => setShowEditor(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" />
          New Squad
        </button>
      </div>
      <DefenseGrid
        items={squads}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddCounter={onAddCounter}
        onEditCounter={onEditCounter}
        onDeleteCounter={onDeleteCounter}
        isAdmin={true}
      />
      
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl">
            <DefenseEditor
              type="squad"
              onSave={async (defense) => {
                await onEdit(defense);
                setShowEditor(false);
              }}
              onCancel={() => setShowEditor(false)}
              availableUnits={availableUnits}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Fleet List Component
const FleetsList: React.FC<{
  fleets: Fleet[];
  availableUnits: (Character | Ship)[];
  onEdit: (defense: Squad | Fleet) => Promise<void>;
  onDelete: (defense: Squad | Fleet) => Promise<void>;
  onAddCounter: (defense: Squad | Fleet) => void;
  onEditCounter: (counter: Counter) => void;
  onDeleteCounter: (counterId: string) => Promise<void>;
}> = ({ 
  fleets, 
  availableUnits,
  onEdit, 
  onDelete, 
  onAddCounter, 
  onEditCounter,
  onDeleteCounter 
}) => {
  const [showEditor, setShowEditor] = useState(false);
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-orbitron text-white">Fleet Management</h1>
        <button
          onClick={() => setShowEditor(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" />
          New Fleet
        </button>
      </div>
      <DefenseGrid
        items={fleets}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddCounter={onAddCounter}
        onEditCounter={onEditCounter}
        onDeleteCounter={onDeleteCounter}
        isAdmin={true}
      />
      
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl">
            <DefenseEditor
              type="fleet"
              onSave={async (defense) => {
                await onEdit(defense);
                setShowEditor(false);
              }}
              onCancel={() => setShowEditor(false)}
              availableUnits={availableUnits}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Main Admin Routes Component
export const AdminRoutes: React.FC = () => {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);
  const [availableShips, setAvailableShips] = useState<Ship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDefense, setSelectedDefense] = useState<Squad | Fleet | null>(null);
  const [showCounterEditor, setShowCounterEditor] = useState(false);
  const [counters, setCounters] = useState<Counter[]>([]);

  // Load data and available units
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        console.log('Starting data load...');
        
        // Hämta data från Firebase
        const [loadedSquads, loadedFleets, loadedCounters] = await Promise.all([
          FirebaseService.getSquads(),
          FirebaseService.getFleets(),
          FirebaseService.getCounters()
          
        ]);
    
        setSquads(loadedSquads);
        setFleets(loadedFleets);
        setCounters(loadedCounters);
    
        // find available units from initial data
        const availableChars = Object.values(characters);
        const availableShips = Object.values(ships);
    
        const allShips = [
          ...Object.values(capital_ships),
          ...Object.values(regular_ships)
        ];
    
        console.log('Ships loaded:', {
          total: allShips.length,
          capitalShips: Object.values(capital_ships).length,
          regularShips: Object.values(regular_ships).length,
          example: {
            capital: Object.values(capital_ships)[0],
            regular: Object.values(regular_ships)[0]
          }
        });
    
        setAvailableShips(allShips as Ship[]);
        setAvailableCharacters(Object.values(characters) as Character[]);
    
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleEditCounter = async (counter: Counter) => {
    try {
      setSelectedDefense(counter.targetSquad);
      setShowCounterEditor(true);
    } catch (error) {
      console.error('Error in handleEditCounter:', error);
    }
  };

  const handleEdit = async (defense: Squad | Fleet) => {
    try {
      if ('leader' in defense) {
        await FirebaseService.addOrUpdateSquad(defense);
        setSquads(prev => prev.map(s => s.id === defense.id ? defense as Squad : s));
      } else {
        await FirebaseService.addOrUpdateFleet(defense);
        setFleets(prev => prev.map(f => f.id === defense.id ? defense as Fleet : f));
      }
    } catch (error) {
      console.error('Error updating defense:', error);
    }
  };

  const handleDelete = async (defense: Squad | Fleet) => {
    try {
      if ('leader' in defense) {
        await FirebaseService.deleteSquad(defense.id);
        setSquads(prev => prev.filter(s => s.id !== defense.id));
      } else {
        await FirebaseService.deleteFleet(defense.id);
        setFleets(prev => prev.filter(f => f.id !== defense.id));
      }
    } catch (error) {
      console.error('Error deleting defense:', error);
    }
  };

  const handleAddCounter = (defense: Squad | Fleet) => {
    setSelectedDefense(defense);
    setShowCounterEditor(true);
  };

  const handleDeleteCounter = async (counterId: string) => {
    try {
      await FirebaseService.deleteCounter(counterId);
    } catch (error) {
      console.error('Error deleting counter:', error);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingIndicator size="lg" message="Loading data..." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Routes>
        <Route 
          path="/" 
          element={
            <Dashboard 
            squads={squads}
            fleets={fleets}
            counters={counters}
            onEdit={handleEdit}
            availableCharacters={availableCharacters}
            availableShips={availableShips}
            />
          } 
        />
        <Route 
          path="/squads" 
          element={
            <SquadsList 
              squads={squads}
              availableUnits={availableCharacters}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddCounter={handleAddCounter}
              onEditCounter={handleEditCounter}
              onDeleteCounter={handleDeleteCounter}
            />
          } 
        />
        <Route 
          path="/fleets" 
          element={
            <FleetsList 
              fleets={fleets}
              availableUnits={availableShips}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddCounter={handleAddCounter}
              onEditCounter={handleEditCounter}
              onDeleteCounter={handleDeleteCounter}
            />
          } 
        />
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
              onSave={async (counter) => {
                try {
                  await FirebaseService.addOrUpdateCounter(counter);
                  setShowCounterEditor(false);
                  setSelectedDefense(null);
                } catch (error) {
                  console.error('Error saving counter:', error);
                }
              }}
              onCancel={() => {
                setShowCounterEditor(false);
                setSelectedDefense(null);
              }}
              availableUnits={
                'leader' in selectedDefense ? availableCharacters : availableShips
              }
            />
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminRoutes;