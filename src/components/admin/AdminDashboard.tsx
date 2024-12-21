import React, { useState, useEffect, useCallback } from 'react';
import { Database, LogOut, AlertTriangle, Users, Ship as ShipIcon, X, Settings, Plus, RefreshCw } from 'lucide-react';
import { Squad, Fleet, Counter, Character, Ship } from '@/types';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CounterEditor } from '../Counter/CounterEditor';
import { FirebaseService } from '@/services/firebaseService';
import { useFirebase } from '@/contexts/FirebaseContext';
import { useAuth } from '@/contexts/AuthContext';
import { NewDefenseModal } from './NewDefenseModal';
import { NotificationManager } from './NotificationManager';
import { SettingsPanel } from './SettingsPanel';
import { SyncButton } from './SyncButton';
import { SearchBar } from '@/components/SearchBar';
import { SquadEditor } from './SquadEditor';
import { FleetEditor } from './FleetEditor';
import ErrorBoundary from '../ErrorBoundary'; 

interface AdminDashboardProps {
  squads: Squad[];
  fleets: Fleet[];
  counters: Counter[];
  onUpdateSquad: (squad: Squad) => void;
  onDeleteSquad: (id: string) => void;
  onUpdateFleet: (fleet: Fleet) => void;
  onDeleteFleet: (id: string) => void;
  onAddCounter: (counter: Omit<Counter, "id">) => Promise<void>;
  onUpdateCounter: (counter: Counter) => void;
  onDeleteCounter: (id: string) => void;
  onLogout: () => void;
}

interface ErrorDisplayProps {
  error: string | null;
  onDismiss: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTitle>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Error</span>
          </div>
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </AlertTitle>
      <AlertDescription>
        {error}
      </AlertDescription>
    </Alert>
  );
};

interface AdminUser {
  username: string;
  password: string;
  isMasterAdmin?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  squads,
  fleets,
  counters,
  onUpdateSquad,
  onDeleteSquad,
  onUpdateFleet,
  onDeleteFleet,
  onAddCounter,
  onDeleteCounter,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState('squads');
  const [error, setError] = useState<string | null>(null);
  const [showCounterEditor, setShowCounterEditor] = useState(false);
  const [selectedDefense, setSelectedDefense] = useState<Squad | Fleet | null>(null);
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);
  const [availableShips, setAvailableShips] = useState<Ship[]>([]);
  const [existingCounter, setExistingCounter] = useState<Counter | null>(null);
  const [showNewDefenseModal, setShowNewDefenseModal] = useState(false);
  const { isOnline, error: firebaseError } = useFirebase();
  const { isAdmin, currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error';
    message: string;
  }>>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFleet, setIsFleet] = useState(false);

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const { characters, ships, capital_ships } = await import('@/data/initialData');
        console.log('Loading initial units:', {
          charactersCount: Object.keys(characters).length,
          shipsCount: Object.keys(ships).length,
          capitalShipsCount: Object.keys(capital_ships).length
        });
        
        const allCharacters = Object.values(characters);
        const allShips = [...Object.values(ships), ...Object.values(capital_ships)];
        
        setAvailableCharacters(allCharacters);
        setAvailableShips(allShips);

        console.log('Units loaded into state:', {
          charactersLoaded: allCharacters.length,
          shipsLoaded: allShips.length
        });
      } catch (error) {
        console.error('Failed to load units:', error);
        setError('Failed to load available units');
      }
    };
    
    loadUnits();
  }, []);

  const handleAddCounter = (defense: Squad | Fleet) => {
    const isFleet = !('leader' in defense);
    const units = isFleet ? availableShips : availableCharacters;
    
    console.log('Adding counter for:', {
      defenseType: isFleet ? 'Fleet' : 'Squad',
      defenseName: defense.name,
      availableUnits: units.length
    });
  
    setSelectedDefense(defense);
    setIsFleet(isFleet);  // Sätt isFleet baserat på defense typ
    setShowCounterEditor(true);
    setError(null);
  };

  const handleSaveCounter = async (counterData: Omit<Counter, 'id'>) => {
    if (!isOnline || !isAdmin || !currentUser) {
      setError('Not authorized or offline');
      return;
    }

    try {
      console.log('AdminDashboard: Saving counter data:', counterData);
      await onAddCounter(counterData);
      setShowCounterEditor(false);
      setSelectedDefense(null);
      setError(null);
    } catch (error) {
      console.error('Error saving counter:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save counter';
      setError(errorMessage);
    }
  };

  const handleDeleteCounter = async (counterId: string) => {
    try {
      console.log('AdminDashboard handling delete for counter:', counterId);
      await FirebaseService.deleteCounter(counterId);
      onDeleteCounter(counterId);
    } catch (error) {
      console.error('Error deleting counter:', error);
      setError('Failed to delete counter');
    }
  };

  const addNotification = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const handleSaveDefense = useCallback(async (defense: Squad | Fleet) => {
    // Denna funktion ska ENDAST anropas när användaren klickar på Save
    try {
      if (!isOnline) {
        setError('Cannot save while offline');
        return;
      }
  
      if (defense.type === 'squad') {
        await FirebaseService.addOrUpdateSquad(defense as Squad);
        onUpdateSquad(defense as Squad);
        addNotification('success', 'Squad saved successfully');
      } else {
        await FirebaseService.addOrUpdateFleet(defense as Fleet);
        onUpdateFleet(defense as Fleet);
        addNotification('success', 'Fleet saved successfully');
      }
  
      setError(null);
    } catch (error) {
      console.error('Error saving defense:', error);
      addNotification('error', 'Failed to save defense');
    }
  }, [isOnline, onUpdateSquad, onUpdateFleet]);

  const handleSaveSettings = async (settings: { users: AdminUser[] }) => {
    try {
      localStorage.setItem('adminUsers', JSON.stringify(settings.users));
      addNotification('success', 'Settings saved successfully');
      setShowSettings(false);
    } catch (error) {
      addNotification('error', 'Failed to save settings');
    }
  };

  const displayError = error || firebaseError;

  const handleEditCounter = async (counter: Counter) => {
    setSelectedDefense(counter.targetSquad);
    setShowCounterEditor(true);
    setExistingCounter(counter);
    setError(null);
  };

  const handleCloseModal = () => {
    setShowNewDefenseModal(false); // This hides the modal
    // Reset any other state if necessary
  };

  return (
    <div className="min-h-screen bg-space-darker">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Database className="w-6 h-6" />
            <span className="text-lg">Defense Manager</span>
          </h1>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNewDefenseModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 
                       text-white hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
              Add New Defense
            </button>
            <SyncButton />
            <div className="flex-1" />
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-blue-400/70 hover:text-blue-400 
                       hover:bg-blue-400/10 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg 
                       bg-red-500/20 text-red-400 hover:bg-red-500/30"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        <ErrorDisplay 
          error={displayError} 
          onDismiss={() => setError(null)} 
        />

        <ErrorBoundary 
          fallback={
            <div className="min-h-screen bg-space-darker flex items-center justify-center">
              <div className="p-6 bg-red-500/10 rounded-lg border border-red-500/20 max-w-md w-full">
                <h3 className="text-lg font-medium text-red-400 mb-2">
                  Admin Dashboard Error
                </h3>
                <p className="text-sm text-red-400/80 mb-4">
                  There was an error loading the admin dashboard. Please try logging in again.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={onLogout}
                    className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 
                             hover:bg-red-500/30"
                  >
                    Logout
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg 
                             bg-blue-500 text-white hover:bg-blue-600"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          }
        >
          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('squads')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                activeTab === 'squads' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/5 text-white/60'
              }`}
            >
              <Users className="w-4 h-4" />
              Squad Defense
            </button>
            <button
              onClick={() => setActiveTab('fleets')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                activeTab === 'fleets' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/5 text-white/60'
              }`}
            >
              <ShipIcon className="w-4 h-4" />
              Fleet Defense
            </button>
          </div>

          {/* Lägg till SearchBar under tabs */}
          <div className="mb-6">
            <div className="w-96">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                onClear={() => setSearchTerm('')}
                placeholder={`Search ${activeTab}...`}
              />
            </div>
          </div>

          {/* Content - uppdatera för att använda searchTerm */}
          <div className="space-y-6">
            {activeTab === 'squads' ? (
              <SquadEditor
                squads={squads.filter(squad => 
                  squad.name.toLowerCase().includes(searchTerm.toLowerCase())
                )}
                counters={counters.filter(c => 'leader' in c.targetSquad)}
                availableUnits={availableCharacters}
                onUpdate={onUpdateSquad}
                onDelete={onDeleteSquad}
                onAddCounter={handleAddCounter}
                onEditCounter={handleEditCounter}
                onDeleteCounter={handleDeleteCounter}
              />
            ) : (
              <FleetEditor
                fleets={fleets.filter(fleet => 
                  fleet.name.toLowerCase().includes(searchTerm.toLowerCase())
                )}
                counters={counters.filter(c => !('leader' in c.targetSquad))}
                availableUnits={availableShips}
                onUpdate={onUpdateFleet}
                onDelete={onDeleteFleet}
                onAddCounter={handleAddCounter}
                onEditCounter={handleEditCounter}
                onDeleteCounter={handleDeleteCounter}
              />
            )}
          </div>
        </ErrorBoundary>

        {/* Modals */}
        {showCounterEditor && selectedDefense && (
          <CounterEditor
            isOpen={showCounterEditor}
            onClose={() => {
              setShowCounterEditor(false);
              setSelectedDefense(null);
              setExistingCounter(null);
              setError(null);
            }}
            targetDefense={selectedDefense}
            onSave={handleSaveCounter}
            onDelete={handleDeleteCounter}
            availableUnits={'leader' in selectedDefense ? availableCharacters : availableShips}
            existingCounter={existingCounter}
            isFleet={isFleet}
          />
        )}

        {showNewDefenseModal && (
          <NewDefenseModal
            isOpen={showNewDefenseModal}
            onClose={handleCloseModal}
            onSave={handleSaveDefense}
            initialType={activeTab === 'squads' ? 'squad' : 'fleet'}
            availableUnits={activeTab === 'squads' ? availableCharacters : availableShips}
          />
        )}

        {/* Settings Panel */}
              {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings} // handleSaveSettings måste matcha den nya typen
        />
      )}


        {/* Notifications */}
        <NotificationManager
          notifications={notifications}
          onDismiss={(id) => 
            setNotifications(prev => prev.filter(n => n.id !== id))
          }
        />
      </div>
    </div>
  );
};

export default AdminDashboard;