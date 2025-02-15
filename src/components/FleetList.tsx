import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Ship, RefreshCw } from 'lucide-react';
import { Squad, Fleet, Counter, Filters } from '@/types';
import { FleetCard } from './FleetCard';
import ErrorBoundary from './ErrorBoundary';

interface FleetListProps {
  fleets: Fleet[];
  filteredFleets: Fleet[];
  selectedFleetId: string | null;
  onSelectFleet: (id: string | null) => void;
  getCounters: (id: string, type?: 'squad' | 'fleet') => Counter[];
  isAdmin: boolean;
  onDeleteCounter: (id: string) => Promise<void>;
  onEditCounter: (counter: Counter) => void;
  filters: Filters;
  onEdit: (defense: Squad | Fleet) => Promise<void>;  
  onAddCounter: (defense: Squad | Fleet) => void;
  onDelete?: (defense: Squad | Fleet) => Promise<void>;
}

    export const FleetList: React.FC<FleetListProps> = ({
      fleets,
      filteredFleets,
      selectedFleetId,
      onSelectFleet,
      getCounters,
      isAdmin,
      onDeleteCounter,
      onEditCounter,
      filters,
      onEdit,  
      onAddCounter,
      onDelete 
    }) => {
  const handleFleetSelect = (fleetId: string) => {
    if (selectedFleetId === fleetId) {
      onSelectFleet(null);
    } else {
      onSelectFleet(fleetId);
    }
  };

  const renderedFleets = useMemo(() => {
    return filteredFleets.map((fleet, index) => {
      return (
        <motion.div
          key={fleet.id}
          className={`card-wrapper ${selectedFleetId === fleet.id ? 'expanded-card' : ''}`}
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          style={{ 
            gridColumn: `span ${selectedFleetId === fleet.id ? 1 : 1}`,
            zIndex: selectedFleetId === fleet.id ? 50 : 1
          }}
          role="gridcell"
          aria-selected={selectedFleetId === fleet.id}
          aria-label={`Fleet ${fleet.name}`}
          tabIndex={0}
          aria-rowindex={index + 1}
          aria-colindex={Math.floor(index % 3) + 1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleFleetSelect(fleet.id);
            }
          }}
        >
          <FleetCard
            key={fleet.id}
            fleet={fleet}
            isSelected={selectedFleetId === fleet.id}
            onSelect={() => handleFleetSelect(fleet.id)}
            counters={getCounters(fleet.id)}
            isFiltered={true}
            isAdmin={isAdmin}
            onDeleteCounter={onDeleteCounter}
            onEditCounter={onEditCounter}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddCounter={onAddCounter}
          />
        </motion.div>
      );
    });
  }, [
    filteredFleets,
    selectedFleetId,
    getCounters,
    isAdmin,
    onDeleteCounter,
    onEditCounter,
    onEdit,
    onDelete,
    onAddCounter,
    handleFleetSelect
  ]);
  // if there are no fleets, show a message to the user
  if (!fleets || fleets.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 text-white/60"
        role="alert"
        aria-live="polite"
      >
        <Ship className="w-12 h-12 mb-4" aria-hidden="true" />
        <p className="text-lg font-titillium">No fleets found</p>
      </div>
    );
  }

  // log the props received by the FleetList component
  // useEffect(() => {
  //   console.log('FleetList received props:', {
  //     isAdmin,
  //     hasEditCounter: Boolean(onEditCounter),
  //     hasDeleteCounter: Boolean(onDeleteCounter)
  //   });
  // }, [isAdmin, onEditCounter, onDeleteCounter]);

  return (
    <ErrorBoundary
      fallback={
        <div
          className="flex flex-col items-center justify-center p-8"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div 
            className="p-6 bg-red-500/10 rounded-lg border border-red-500/20 max-w-md w-full"
            role="status"
            aria-labelledby="error-heading"
            aria-describedby="error-description"
          >
            <h3 
              id="error-heading"
              className="text-lg font-medium text-red-400 mb-2"
            >
              Failed to load fleets
            </h3>
            <p 
              id="error-description"
              className="text-sm text-red-400/80 mb-4"
            >
              Please try refreshing the page
            </p>
            <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
            aria-label="Refresh page"
            type="button"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Refresh</span>
          </button>
          </div>
        </div>
      }
    >
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative"
        role="grid"
        aria-label="Fleet list"
        aria-rowcount={filteredFleets.length}
        aria-colcount={window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1}
        aria-live="polite"
      >
      <div role="row" className="contents">
        <AnimatePresence mode="popLayout">
          {renderedFleets}
        </AnimatePresence>
      </div>
    </div>
  </ErrorBoundary>
)};
