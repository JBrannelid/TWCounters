import { memo, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Trash2, ChevronDown, Plus, Edit } from 'lucide-react';
import { Squad, Counter, Filters, Fleet } from '@/types';
import { GlassCard } from './ui/GlassCard';
import { UnitImage } from './ui/UnitImage';
import { VideoIndicator } from './ui/VideoIndicator';
import { ErrorBoundary } from 'react-error-boundary';
import { filterCounters } from './Utils/counterUtils';

// SquadCard component to display a single squad with counters and details 
interface SquadCardProps {
  squad: Squad;
  isSelected: boolean;
  onSelect: () => void;
  counters: Counter[];
  isAdmin?: boolean;
  onDeleteCounter?: (id: string) => void;
  onEditCounter?: (counter: Counter) => void;  
  onEdit?: (defense: Squad | Fleet) => Promise<void>;  
  onDelete?: (defense: Squad | Fleet) => Promise<void>; 
  isFiltered?: boolean;
  onAddCounter?: (squad: Squad) => void;
  filters: Filters;
}

export const SquadCard = memo<SquadCardProps>(({
  squad,
  isSelected,
  onSelect,
  counters,
  isAdmin,
  onDeleteCounter,
  onEditCounter,
  onEdit,  
  onDelete, 
  isFiltered = false,
  onAddCounter,
  filters
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Animation variants for overlay and card 
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

  // Card animation variants for expand/collapse effect 
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

  // Handle click outside to close the card 
  const handleClickOutside = (e: React.MouseEvent | React.TouchEvent) => {
    const contentElement = contentRef.current;
    const target = e.target as Node;
    
    if (contentElement && !contentElement.contains(target)) {
      onSelect();
    }
  };

  // Filter counters based on the selected filters 
  const filteredCounters = useMemo(() => {
    if (!counters) return [];
    return filterCounters(counters, filters);
}, [counters, filters]);

const handleSquadSelect = useCallback(() => {
  if (!isSelected) {
    onSelect();
  }
}, [isSelected, onSelect]);

const handleEditSquad = useCallback((e: React.MouseEvent) => {
  e.stopPropagation();
  onEdit?.(squad);
}, [onEdit, squad]);

const handleDeleteSquad = useCallback((e: React.MouseEvent) => {
  e.stopPropagation();
  if (window.confirm('Are you sure you want to delete this squad?')) {
    onDelete?.(squad);
  }
}, [onDelete, squad]);

const handleAddSquadCounter = useCallback((e: React.MouseEvent) => {
  e.stopPropagation();
  onAddCounter?.(squad);
}, [onAddCounter, squad]);

const handleEditSquadCounter = useCallback((e: React.MouseEvent, counter: Counter) => {
  e.stopPropagation();
  if (onEditCounter) {
    onEditCounter(counter);
  }
}, [onEditCounter]);

const cardTitle = (
  <h2 className="text-xl font-orbitron text-white">
    {squad.name}
  </h2>
);

const sectionHeadings = (
  <>
    <h3 className="text-lg font-bold text-white/80 mb-3">Squad Leader</h3>
    <h3 className="text-lg font-bold text-white/80 mb-3">Squad Members</h3>
    <h3 className="text-lg font-bold text-white/80 mb-3">Requirements</h3>
    <h3 className="text-lg font-bold text-white/80">Counters</h3>
  </>
);

return (
  <ErrorBoundary 
    fallback={
      <GlassCard variant="dark" className="p-4">
        <div className="text-red-400">Error loading squad card</div>
      </GlassCard>
    }
  >
    <div className={`relative ${isSelected ? 'z-50' : 'z-0'}`}>
      <motion.div
        layout
        onClick={handleSquadSelect}
        className="w-full"
      >
        <GlassCard
          variant="dark"
          glowColor={squad.alignment === 'light' ? 'blue' : 'red'}
          isInteractive={!isSelected}
          className={`transition-all duration-300 cursor-pointer ${
            isFiltered ? 'opacity-100' : 'opacity-50'
          }`}
        >
        <div className="relative p-4">
          {/* Header section */}
          <div className="flex flex-col gap-2 mb-4">
            {/* Rad 1: Squad namn */}
            <div className="flex items-center justify-between mb-4"> 
            <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-orbitron text-white">{squad.name}</h2>
              </div>
              <motion.div
                animate={{ rotate: isSelected ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg"
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </div>

            {/* Rad 2: Admin Controls */}
            {isAdmin && (
              <div className="flex gap-3 mb-4"> 
                <button
                  onClick={handleEditSquad}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDeleteSquad}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {onAddCounter && (
                  <button
                    onClick={handleAddSquadCounter}
                    className="text-green-400 hover:text-green-300 transition-colors"
                    aria-label="Add counter"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Rad 3: Badges */}
            <div className="flex items-center gap-2">
              <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                squad.alignment === 'light'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-400/20'
                  : 'bg-red-500/20 text-red-400 border border-red-400/20'
              }`}>
                {squad.alignment === 'light' ? 'Light Side' : 'Dark Side'}
              </span>
              {squad.twOmicronRequired && (
                <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400 border border-purple-400/20">
                  TW Omicron
                </span>
              )}
            </div>
          </div>
            {/* Squad preview */}
            <div className="flex flex-wrap items-center gap-2">
              {squad.leader && (
                <div className="relative group">
                  <UnitImage
                    id={squad.leader.id}
                    name={squad.leader.name}
                    type="squad-leader"
                    size="md"
                    className="rounded-full border-2 border-blue-400/50"
                    isLeader
                  />
                </div>
              )}
              {squad.characters.map((char) => (
                <UnitImage
                  key={char.id}
                  id={char.id}
                  name={char.name}
                  type="squad-member"
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
                className="w-full max-w-xl mx-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <GlassCard
                  variant="dark"
                  glowColor={squad.alignment === 'light' ? 'blue' : 'red'}
                  className="min-h-[50vh] max-h-[90vh] overflow-hidden" 
                >
                  {/* Content */}
                  <div className="p-6 overflow-y-auto max-h-[calc(80vh-3rem)] custom-scrollbar">
                    {/* Squad Leader */}
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-white/80 mb-3">Squad Leader</h3>
                      {squad.leader && (
                        <div className="flex items-center gap-3">
                          <UnitImage
                            id={squad.leader.id}
                            name={squad.leader.name}
                            type="squad-leader"
                            size="md"
                            className="rounded-full border-2 border-blue-400/50"
                            isLeader
                          />
                          <div>
                            <div className="text-white font-medium">{squad.leader.name}</div>
                            <div className="text-white/60 text-sm">{squad.leader.role}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Squad Members */}
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-white/80 mb-3">Squad Members</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {squad.characters.map((char) => (
                          <div key={char.id} className="flex items-center gap-3">
                            <UnitImage
                              id={char.id}
                              name={char.name}
                              type="squad-member"
                              size="md"
                              className="rounded-full border-2 border-white/20"
                            />
                            <div>
                              <div className="text-white font-medium">{char.name}</div>
                              <div className="text-white/60 text-sm">{char.role}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Requirements */}
                    {squad.twOmicronRequired && (
                      <div className={`mb-6 p-4 bg-white/5 rounded-lg border border-white/10 ${
                        squad.alignment === 'light'
                          ? 'bg-blue-500/10 border-blue-500/20'
                          : 'bg-red-500/10 border-red-500/20'
                      }`}>
                        <h3 className="text-sm font-medium text-purple-400 mb-1">Requirements</h3>
                        <p className="text-sm text-white/70">Territory Wars Omicron ability required</p>
                      </div>
                    )}

                    {/* Squad Description if available */}
                    {squad.description && (
                      <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                        <h3 className="text-sm font-medium text-purple-400 mb-1">Description</h3>
                        <p className="text-sm text-white/70">{squad.description}</p>
                      </div>
                    )}

                    {/* Counters */}
                    {counters.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white">Counters</h3>
                        <div className="space-y-3">
                          {counters.map((counter) => (
                            <div
                              key={counter.id}
                              className={`rounded-lg p-4 space-y-3 border transition-all duration-200 ${
                                squad.alignment === 'light' 
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
                                  {counter.twOmicronRequired && (
                                    <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400">
                                      TW Omni
                                    </span>
                                  )}
                                  {counter.video_url && <VideoIndicator videoUrl={counter.video_url} />}
                                </div>
                                {isAdmin && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={(e) => handleEditSquadCounter(e, counter)}
                                      className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg"
                                      aria-label="Edit counter"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    {onDeleteCounter && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteCounter(counter.id);
                                        }}
                                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                              <p className="text-white/70">{counter.description}</p>

                              {counter?.counterSquad && 'leader' in counter.counterSquad && (
                                <div className="flex flex-wrap items-center gap-2">
                                  {counter.counterSquad.leader && (
                                    <UnitImage
                                      id={counter.counterSquad.leader.id}
                                      name={counter.counterSquad.leader.name}
                                      type="squad-leader"
                                      size="md"
                                      className="border-2 border-blue-400"
                                    />
                                  )}
                                  {counter.counterSquad.characters.map((char) => (
                                    <UnitImage
                                      key={char.id}
                                      id={char.id}
                                      name={char.name}
                                      type="squad-member"
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
                </GlassCard>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </ErrorBoundary>
);
});

SquadCard.displayName = 'SquadCard'; // Tell React DevTools the component name 

export default SquadCard;