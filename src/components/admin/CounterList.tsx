import React, { useState } from 'react';
import { Counter, Squad, Fleet } from '@/types';
import { UnitImage } from '../ui/UnitImage';
import { Edit, Trash2, Video, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';
import { VideoIndicator } from '../ui/VideoIndicator';

interface CounterListProps {
  counters: Counter[];
  targetDefense: Squad | Fleet;
  onEdit?: (counter: Counter) => void;
  onDelete?: (id: string) => void;
}

// Enhanced type guards with null checks
const isSquadCounter = (counter: Counter): counter is Counter & { counterSquad: Squad } => {
  return counter?.counterSquad && 'leader' in counter.counterSquad;
};

const isFleetCounter = (counter: Counter): counter is Counter & { counterSquad: Fleet } => {
  return counter?.counterSquad && 'capitalShip' in counter.counterSquad;
};

export const CounterList: React.FC<CounterListProps> = ({
  counters,
  targetDefense,
  onEdit,
  onDelete
}) => {
  const [expandedCounter, setExpandedCounter] = useState<string | null>(null);
  
  // Validate counters before usage
  if (!Array.isArray(counters) || !counters.length) {
    return (
      <div className="text-center text-white/60 py-4">
        No counters available
      </div>
    );
  }

  const validCounters = counters.filter(counter => 
    counter && counter.id && counter.counterSquad
  );

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {validCounters.map((counter) => {
          if (!counter.counterSquad) {
            console.warn('Counter found without counterSquad:', counter);
            return null;
          }

          const isExpanded = expandedCounter === counter.id;

          const renderCounterUnits = () => {
            try {
              if (isSquadCounter(counter)) {
                return (
                  <>
                    {counter.counterSquad.leader && (
                      <UnitImage
                        id={counter.counterSquad.leader.id}
                        name={counter.counterSquad.leader.name}
                        type="squad-leader"
                        size="sm"
                        className="border-2 border-blue-400"
                      />
                    )}
                    {Array.isArray(counter.counterSquad.characters) && 
                      counter.counterSquad.characters.slice(0, 2).map((char) => (
                        <UnitImage
                          key={`${counter.id}-${char.id}`}
                          id={char.id}
                          name={char.name}
                          type="squad-member"
                          size="sm"
                          className="border-2 border-white/20"
                        />
                      ))}
                    {Array.isArray(counter.counterSquad.characters) && 
                      counter.counterSquad.characters.length > 2 && (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 text-xs">
                          +{counter.counterSquad.characters.length - 2}
                        </div>
                    )}
                  </>
                );
              } else if (isFleetCounter(counter)) {
                return (
                  <>
                    {counter.counterSquad.capitalShip && (
                      <UnitImage
                        id={counter.counterSquad.capitalShip.id}
                        name={counter.counterSquad.capitalShip.name}
                        type="capital-ship"
                        size="sm"
                        className="border-2 border-blue-400"
                      />
                    )}
                    {Array.isArray(counter.counterSquad.startingLineup) && 
                      counter.counterSquad.startingLineup.slice(0, 2).map((ship) => (
                        <UnitImage
                          key={`${counter.id}-${ship.id}`}
                          id={ship.id}
                          name={ship.name}
                          type="ship"
                          size="sm"
                          className="border-2 border-white/20"
                        />
                      ))}
                    {Array.isArray(counter.counterSquad.startingLineup) && 
                      counter.counterSquad.startingLineup.length > 2 && (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 text-xs">
                          +{counter.counterSquad.startingLineup.length - 2}
                        </div>
                    )}
                  </>
                );
              }
              return null;
            } catch (error) {
              console.error('Error rendering counter units:', error);
              return null;
            }
          };

          return (
            <motion.div
              key={`${counter.id}-${counter.counterType}`}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <GlassCard
                variant="dark"
                className="overflow-hidden cursor-pointer"
                onClick={() => setExpandedCounter(
                  expandedCounter === counter.id ? null : counter.id
                )}
              >
                {/* Counter Header */}
                <div className="p-4 flex justify-between items-start">
                  <div className="flex flex-col gap-2">
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
                          TW Omicron
                        </span>
                      )}
                      {counter.video_url && <VideoIndicator videoUrl={counter.video_url} />}
                    </div>

                    <div className="flex items-center gap-2">
                      {renderCounterUnits()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                  {onEdit && (
  <button
    onClick={() => {
      console.log('Edit counter clicked:', counter);
      onEdit(counter);
    }}
    className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg"
    aria-label="Edit counter"
  >
    <Edit className="w-4 h-4" />
  </button>
)}
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(counter.id);
                        }}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-white/60" />
                    </motion.div>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/10"
                    >
                      <div className="p-4 space-y-4">
                        {counter.description && (
                          <p className="text-white/70">{counter.description}</p>
                        )}

                        {counter.requirements?.length > 0 && (
                          <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <h4 className="text-sm font-medium text-blue-400 mb-2">Requirements</h4>
                            {counter.requirements.map((req, index) => (
                              <div key={`${counter.id}-req-${index}`} className="text-sm text-white/70">
                                {req.description}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default CounterList;