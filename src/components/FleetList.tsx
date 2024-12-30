import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Ship, RefreshCw } from 'lucide-react';
import { Fleet, Counter } from '@/types';
import { FleetCard } from './FleetCard';
import ErrorBoundary from './ErrorBoundary';

interface FleetListProps {
  fleets: Fleet[];
  filteredFleets: Fleet[];
  selectedFleetId: string | null;
  onSelectFleet: (id: string | null) => void;
  getCounters: (id: string) => Counter[];
  isAdmin?: boolean;
  onDeleteCounter?: (id: string) => void;
  onViewDetails?: () => void;
}

export const FleetList: React.FC<FleetListProps> = ({
  fleets,
  filteredFleets,
  selectedFleetId,
  onSelectFleet,
  getCounters,
  isAdmin,
  onDeleteCounter,
  onViewDetails,
}) => {
  const handleFleetSelect = (fleetId: string) => {
    if (selectedFleetId === fleetId) {
      onSelectFleet(null);
    } else {
      onSelectFleet(fleetId);
    }
  };

  const renderedFleets = useMemo(
    () =>
      filteredFleets.map((fleet) => (
        <motion.div
          key={fleet.id}
          className={`w-full max-w-md ${selectedFleetId === fleet.id ? 'expanded-card' : ''}`}
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          style={{
            gridColumn: `span ${selectedFleetId === fleet.id ? 1 : 1}`,
            zIndex: selectedFleetId === fleet.id ? 50 : 1,
          }}
          role="listitem"
          aria-selected={selectedFleetId === fleet.id}
          aria-label={`Fleet ${fleet.name}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleFleetSelect(fleet.id);
            }
          }}
        >
          <FleetCard
            fleet={fleet}
            isSelected={selectedFleetId === fleet.id}
            onSelect={() => handleFleetSelect(fleet.id)}
            counters={getCounters(fleet.id)}
            isFiltered={true}
            isAdmin={isAdmin}
            onDeleteCounter={onDeleteCounter}
            onViewDetails={onViewDetails}
          />
        </motion.div>
      )),
    [filteredFleets, selectedFleetId, getCounters, isAdmin, onDeleteCounter, onViewDetails]
  );

  // Förbättrat felmeddelande för när inga flottor finns
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

  return (
    <ErrorBoundary
      fallback={
        <div
          className="flex flex-col items-center justify-center p-8"
          role="alert"
          aria-live="assertive"
        >
          <div className="p-6 bg-red-500/10 rounded-lg border border-red-500/20 max-w-md w-full">
            <h3 className="text-lg font-medium text-red-400 mb-2">Failed to load fleets</h3>
            <p className="text-sm text-red-400/80 mb-4">Please try refreshing the page</p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      }
    >
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative"
        role="list"
        aria-label="Fleet list"
      >
        <AnimatePresence mode="popLayout">{renderedFleets}</AnimatePresence>
      </div>
    </ErrorBoundary>
  );
};
