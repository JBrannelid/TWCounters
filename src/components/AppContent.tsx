import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async'; // Importera Helmet
import { Squad, Fleet, Counter, Filters, FilterKey } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { HeroSection } from '@/components/layouts/HeroSection';
import { SearchPanel } from '@/components/SearchPanel';
import { SearchBar } from '@/components/SearchBar';
import { SquadList } from '@/components/SquadList';
import { FleetList } from '@/components/FleetList';
import { FiltersMenu } from '@/components/filters/FiltersMenu';
import { Layout } from '@/components/layouts/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useFirebase } from '@/contexts/FirebaseContext';
import { FirebaseService } from '@/services/firebaseService';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { CookieConsent } from '@/components/CookieConsent';
import { CookieConsentData } from '@/components/CookieConsent/CookieConsentTypes';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ensureFirebaseInitialized } from '@/lib/firebase';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useNavigate } from 'react-router-dom';
import { AnalyticsService } from '@/services/analyticsService';
import { CookieScanService } from '@/services/CookieScanService';
import { filterCounters } from './Utils/counterUtils';
import { characters, ships } from '@/data/initialData';

const AdminDashboards = lazy(() => 
    import('@/components/adminmenu/AdminDashboards').then(module => ({
      default: module.AdminDashboards
    }))
  );
  
  const Auth = lazy(() => 
    import('@/components/Auth').then(module => ({
      default: module.Auth
    }))
  );
  
  const CookiePolicyPage = lazy(() => 
    import('@/components/CookieConsent/CookiePolicy').then(module => ({
      default: module.CookiePolicy
    }))
  );

  function filterUnits(units: Squad[] | Fleet[], filters: Filters): (Squad | Fleet)[] {
    if (!Array.isArray(units)) return [];
      
    return units.filter(unit => {
      // Search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const nameMatch = unit.name.toLowerCase().includes(searchLower);
        
        if ('characters' in unit) {
          // for squads, search in character names and leader name
          const characterMatch = unit.characters.some(char => 
            char.name.toLowerCase().includes(searchLower)
          );
          const leaderMatch = unit.leader && unit.leader.name.toLowerCase().includes(searchLower);
          
          if (!nameMatch && !characterMatch && !leaderMatch) return false;
        } else if ('capitalShip' in unit) {
          // for fleets, search in ship names and capital ship name
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

  export const AppContent: React.FC = () => {
    const { logUserAction } = useAnalytics();
    const [performanceLogged, setPerformanceLogged] = useState(false);
    const { isOnline, isLoading: firebaseLoading } = useFirebase();
    const { isAdmin, loading: authLoading, logout } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [activeView, setActiveView] = useState<'squads' | 'fleets'>('squads');
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [squads, setSquads] = useState<Squad[]>([]);
    const [fleets, setFleets] = useState<Fleet[]>([]);
    const [counters, setCounters] = useState<Counter[]>([]);
    const [selectedDefense, setSelectedDefense] = useState<Squad | Fleet | null>(null);
    const [showCounterEditor, setShowCounterEditor] = useState(false);
    const [editingCounter, setEditingCounter] = useState<Counter | null>(null);  
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const navigate = useNavigate();

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
      
    // Load coockie banner
    useEffect(() => {
    const hasConsent = localStorage.getItem('cookie_consent_state');
    if (!hasConsent) {
        // force show cookie banner if no consent has been given 
        const cookieBanner = document.querySelector('[data-cookiebanner]');
        if (cookieBanner) {
        (cookieBanner as HTMLElement).style.display = 'block';
        }
    }
    }, []);

    const handleCookiePolicyClick = (e: React.MouseEvent) => {
        e.preventDefault();
        navigate('/cookie-policy');
      };
    
    // Load initial data
    useEffect(() => {
      const initializeApp = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
          // await firebase initialization before proceeding
          await ensureFirebaseInitialized();
          
          // collect all data from Firebase and update state
          const { squads = [], fleets = [], counters = [] } = await FirebaseService.syncAllData();
          
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
        
      // Dynamic title and meta information via Helmet 
      const getTitle = () => {
        if (activeView === 'squads') {
          return "Best SWGOH Squads for Territory Wars";
        } else if (activeView === 'fleets') {
          return "Best SWGOH Fleets for Territory Wars";
        }
        return "SWGOH Territory Wars Counter Tool";
      };

      const getDescription = () => {
        if (activeView === 'squads') {
          return "Explore the best squad compositions to counter teams in SWGOH Territory Wars.";
        } else if (activeView === 'fleets') {
          return "Explore the best fleet compositions to counter teams in SWGOH Territory Wars.";
        }
        return "Find the best counter teams for SWGOH Territory Wars and enhance your strategy with our tool.";
      };
      // Check if we're on the cookie policy page
      const isCookiePolicyPage = window.location.pathname === '/cookie-policy';
  
      if (isCookiePolicyPage) {
        return (
          <Suspense fallback={
            <div className="min-h-screen bg-space-darker flex items-center justify-center">
              <LoadingIndicator size="lg" message="Loading..." />
            </div>
          }>
            <CookiePolicyPage />
          </Suspense>
        );
      }

      const getAvailableUnits = useCallback(() => {
        const squadUnits = squads.flatMap(squad => [
          squad.leader,
          ...squad.characters
        ].filter(Boolean));
      
        const fleetUnits = fleets.flatMap(fleet => [
          fleet.capitalShip,
          ...fleet.startingLineup,
          ...fleet.reinforcements
        ].filter(Boolean));
      
        return activeView === 'squads' ? squadUnits : fleetUnits;
      }, [squads, fleets, activeView]);
    
      useEffect(() => {
        try {
          // measure load time for the page for performance tracking, google analytics etc.
          const loadTime = window.performance.now();
          
          // log page view and performance data
          const analytics = AnalyticsService.getInstance();
          analytics.logPageView('Home Page');
          analytics.logAppPerformance(loadTime);
          
          // log user interaction for page mount with analytics 
          analytics.logUserInteraction('app_content_mounted');
          
          return () => {
            // log user interaction for page unmount with analytics
            analytics.logUserInteraction('app_content_unmounted');
          };
        } catch (error) {
          console.error('Analytics error:', error);
        }
      }, []);

      useEffect(() => {
        try {
          const analytics = AnalyticsService.getInstance();
          
          // track visitor info
          analytics.logVisitorInfo();
          
          // log session data for tracking user session duration 
          analytics.logSessionData();
    
          // log performance metrics and resource timings and prevent multiple logs
          if (!performanceLogged) {
            window.addEventListener('load', () => {
              // await for the load event to ensure all resources are loaded
              setTimeout(() => {
                analytics.logPerformanceMetrics();
                analytics.logResourceMetrics();
                setPerformanceLogged(true);
              }, 0);
            });
          }
    
          // interval to log user engagement every 60 seconds
          const engagementInterval = setInterval(() => {
            analytics.logUserInteraction('user_engagement', {
              time_spent: Math.floor((Date.now() - performance.timeOrigin) / 1000)
            });
          }, 60000); // every 60 seconds
    
          return () => {
            clearInterval(engagementInterval); // clear interval on unmount
          };
        } catch (error) {
          console.error('Analytics error:', error);
        }
      }, [performanceLogged]); // only run once on mount
      
      useEffect(() => {
        if (process.env.NODE_ENV === 'production') {
          try {
            // await for firebase initialization before proceeding with analytics
            const loadAnalytics = async () => {
              await ensureFirebaseInitialized();
              const analytics = AnalyticsService.getInstance();
              analytics.logPageView('Home Page');
              analytics.logAppPerformance(window.performance.now());
            };
            
            loadAnalytics().catch(error => {
              console.warn('Analytics failed:', error);
            });
          } catch (error) {
            console.warn('Analytics disabled:', error);
          }
        }
      }, []);
      
      // Seperate effect for cookie scanning service for development
      useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
          const scanningEnabled = true; // enable cookie scanning in development
          if (scanningEnabled) {
            try {
              const cleanup = CookieScanService.startPeriodicScanning();
              return () => {
                if (cleanup) cleanup();
                CookieScanService.stopScanning();
              };
            } catch (error) {
              console.warn('Cookie scanning disabled:', error);
            }
          }
        }
      }, []);

    // Filter the units based on current filters
    const filteredSquads = activeView === 'squads' ? filterUnits(squads, filters) as Squad[] : [];
    const filteredFleets = activeView === 'fleets' ? filterUnits(fleets, filters) as Fleet[] : [];
  
    // Get counters for a specific unit
    const getCounters = useCallback((defenseId: string, type: 'squad' | 'fleet'): Counter[] => {
      if (!counters || !Array.isArray(counters) || !defenseId) {
        return [];
      }
    
      const relevantCounters = counters.filter(counter => {
        if (!counter || !counter.targetSquad || !counter.counterSquad) {
          return false;
        }
    
        const isTargetDefense = counter.targetSquad?.id === defenseId;
        const isCounterDefense = counter.counterSquad?.id === defenseId;
        const isTargetCapitalShip = type === 'fleet' && 
          'capitalShip' in counter.targetSquad && 
          counter.targetSquad.capitalShip?.id === defenseId;
    
        return isTargetDefense || isCounterDefense || isTargetCapitalShip;
      });
    
      // filter counters based on current filters
      return filterCounters(relevantCounters, filters);
    }, [counters, filters]);
    
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
  
  
    const onAdminClick = () => {
      setShowAdminLogin(true);
    };
  
    // Cookie consent handlers
    const handleCookieAccept = useCallback((consent: CookieConsentData) => {
      if (consent.analytics) {
        logUserAction('cookie_consent_given', {
          consent_type: 'accept',
          preferences_enabled: consent.preferences,
          analytics_enabled: consent.analytics,
          marketing_enabled: consent.marketing
        });
      }
    }, [logUserAction]);
  
    const handleCookieDecline = useCallback(() => {
      logUserAction('cookie_consent_given', {
        consent_type: 'decline'
      });
    }, [logUserAction]);
  
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
    };

// Counter handlers for user interface that will be passed down to child components 
const handleEditCounter = async (counter: Counter) => {
  console.log('AppContent handleEditCounter called with:', counter);
  if (!isOnline) {
    setError('Cannot edit counter while offline');
    return;
  }

  try {
    setIsLoading(true);
    console.log('Opening counter editor for:', counter);
    setEditingCounter(counter);
    setSelectedDefense(counter.targetSquad);
    setShowCounterEditor(true);
  } catch (error) {
    console.error('Error editing counter:', error);
    setError(error instanceof Error ? error.message : 'Failed to edit counter');
  } finally {
    setIsLoading(false);
  }
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
      availableCharacters: Object.values(characters),
      availableShips: Object.values(ships),
      isLoading: false,
  
      onDeleteSquad: async (id: string) => {
        if (!isOnline) {
          setError('Cannot delete while offline');
          return;
        }
    
        try {
          const relatedCounters = counters.filter(c => 
            (c?.targetSquad?.id === id || c?.counterSquad?.id === id) && c?.id
          );
          
          await Promise.all(
            relatedCounters.map(counter => 
              FirebaseService.deleteCounter(counter.id)
            )
          );
    
          await FirebaseService.deleteSquad(id);
    
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
          const relatedCounters = counters.filter(c => 
            (c?.targetSquad?.id === id || 
             c?.counterSquad?.id === id || 
             (c?.targetSquad && 'capitalShip' in c.targetSquad && c.targetSquad.capitalShip?.id === id)) && 
             c?.id
          );
          
          await Promise.all(
            relatedCounters.map(counter => 
              FirebaseService.deleteCounter(counter.id)
            )
          );
    
          await FirebaseService.deleteFleet(id);
    
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
  
    function getCountersForUnit(id: string, arg1: string): Counter[] {
      throw new Error('Function not implemented.');
    }

    return (
        <Layout isAdmin={isAdmin} onLogout={handleAdminLogout} onAdminClick={onAdminClick}>
        <CookieConsent 
          onAccept={handleCookieAccept}
          onDecline={handleCookieDecline}
        />
        <div className="min-h-screen bg-space-black text-white">
          {!isOnline && (
            <div className="fixed top-0 left-0 right-0 bg-yellow-500/90 text-black py-2 px-4 text-center z-50">
              You are offline. Changes will be synchronized when you reconnect.
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
                 {/* Dynamic title by react helmet */}
                <Helmet>
                  <title>{getTitle()}</title>
                  <meta name="description" content={getDescription()} />
                  <meta name="keywords" content="SWGOH, Territory Wars, Counter Tool, squads, fleets" />
                </Helmet>
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
                          setSelectedId(null); 
                        }}
                        suggestions={activeView === 'squads' ? filteredSquads : filteredFleets}
                        onSelectSuggestion={(item) => {
                          handleSuggestionSelect(item);
                          // ceep the search term in the input field
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
                            getCounters={getCounters}
                            isAdmin={isAdmin}
                            onDeleteCounter={handleDeleteCounter}
                            onEditCounter={handleEditCounter}
                            filters={filters}
                          />
                        ) : (
                          <FleetList
                            fleets={fleets}
                            filteredFleets={filteredFleets}
                            selectedFleetId={selectedId}
                            onSelectFleet={setSelectedId}
                            getCounters={getCounters}
                            isAdmin={isAdmin}
                            onDeleteCounter={handleDeleteCounter}
                            onEditCounter={handleEditCounter}
                            filters={filters}
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
              <ErrorBoundary fallback={
                <div className="min-h-screen flex items-center justify-center bg-red-500/10 p-4">
                  <div className="text-red-400 text-center">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                    <h1 className="text-xl mb-4">Failed to load admin dashboard</h1>
                    <button 
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-red-500/20 rounded-lg"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              }>
              <AdminDashboards
                squads={squads}
                fleets={fleets}
                counters={counters}
                isAdmin={isAdmin} 
                onLogout={handleAdminLogout}
                {...adminHandlers}
              />
              </ErrorBoundary>
            </Suspense>
              )}
            </AnimatePresence>
  
            {showAdminLogin && (
              <Suspense fallback={
                <div className="fixed inset-0 bg-space-darker/80 flex items-center justify-center">
                  <LoadingIndicator size="md" message="Loading..." />
                </div>
              }>
                <ErrorBoundary fallback={
                  <div className="min-h-screen flex items-center justify-center bg-red-500/10 p-4">
                    <div className="text-red-400 text-center">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                      <h1 className="text-xl mb-4">Failed to load authentication module</h1>
                      <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-500/20 rounded-lg"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                }>
                  <Auth
                    onLogin={handleAdminLogin}
                    onClose={() => setShowAdminLogin(false)}
                  />
                </ErrorBoundary>
              </Suspense>
            )}
          </div>
      </div>
    </Layout>
    );
  }

  export default AppContent;