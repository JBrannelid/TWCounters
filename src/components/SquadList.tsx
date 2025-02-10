import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Users, RefreshCw } from 'lucide-react';
import { Squad, Counter, Filters, Fleet } from '@/types';
import { SquadCard } from './SquadCard';
import ErrorBoundary from './ErrorBoundary';

interface SquadListProps {
  squads: Squad[];
  filteredSquads: Squad[];
  selectedSquadId: string | null;
  onSelectSquad: (id: string | null) => void;
  getCounters: (id: string, type?: 'squad' | 'fleet') => Counter[];
  isAdmin: boolean;
  onDeleteCounter: (id: string) => Promise<void>;
  onEditCounter: (counter: Counter) => void;
  filters: Filters;
  onEdit: (defense: Squad | Fleet) => Promise<void>;
  onAddCounter: (defense: Squad | Fleet) => void;
  onDelete?: (defense: Squad | Fleet) => Promise<void>;
}

export const SquadList: React.FC<SquadListProps> = ({
  squads,
  filteredSquads,
  selectedSquadId,
  onSelectSquad,
  getCounters,
  isAdmin,
  onDeleteCounter,
  onEditCounter,
  filters,
  onEdit,
  onAddCounter,
  onDelete  
}) => {
  const handleSquadSelect = (squadId: string) => {
    if (selectedSquadId === squadId) {
      onSelectSquad(null);
    } else {
      onSelectSquad(squadId);
    }
  };

  const renderedSquads = useMemo(() => {
    return filteredSquads.map((squad) => {
      const counters = getCounters(squad.id);
  
      return (
        <motion.div
          key={squad.id}
          className={`card-wrapper ${selectedSquadId === squad.id ? 'expanded-card' : ''}`}
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          style={{ 
            gridColumn: `span ${selectedSquadId === squad.id ? 1 : 1}`,
            zIndex: selectedSquadId === squad.id ? 50 : 1
          }}
          role="listitem"
          aria-selected={selectedSquadId === squad.id}
          aria-label={`Squad ${squad.name}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSquadSelect(squad.id);
            }
          }}
        >
          <SquadCard
            squad={squad}
            isSelected={selectedSquadId === squad.id}
            onSelect={() => handleSquadSelect(squad.id)}
            counters={counters}
            isFiltered={true}
            isAdmin={isAdmin}
            onDeleteCounter={onDeleteCounter}
            onEditCounter={onEditCounter}
            filters={filters}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddCounter={onAddCounter}
          />
        </motion.div>
      );
    });
  }, [
    filteredSquads, 
    selectedSquadId, 
    getCounters, 
    isAdmin, 
    onDeleteCounter, 
    onEditCounter,
    onEdit,
    onDelete,
    onAddCounter,
    handleSquadSelect,
    filters
  ]);
  
  if (!squads || squads.length === 0) {
    return (
      <div 
        className="flex flex-col items-center justify-center py-12 text-white/60"
        role="alert"
        aria-live="polite"
      >
        <Users className="w-12 h-12 mb-4" aria-hidden="true" />
        <p className="text-lg font-titillium">No squads found</p>
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
            <h3 className="text-lg font-medium text-red-400 mb-2">
              Failed to load squads
            </h3>
            <p className="text-sm text-red-400/80 mb-4">
              Please try refreshing the page
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg 
                       bg-red-500/20 text-red-400 hover:bg-red-500/30"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      }
    >
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative"
        role="list"
        aria-label="Squad list"
      >
        <AnimatePresence mode="popLayout">
          {renderedSquads}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
};