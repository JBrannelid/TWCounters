import { memo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ship, Trash2, Plus } from 'lucide-react';
import { Fleet, Counter } from '@/types';
import { GlassCard } from './ui/GlassCard';
import { UnitImage } from './ui/UnitImage';
import { VideoIndicator } from './ui/VideoIndicator';
import { ErrorBoundary } from 'react-error-boundary';

interface FleetCardProps {
  fleet: Fleet;
  isSelected: boolean;
  onSelect: () => void;
  counters: Counter[];
  isAdmin?: boolean;
  onDeleteCounter?: (id: string) => void;
  onViewDetails?: () => void;
  isFiltered?: boolean;
  onAddCounter?: (fleet: Fleet) => void;
}

export const FleetCard = memo<FleetCardProps>(({
  fleet,
  isSelected,
  onSelect,
  counters,
  isAdmin,
  onDeleteCounter,
  isFiltered = false,
  onAddCounter
}) => {
  const [] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
// Log data to console
console.log('Full fleet data:', fleet);

  // Filtrera counters för denna fleet
  const fleetCounters = counters.filter(counter => {
    const isTargetFleet = counter.targetSquad.id === fleet.id;
    const isCounterFleet = counter.counterSquad.id === fleet.id;
    const isTargetCapitalShip = 'capitalShip' in counter.targetSquad && 
      counter.targetSquad.capitalShip?.id === fleet.id;
    
    return isTargetFleet || isCounterFleet || isTargetCapitalShip;
  });

  return (
    <ErrorBoundary 
      fallback={
        <GlassCard variant="dark" className="p-4">
          <div className="text-red-400">Error loading fleet card</div>
        </GlassCard>
      }
    >
      <GlassCard
        variant="dark"
        glowColor={fleet.alignment === 'light' ? 'blue' : 'red'}
        isInteractive
        isSelected={isSelected}
        onClick={() => {
          // Explicit call to toggle state
          if (isSelected) {
            onSelect();
          } else {
            onSelect();
          }
        }}
        className={`transition-all duration-300 ease-out hover:scale-[1.01] ${
          isFiltered ? 'opacity-100' : 'opacity-50'
        }`}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-orbitron text-white flex items-center gap-2">
                <Ship className="w-5 h-5 text-blue-400" />
                {fleet.name}
              </h3>
              {/* Badges */}
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs
                  ${fleet.alignment === 'light'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {fleet.alignment === 'light' ? 'Light Side' : 'Dark Side'}
                </span>
              </div>
            </div>
              {/* Visa metadata i Icon Tooltip*/}
              {/*
            <div className="flex items-center gap-2">
              {onViewDetails && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMetadata(true);
                    }}
                    className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <MetadataView 
                    isOpen={showMetadata}
                    onClose={() => setShowMetadata(false)}
                    data={fleet}
                  />
                </>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect();
                }}
                className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg"
              >
                {isSelected ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>  */}
          </div>

          {/* Fleet Formation */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {/* Capital Ship */}
            {fleet.capitalShip && (
              <UnitImage
                id={fleet.capitalShip.id}
                name={fleet.capitalShip.name}
                type="capital-ship"
                size="md"
                className="rounded-full border-2 border-blue-400"
                withTooltip={true}
                isCapital={true}
              />
            )}

            {/* Starting Lineup */}
            {fleet.startingLineup.map((ship) => (
              <UnitImage
                key={ship.id}
                id={ship.id}
                name={ship.name}
                type="ship"
                size="md"
                className="rounded-full border-2 border-white/20"
                withTooltip={true}
              />
            ))}

            {/* Reinforcements */}
            {fleet.reinforcements.map((ship) => (
              <div key={ship.id} className="relative group opacity-75">
                <div className="relative">
                  <UnitImage
                    id={ship.id}
                    name={ship.name}
                    type="ship"
                    size="md"
                    className="rounded-full border-2 border-white/20"
                    withTooltip={true}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Fleet Call Order Strategy - Keep this since it's part of Fleet type */}
          {fleet.callOrder && (
            <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <h4 className="text-sm font-medium text-blue-400 mb-1">Call Order</h4>
              <p className="text-sm text-white/70">{fleet.callOrder}</p>
            </div>
          )}

          {/* Counters Section */}
          <AnimatePresence>
            {isSelected && fleetCounters.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 space-y-4 overflow-hidden"
                ref={contentRef}
              >
                <h4 className="text-lg font-medium text-white">Counters</h4>
                {fleetCounters.map((counter) => (
                  <div key={counter.id} className="p-4 bg-white/5 rounded-lg space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs
                          ${counter.counterType === 'hard'
                            ? 'bg-green-500/20 text-green-400'
                            : counter.counterType === 'soft'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {counter.counterType.charAt(0).toUpperCase() + counter.counterType.slice(1)}
                        </span>
                        {counter.video_url && <VideoIndicator videoUrl={counter.video_url} />}
                      </div>
                      {isAdmin && onDeleteCounter && (
                        <button
                          onClick={() => onDeleteCounter(counter.id)}
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <p className="text-white/70">{counter.description}</p>

{/* Counter Fleet Preview */}
{'capitalShip' in counter.counterSquad && (
  <div className="mt-4">
    <div className="flex flex-wrap items-center gap-2">
      {/* Capital Ship */}
      {counter.counterSquad.capitalShip && (
        <div className="relative">
          <UnitImage
            id={counter.counterSquad.capitalShip.id}
            name={counter.counterSquad.capitalShip.name}
            type="capital-ship"
            size="sm"
            className="border-2 border-blue-400"
          />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full 
                       flex items-center justify-center text-white text-xs">
            C
          </div>
        </div>
      )}

      {/* Starting Lineup */}
      {counter.counterSquad.startingLineup.map((ship) => (
        <UnitImage
          key={ship.id}
          id={ship.id}
          name={ship.name}
          type="ship"
          size="sm"
          className="border-2 border-white/20"
        />
      ))}

      {/* Reinforcements */}
      {counter.counterSquad.reinforcements.map((ship) => (
        <div key={ship.id} className="relative">
          <UnitImage
            id={ship.id}
            name={ship.name}
            type="ship"
            size="sm"
            className="border-2 border-white/20 opacity-75"
          />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full 
                       flex items-center justify-center text-white text-xs">
            R
          </div>
        </div>
      ))}
    </div>
  </div>
)}

                    {/* Strategy */}
                    {counter.strategy.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-white/80">Strategy:</h4>
                        <div className="space-y-3">
                          {counter.strategy.map((step, idx) => (
                            <div key={step.key} className="flex gap-3">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 
                                            flex items-center justify-center text-sm">
                                {idx + 1}
                              </span>
                              <p className="text-sm text-white/70">{step.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {isAdmin && onAddCounter && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddCounter(fleet);
              }}
              className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </GlassCard>
    </ErrorBoundary>
  );
});

FleetCard.displayName = 'FleetCard';