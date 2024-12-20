import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Trash2 } from 'lucide-react';
import { Squad, Counter } from '@/types';
import { GlassCard } from './ui/GlassCard';
import { UnitImage } from './ui/UnitImage';
import { VideoIndicator } from './ui/VideoIndicator';
import { ErrorBoundary } from 'react-error-boundary';

interface SquadCardProps {
  squad: Squad;
  isSelected: boolean;
  onSelect: () => void;
  counters: Counter[];
  isAdmin?: boolean;
  onDeleteCounter?: (id: string) => void;
  onViewDetails?: () => void;
  isFiltered?: boolean;
}

export const SquadCard = memo<SquadCardProps>(({
  squad,
  isSelected,
  onSelect,
  counters,
  isAdmin,
  onDeleteCounter,
  isFiltered = false
}) => {
  const [] = useState(false);
  // Log data to console
  console.log('Full squad data:', squad);

  // Validate required props
  if (!squad || !squad.characters || !Array.isArray(squad.characters)) {
    console.error('Invalid squad data:', squad);
    return null;
  }

  // Safely handle counters
  const safeCounters = Array.isArray(counters) ? counters : [];

  return (
    <ErrorBoundary 
      fallback={
        <GlassCard variant="dark" className="p-4">
          <div className="text-red-400">Error loading squad card</div>
        </GlassCard>
      }
    >
      <div onClick={() => onSelect()}>
        <GlassCard
          variant="dark"
          glowColor={squad.alignment === 'light' ? 'blue' : 'red'}
          isSelected={isSelected}
          className={`transition-all duration-300 ease-out hover:scale-[1.01] ${
            isFiltered ? 'opacity-100' : 'opacity-50'
          }`}
        >
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-orbitron text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  {squad.name}
                </h3>
                {/* Badges */}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs
                    ${squad.alignment === 'light'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {squad.alignment === 'light' ? 'Light Side' : 'Dark Side'}
                  </span>
                  {squad.twOmicronRequired && (
                    <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400">
                      TW Omicron
                    </span>
                  )}
                </div>
              </div>   
              {/* Visa metadata i Icon Tooltip */}
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
                      data={squad}
                    />
                  </>
                )}
                <button
                  className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg"
                >
                  {isSelected ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div> */}
            </div>

            {/* Squad Members */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {/* Leader */}
              {squad.leader && (
                <div className="relative group">
                  <UnitImage
                    id={squad.leader.id}
                    name={squad.leader.name}
                    type="squad-leader"
                    size="md"
                    className="rounded-full border-2 border-blue-400"
                    withTooltip={true}
                    isLeader={true}
                  />
                </div>
              )}
              
              {/* Squad Members */}
              {squad.characters.map((char) => (
                <div key={char.id} className="relative group">
                  <UnitImage
                    id={char.id}
                    name={char.name}
                    type="squad-member"
                    size="md"
                    className="rounded-full border-2 border-white/20"
                    withTooltip={true}
                  />
                </div>
              ))}
            </div>

            {/* Counters Section */}
            <AnimatePresence>
              {isSelected && safeCounters.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 space-y-4 overflow-hidden"
                >
                  <h4 className="text-lg font-medium text-white">Counters</h4>
                  {safeCounters.map((counter) => {
                    // Validate counter data
                    if (!counter || !counter.counterSquad) return null;

                    return (
                      <div
                        key={counter.id}
                        className="p-4 bg-white/5 rounded-lg space-y-4"
                      >
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
                            
                            {counter.twOmicronRequired && (
                              <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400">
                                TW Omni
                              </span>
                            )}
                            
                            {counter.video_url && <VideoIndicator videoUrl={counter.video_url} />}
                          </div>
                          {isAdmin && onDeleteCounter && (
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

                        <p className="mt-2 text-white/70">{counter.description}</p>

                        {/* Counter Squad Preview */}
                        {'characters' in counter.counterSquad && (
                          <div className="flex items-center gap-2">
                            {counter.counterSquad.leader && (
                              <UnitImage
                                id={counter.counterSquad.leader.id}
                                name={counter.counterSquad.leader.name}
                                type="squad-leader"
                                size="sm"
                                className="border-2 border-blue-400"
                              />
                            )}
                            {counter.counterSquad.characters.map((char) => (
                              <UnitImage
                                key={char.id}
                                id={char.id}
                                name={char.name}
                                type="squad-member"
                                size="sm"
                                className="border-2 border-white/20"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>
      </div>
    </ErrorBoundary>
  );
});

SquadCard.displayName = 'SquadCard';