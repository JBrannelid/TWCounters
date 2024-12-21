import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Users, RefreshCw } from 'lucide-react';
import { Squad, Counter } from '@/types';
import { SquadCard } from './SquadCard';
import ErrorBoundary from './ErrorBoundary';

interface SquadListProps {
  squads: Squad[];
  filteredSquads: Squad[];
  selectedSquadId: string | null;
  onSelectSquad: (id: string | null) => void;
  getCounters: (id: string) => Counter[];
  isAdmin?: boolean;
  onDeleteCounter?: (id: string) => void;
  onViewDetails?: () => void;
}

export const SquadList: React.FC<SquadListProps> = ({
  squads,
  filteredSquads,
  selectedSquadId,
  onSelectSquad,
  getCounters,
  isAdmin,
  onDeleteCounter,
  onViewDetails
}) => {
  const handleSquadSelect = (squadId: string) => {
    if (selectedSquadId === squadId) {
      onSelectSquad(null);
    } else {
      onSelectSquad(squadId);
    }
  };

  const renderedSquads = useMemo(() => 
    filteredSquads.map((squad) => (
      <motion.div
        key={squad.id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <SquadCard
          squad={squad}
          isSelected={selectedSquadId === squad.id}
          onSelect={() => handleSquadSelect(squad.id)}
          counters={getCounters(squad.id)}
          isFiltered={true}
          isAdmin={isAdmin}
          onDeleteCounter={onDeleteCounter}
          onViewDetails={onViewDetails}
        />
      </motion.div>
    )),
    [filteredSquads, selectedSquadId, getCounters, isAdmin, onDeleteCounter, onViewDetails]
  );

  if (!squads || squads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-white/60">
        <Users className="w-12 h-12 mb-4 animate-float" />
        <p className="text-lg font-titillium">No squads found</p>
      </div>
    );
  }

  return (
    <ErrorBoundary 
      fallback={
        <div className="flex flex-col items-center justify-center p-8">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {renderedSquads}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
};