import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Squad, Fleet, Counter, Filters, FilterKey } from '@/types';
import { Header } from '@/components/Header';
import { SearchPanel } from '@/components/SearchPanel';
import { SquadList } from '@/components/SquadList';
import { FleetList } from '@/components/FleetList';
import { FiltersMenu } from '@/components/filters/FiltersMenu';
import { motion, AnimatePresence } from 'framer-motion';
import { HeroSection } from '@/components/layouts/HeroSection';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { FirebaseService } from '@/services/firebaseService'; 
import { CounterProvider } from '@/contexts/CounterContext';
import { FirebaseProvider, useFirebase } from '@/contexts/FirebaseContext';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SearchBar } from '@/components/SearchBar';
import ErrorBoundary from './components/ErrorBoundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ensureFirebaseInitialized } from '@/lib/firebase';
import { HelmetProvider } from 'react-helmet-async';
import { Layout } from '@/components/layouts/Layout';

const AdminDashboard = lazy(() => 
  import('@/components/admin/AdminDashboard').then(module => ({
    default: module.AdminDashboard
  }))
);

const Auth = lazy(() => 
  import('@/components/Auth').then(module => ({
    default: module.Auth
  }))
);

// I App.tsx
const App: React.FC = () => {
  const currentView = 'Squads';

  return (
    <HelmetProvider>
      <ErrorBoundary 
        fallback={
          <div className="min-h-screen bg-space-darker flex items-center justify-center">
            <div className="p-6 bg-red-500/10 rounded-lg border border-red-500/20 max-w-md w-full text-center">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-red-400 mb-2">
                Application Error
              </h3>
              <p className="text-sm text-red-400/80 mb-6">
                We apologize, but something went wrong with the application. 
                Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-6 py-3 rounded-lg 
                         bg-red-500/20 text-red-400 hover:bg-red-500/30 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>
            </div>
          </div>
        }
      >
        <FirebaseProvider>
          <AuthProvider>
            <ThemeProvider>
              <CounterProvider>
                <ErrorBoundary
                  fallback={
                    <div className="min-h-screen flex items-center justify-center bg-space-black p-4">
                      <div className="text-white text-center">
                        <h1 className="text-xl mb-4">Something went wrong</h1>
                        <button 
                          onClick={() => window.location.reload()}
                          className="px-4 py-2 bg-blue-500 rounded-lg"
                        >
                          Reload app
                        </button>
                      </div>
                    </div>
                  }
                >
                  <AppContent />
                </ErrorBoundary>
              </CounterProvider>
            </ThemeProvider>
          </AuthProvider>
        </FirebaseProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

function filterUnits(units: Squad[] | Fleet[], filters: Filters): (Squad | Fleet)[] {
  if (!Array.isArray(units)) return [];
  
  return units.filter(unit => {
    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const nameMatch = unit.name.toLowerCase().includes(searchLower);
      
      if ('characters' in unit) {
        // For squads, search in character names
        const characterMatch = unit.characters.some(char => 
          char.name.toLowerCase().includes(searchLower)
        );
        const leaderMatch = unit.leader && unit.leader.name.toLowerCase().includes(searchLower);
        
        if (!nameMatch && !characterMatch && !leaderMatch) return false;
      } else if ('capitalShip' in unit) {
        // For fleets, search in ship names
        const shipMatch = unit.startingLineup.some(ship => 
          ship.name.toLowerCase().includes(searchLower)
        ) || (unit.capitalShip && unit.capitalShip.name.toLowerCase().includes(searchLower));
        
        if (!nameMatch && !shipMatch) return false;
      } else if (!nameMatch) {
        return false;
      }
    }

    // Alignment filter
    if (filters.alignment && unit.alignment !== filters.alignment) {
      return false;
    }

    // TW Omicron filter
    if (filters.showTWOmicronOnly && 'twOmicronRequired' in unit && !unit.twOmicronRequired) {
      return false;
    }

    return true;
  });
}

function AppContent() {
  const [error, setError] = useState<string | null>(null);
  const { isOnline, isLoading: firebaseLoading } = useFirebase();
  const { isAdmin, loading: authLoading, logout } = useAuth();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [activeView, setActiveView] = useState<'squads' | 'fleets'>('squads');
  const [squads, setSquads] = useState<Squad[]>([]);
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    battleType: null,
    alignment: null,
    showTWOmicronOnly: false,
    showHardCounters: false,
    excludeGL: false,
    searchTerm: ''
  });

  // Load initial data
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Vänta på Firebase-initialisering
        await ensureFirebaseInitialized();
        
        // Hämta all data parallellt
        const { squads, fleets, counters } = await FirebaseService.syncAllData();
        
        setSquads(squads);
        setFleets(fleets);
        setCounters(counters);
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setError('Failed to load application data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Filter the units based on current filters
  const filteredSquads = activeView === 'squads' ? filterUnits(squads, filters) as Squad[] : [];
  const filteredFleets = activeView === 'fleets' ? filterUnits(fleets, filters) as Fleet[] : [];

  // Get counters for a specific unit
  const getCountersForUnit = useCallback((unitId: string, type: 'squad' | 'fleet'): Counter[] => {
    if (!counters || !unitId) return [];
    
    return counters.filter(counter => {
      if (type === 'squad') {
        const isTargetSquad = counter?.targetSquad?.id === unitId;
        const isCounterSquad = counter?.counterSquad?.id === unitId;
        return isTargetSquad || isCounterSquad;
      } else {
        const isTargetFleet = counter?.targetSquad?.id === unitId;
        const isCounterFleet = counter?.counterSquad?.id === unitId;
        const isTargetCapitalShip = 'capitalShip' in counter.targetSquad && 
          counter.targetSquad.capitalShip?.id === unitId;
        
        return isTargetFleet || isCounterFleet || isTargetCapitalShip;
      }
    });
  }, [counters]);

  // Save data when it changes
  useEffect(() => {
    if (!isLoading && hasUnsavedChanges) {
      const saveData = async () => {
        try {
          await Promise.all([
            ...squads.map(squad => FirebaseService.addOrUpdateSquad(squad)),
            ...fleets.map(fleet => FirebaseService.addOrUpdateFleet(fleet)),
            ...counters.map(counter => FirebaseService.addOrUpdateCounter(counter))
          ]);
          
          setHasUnsavedChanges(false);
        } catch (error) {
          console.error('Error saving data:', error);
        }
      };

      saveData();
    }
  }, [squads, fleets, counters, isLoading, hasUnsavedChanges]);

  // Handle unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Admin handlers
  const handleAdminLogin = () => {
    setShowAdminLogin(false);
  };

  const handleAdminLogout = async () => {
    try {
      if (hasUnsavedChanges) {
        const confirmLogout = window.confirm('Du har osparade ändringar. Vill du verkligen logga ut?');
        if (!confirmLogout) return;
      }
      await logout();
      setShowAdminLogin(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Filter handlers
  const handleFilterChange = (key: FilterKey, value: Filters[FilterKey]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setSelectedId(null);
  };

  // Search handler
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setFilters(prev => ({
      ...prev,
      searchTerm: value
    }));
  };

  const handleSuggestionSelect = (item: Squad | Fleet) => {
    setSelectedId(item.id);
    // VIKTIGT: Gör INTE setSearchTerm('') här
    // Behåll searchTerm och filters oförändrade
  };

  const handleDeleteCounter = async (counterId: string) => {
    if (!isOnline) {
      setError('Cannot delete counter while offline');
      return;
    }
  
    try {
      console.log('Starting delete counter process for:', counterId);
      await FirebaseService.deleteCounter(counterId);
      
      // Update local state regardless of whether the counter existed in Firebase
      setCounters(prevCounters => prevCounters.filter(c => c.id !== counterId));
      console.log('Counter removed from local state');
      
      // Clear any existing error
      setError(null);
    } catch (error) {
      console.error('Error deleting counter:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete counter';
      // Don't set error state if counter was already deleted
      if (errorMessage !== 'Counter not found') {
        setError(errorMessage);
      }
    }
  };

  const adminHandlers = {
    onUpdateSquad: async (squad: Squad) => {
      try {
        await FirebaseService.addOrUpdateSquad(squad);
        setSquads(prev => {
          const index = prev.findIndex(s => s.id === squad.id);
          if (index >= 0) {
            const newSquads = [...prev];
            newSquads[index] = squad;
            return newSquads;
          }
          return [...prev, squad];
        });
      } catch (error) {
        console.error('Error updating squad:', error);
      }
    },


    onDeleteSquad: async (id: string) => {
      if (!isOnline) {
        setError('Cannot delete while offline');
        return;
      }
  
      try {
        // Först ta bort alla relaterade counters
        const relatedCounters = counters.filter(c => 
          (c?.targetSquad?.id === id || c?.counterSquad?.id === id) && c?.id
        );
        
        // Ta bort counters först
        await Promise.all(
          relatedCounters.map(counter => 
            FirebaseService.deleteCounter(counter.id)
          )
        );
  
        // Sedan ta bort squad
        await FirebaseService.deleteSquad(id);
  
        // Uppdatera local state
        setCounters(prev => 
          prev.filter(c => 
            c?.targetSquad?.id !== id && c?.counterSquad?.id !== id
          )
        );
        setSquads(prev => prev.filter(s => s.id !== id));
        
      } catch (error) {
        console.error('Error deleting squad:', error);
        setError('Failed to delete squad and its counters');
      }
    },

    onUpdateFleet: async (fleet: Fleet) => {
      try {
        await FirebaseService.addOrUpdateFleet(fleet);
        setFleets(prev => {
          const index = prev.findIndex(f => f.id === fleet.id);
          if (index >= 0) {
            const newFleets = [...prev];
            newFleets[index] = fleet;
            return newFleets;
          }
          return [...prev, fleet];
        });
      } catch (error) {
        console.error('Error updating fleet:', error);
      }
    },

    onDeleteFleet: async (id: string) => {
      if (!isOnline) {
        setError('Cannot delete while offline');
        return;
      }
  
      try {
        // Först ta bort alla relaterade counters
        const relatedCounters = counters.filter(c => 
          (c?.targetSquad?.id === id || 
           c?.counterSquad?.id === id || 
           (c?.targetSquad && 'capitalShip' in c.targetSquad && c.targetSquad.capitalShip?.id === id)) && 
           c?.id
        );
        
        // Ta bort counters först
        await Promise.all(
          relatedCounters.map(counter => 
            FirebaseService.deleteCounter(counter.id)
          )
        );
  
        // Sedan ta bort fleet
        await FirebaseService.deleteFleet(id);
  
        // Uppdatera local state
        setCounters(prev => 
          prev.filter(c => 
            c?.targetSquad?.id !== id && 
            c?.counterSquad?.id !== id &&
            !('capitalShip' in c?.targetSquad && c.targetSquad.capitalShip?.id === id)
          )
        );
        setFleets(prev => prev.filter(f => f.id !== id));
        
      } catch (error) {
        console.error('Error deleting fleet:', error);
        setError('Failed to delete fleet and its counters');
      }
    },

    onAddCounter: async (counter: Omit<Counter, "id">) => {
      try {
        const newCounter: Counter = {
          ...counter,
          id: `counter-${Date.now()}`
        };
        // Save to Firebase first
        const savedCounter = await FirebaseService.addOrUpdateCounter(newCounter);
        // Update local state with the saved version
        setCounters(prevCounters => prevCounters.filter(c => c.id !== savedCounter.id).concat(savedCounter));
      } catch (error) {
        console.error('Error adding counter:', error);
      }
    },

    onDeleteCounter: async (counterId: string) => {
      if (!isOnline) {
        setError('Cannot delete counter while offline');
        return;
      }

      try {
        console.log('Starting delete counter process for:', counterId);
        await FirebaseService.deleteCounter(counterId);
        
        // Uppdatera lokalt state efter lyckad borttagning
        setCounters(prevCounters => prevCounters.filter(c => c.id !== counterId));
        console.log('Counter deleted and state updated');
      } catch (error) {
        console.error('Error deleting counter:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete counter';
        setError(errorMessage);
      }
    },

    onUpdateCounter: async (counter: Counter) => {
      try {
        await FirebaseService.addOrUpdateCounter(counter);
        setCounters(prev => {
          const index = prev.findIndex(c => c.id === counter.id);
          if (index >= 0) {
            const newCounters = [...prev];
            newCounters[index] = counter;
            return newCounters;
          }
          return prev;
        });
      } catch (error) {
        console.error('Error updating counter:', error);
      }
    },
  };

// Combined loading state
// I App.tsx
// Under combined loading state
if (firebaseLoading || authLoading || isLoading) {
  return (
    <div className="min-h-screen bg-space-black flex items-center justify-center">
      <LoadingIndicator 
        size="lg"
        message="Loading application data..."
      />
    </div>
  );
}

  // Error handling
  if (error) {
    return (
      <div className="min-h-screen bg-space-black flex items-center justify-center">
        <div className="p-6 bg-red-500/10 rounded-lg border border-red-500/20 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-red-400 mb-2">
            Application Error
          </h3>
          <p className="text-sm text-red-400/80 mb-6">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 rounded-lg 
                     bg-red-500/20 text-red-400 hover:bg-red-500/30 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout
      isAdmin={isAdmin}
      onLogout={handleAdminLogout}
      onAdminClick={() => setShowAdminLogin(true)}
    >
      <div className="min-h-screen bg-space-black text-white">
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 bg-yellow-500/90 text-black py-2 px-4 text-center z-50">
            Du är offline. Ändringar kommer att synkroniseras när du återansluter.
          </div>
        )}
        <div className="min-h-screen bg-space-gradient bg-fixed">
          <AnimatePresence mode="wait">
            {!isAdmin ? (
              <motion.div
                key="user-interface"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <HeroSection>
                  <SearchPanel
                    activeView={activeView}
                    onViewChange={setActiveView}
                    onOptionsClick={() => setFiltersOpen(true)}
                    filters={filters}
                  >
                    <SearchBar
                      value={searchTerm}
                      onChange={handleSearchChange}
                      onClear={() => {
                        handleSearchChange('');
                        setSelectedId(null); // Återställ vald post när sökningen rensas
                      }}
                      suggestions={activeView === 'squads' ? filteredSquads : filteredFleets}
                      onSelectSuggestion={(item) => {
                        handleSuggestionSelect(item);
                        // Behåll söktermen och filtreringen
                        setSearchTerm(searchTerm);
                      }}
                      placeholder={`Search ${activeView === 'squads' ? 'teams' : 'fleets'}...`}
                    />
                  </SearchPanel>
                </HeroSection>
                <main className="container mx-auto px-4 py-8">
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex justify-center items-center min-h-[400px]"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-12 h-12 border-4 border-saber-blue-400/50 border-t-saber-blue-400 rounded-full"
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`content-${activeView}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {activeView === 'squads' ? (
                          <SquadList
                            squads={squads}
                            filteredSquads={filteredSquads}
                            selectedSquadId={selectedId}
                            onSelectSquad={setSelectedId}
                            getCounters={(id) => getCountersForUnit(id, 'squad')}
                            isAdmin={isAdmin}
                            onDeleteCounter={handleDeleteCounter}
                            onViewDetails={() => {}}
                          />
                        ) : (
                          <FleetList
                            fleets={fleets}
                            filteredFleets={filteredFleets}
                            selectedFleetId={selectedId}
                            onSelectFleet={setSelectedId}
                            getCounters={(id) => getCountersForUnit(id, 'fleet')}
                            isAdmin={isAdmin}
                            onDeleteCounter={handleDeleteCounter}
                            onViewDetails={() => {}}
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </main>

                <FiltersMenu
                  isOpen={isFiltersOpen}
                  onClose={() => setFiltersOpen(false)}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                />
              </motion.div>
            ) : (
              <Suspense fallback={
                <div className="min-h-screen bg-space-darker flex items-center justify-center">
                  <LoadingIndicator size="lg" message="Loading admin dashboard..." />
                </div>
              }>
                <AdminDashboard
                  squads={squads}
                  fleets={fleets}
                  counters={counters}
                  {...adminHandlers}
                  onLogout={handleAdminLogout}
                />
              </Suspense>
            )}
          </AnimatePresence>

          {showAdminLogin && (
            <Suspense fallback={
              <div className="fixed inset-0 bg-space-darker/80 flex items-center justify-center">
                <LoadingIndicator size="md" message="Loading..." />
              </div>
            }>
              <Auth
                onLogin={handleAdminLogin}
                onClose={() => setShowAdminLogin(false)}
              />
            </Suspense>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default App;