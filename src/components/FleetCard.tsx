import { memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ship, Trash2, ChevronDown, Plus } from 'lucide-react';
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
  const contentRef = useRef<HTMLDivElement>(null);

  // Animation variants
  const overlayVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const cardVariants = {
    initial: { scale: 0.95, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        duration: 0.3,
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    },
    exit: { 
      scale: 0.95, 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const handleClickOutside = (e: React.MouseEvent | React.TouchEvent) => {
    const contentElement = contentRef.current;
    const target = e.target as Node;
    
    if (contentElement && !contentElement.contains(target)) {
      onSelect();
    }
  };

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
      <div className={`relative ${isSelected ? 'z-50' : 'z-0'}`}>
        <motion.div
          layout
          onClick={() => !isSelected && onSelect()}
          className="w-full"
        >
          <GlassCard
            variant="dark"
            glowColor={fleet.alignment === 'light' ? 'blue' : 'red'}
            isInteractive={!isSelected}
            className={`transition-all duration-300 cursor-pointer ${
              isFiltered ? 'opacity-100' : 'opacity-50'
            }`}
          >
            <div className="relative p-4">
               {/* Header section */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-orbitron text-white flex items-center gap-2">
                    <Ship className="w-5 h-5 text-blue-400" />
                    {fleet.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                     <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                       fleet.alignment === 'light'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-400/20'
                        : 'bg-red-500/20 text-red-400 border border-red-400/20'
                    }`}>
                    {fleet.alignment === 'light' ? 'Light Side' : 'Dark Side'}
                  </span>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isSelected ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg"
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </div>
              {/* Fleet preview */}
              <div className="flex flex-wrap items-center gap-2">
                {fleet.capitalShip && (
                  <div className="relative group">
                  <UnitImage
                    id={fleet.capitalShip.id}
                    name={fleet.capitalShip.name}
                    type="capital-ship"
                    size="md"
                    className="rounded-full border-2 border-blue-400/50"
                    isCapital
                  />
                  </div>
                )}
                {fleet.startingLineup.map((ship) => (
                  <UnitImage
                    key={ship.id}
                    id={ship.id}
                    name={ship.name}
                    type="ship"
                    size="md"
                    className="rounded-full border-2 border-white/20"
                  />
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <AnimatePresence>
          {isSelected && (
            <div className="fixed inset-0 z-50" onClick={handleClickOutside}>
              <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                variants={overlayVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              />
                <motion.div
                  className="fixed inset-0 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <div
                    ref={contentRef}
                    className="w-full max-w-xl mx-auto my-auto" // Added my-auto
                    onClick={(e) => e.stopPropagation()}
                  >
                  <GlassCard
                    variant="dark"
                    glowColor={fleet.alignment === 'light' ? 'blue' : 'red'}
                    className="max-h-[90vh] overflow-hidden flex flex-col" // Updated classes
                    >
                     {/* Content wrapper */}
                     <div className="flex flex-col flex-1 overflow-hidden">
                      <div className="p-6 overflow-y-auto custom-scrollbar">
                      {/* Capital Ship */}
                          <div className="mb-6">
                            <h4 className="text-sm font-bold text-white/80 mb-3">Capital Ship</h4>
                              {fleet.capitalShip && (
                                <div className="flex items-center gap-3">
                                  <UnitImage
                                    id={fleet.capitalShip.id}
                                    name={fleet.capitalShip.name}
                                    type="capital-ship"
                                    size="md"
                                    className="rounded-full border-2 border-blue-400/50"
                                    isCapital
                                  />
                                  <div>
                                    <div className="text-white font-medium">{fleet.capitalShip.name}</div>
                                    <div className="text-white/60 text-sm">Capital Ship</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                          {/* Starting Lineup */}
                          <div className="mb-6">
                            <h4 className="text-sm font-bold text-white/80 mb-3">Starting Lineup</h4>
                              {fleet.startingLineup.map((ship) => (
                                <div key={ship.id} className="flex items-center gap-3">
                                  <UnitImage
                                    id={ship.id}
                                    name={ship.name}
                                    type="ship"
                                    size="md"
                                    className="rounded-full border-2 border-white/20"
                                    />
                                  <div>
                                    <div className="text-white font-medium">{ship.name}</div>
                                    <div className="text-white/60 text-sm">Starting Ship</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          {/* Reinforcements */}
                          {fleet.reinforcements.length > 0 && (
                            <div className="mb-6">
                              <h4 className="text-sm font-bold text-white/80 mb-3">Reinforcements</h4>
                                {fleet.reinforcements.map((ship, index) => (
                                  <div key={ship.id} className="flex items-center gap-3">
                                    <div className="relative">
                                      <UnitImage
                                        id={ship.id}
                                        name={ship.name}
                                        type="ship"
                                        size="md"
                                        className="rounded-full border-2 border-white/20"
                                        />
                                      <div className="absolute -top-1 -left-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                                        {index + 1}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-white font-medium">{ship.name}</div>
                                      <div className="text-white/60 text-sm">Reinforcement {index + 1}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                          )}
                          {/* Call Order */}
                          {fleet.callOrder && (
                            <div className={`rounded-lg border p-4 mb-6 ${
                              fleet.alignment === 'light'
                                ? 'bg-blue-500/10 border-blue-500/20'
                                : 'bg-red-500/10 border-red-500/20'
                            }`}>
                              <h4 className={`text-sm font-medium mb-1 ${
                                fleet.alignment === 'light' ? 'text-blue-400' : 'text-red-400'
                              }`}>Call Order</h4>
                              <p className="text-sm text-white/70">{fleet.callOrder}</p>
                            </div>
                          )}

                          {/* Counters */}
                          {fleetCounters.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="text-lg font-medium text-white">Counters</h4>
                              <div className="space-y-3">
                                {fleetCounters.map((counter) => (
                                  <div
                                    key={counter.id}
                                    className={`rounded-lg p-4 space-y-3 border transition-all duration-200 ${
                                      fleet.alignment === 'light' 
                                    ? 'border-blue-400/20 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-400/30' 
                                    : 'border-red-400/20 bg-red-500/10 hover:bg-red-500/20 hover:border-red-400/30'
                                    }`}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                          counter.counterType === 'hard'
                                            ? 'bg-green-500/20 text-green-400'
                                            : counter.counterType === 'soft'
                                            ? 'bg-yellow-500/20 text-yellow-400'
                                            : 'bg-red-500/20 text-red-400'
                                        }`}>
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

                                    {'capitalShip' in counter.counterSquad && (
                                      <div className="flex flex-wrap items-center gap-2">
                                        {counter.counterSquad.capitalShip && (
                                          <UnitImage
                                            id={counter.counterSquad.capitalShip.id}
                                            name={counter.counterSquad.capitalShip.name}
                                            type="capital-ship"
                                            size="md"
                                            className="border-2 border-blue-400"
                                            isCapital
                                          />
                                        )}
                                        {counter.counterSquad.startingLineup.map((ship) => (
                                          <UnitImage
                                            key={ship.id}
                                            id={ship.id}
                                            name={ship.name}
                                            type="ship"
                                            size="md"
                                            className="border-2 border-white/20"
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        
                      </div>
                    </div>
                  </GlassCard>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {isAdmin && onAddCounter && !isSelected && (
          <div className="mt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddCounter(fleet);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg 
                       bg-green-500/20 text-green-400 hover:bg-green-500/30"
            >
              <Plus className="w-4 h-4" />
              Add Counter
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
});

FleetCard.displayName = 'FleetCard';

export default FleetCard;