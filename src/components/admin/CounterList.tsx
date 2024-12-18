// src/components/admin/CounterList.tsx

import React from 'react';
import { Squad, Fleet, Counter, Character, Ship } from '@/types';
import { UnitImage } from '@/components/ui/UnitImage';
import { Edit, Trash2, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CounterListProps {
  counters: Counter[];
  targetDefense: Squad | Fleet;
  onEdit?: (counter: Counter) => void;
  onDelete?: (id: string) => void;
}

// Type guard för att kontrollera om det är en Squad

// Type guard för att kontrollera om det är en Squad Counter
const isSquadCounter = (counter: Counter): counter is Counter & { counterSquad: Squad } => {
  return 'leader' in counter.counterSquad;
};

export const CounterList: React.FC<CounterListProps> = ({
  counters,
  targetDefense,
  onEdit,
  onDelete
}) => {
  // Säkerställ att counter har all nödvändig data
  const isValidCounter = (counter: Counter | undefined): counter is Counter => {
    return Boolean(
      counter &&
      counter.id &&
      counter.targetSquad &&
      counter.counterSquad
    );
  };

  // Generera unika nycklar för list items
  const getUniqueKey = (counter: Counter, index: number, unitId: string): string => {
    return `${counter.id}-${index}-${unitId}`;
  };

  // Validera input data
  if (!Array.isArray(counters) || counters.length === 0) {
    return null;
  }

  // Filtrera relevanta counters och validera dem
  const relevantCounters = counters.filter(counter => 
    isValidCounter(counter) && counter.targetSquad.id === targetDefense.id
  );

  if (relevantCounters.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      <h4 className="text-sm font-medium text-white/60">
        Counters for {targetDefense.name}
      </h4>
      
      <div className="space-y-3">
        <AnimatePresence>
          {relevantCounters.map((counter, index) => (
            <motion.div
              key={counter.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 bg-white/5 rounded-lg space-y-4"
            >
              {/* Counter Type and Actions */}
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
                      TW Omicron
                    </span>
                  )}

                  {counter.video_url && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400">
                      <Video className="w-3 h-3" />
                      Video
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(counter)}
                      className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(counter.id)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Description */}
              {counter.description && (
                <p className="text-white/70">{counter.description}</p>
              )}

              {/* Counter Squad/Fleet Preview */}
              {counter.counterSquad && (
                <div className="flex items-center gap-2">
                  {isSquadCounter(counter) ? (
                    // Squad Counter
                    <>
                      {counter.counterSquad.leader && (
                        <UnitImage
                          key={getUniqueKey(counter, index, counter.counterSquad.leader.id)}
                          id={counter.counterSquad.leader.id}
                          name={counter.counterSquad.leader.name}
                          type="squad-leader"
                          size="sm"
                          className="border-2 border-blue-400"
                        />
                      )}
                      {counter.counterSquad.characters.map((char: Character) => (
                        <UnitImage
                          key={getUniqueKey(counter, index, char.id)}
                          id={char.id}
                          name={char.name}
                          type="squad-member"
                          size="sm"
                          className="border-2 border-white/20"
                        />
                      ))}
                    </>
                  ) : (
                    // Fleet Counter
                    <>
                      {'capitalShip' in counter.counterSquad && counter.counterSquad.capitalShip && (
                        <UnitImage
                          key={getUniqueKey(counter, index, counter.counterSquad.capitalShip.id)}
                          id={counter.counterSquad.capitalShip.id}
                          name={counter.counterSquad.capitalShip.name}
                          type="capital-ship"
                          size="sm"
                          className="border-2 border-blue-400"
                        />
                      )}
                      {'startingLineup' in counter.counterSquad && 
                        counter.counterSquad.startingLineup?.map((ship: Ship) => (
                          <UnitImage
                            key={getUniqueKey(counter, index, ship.id)}
                            id={ship.id}
                            name={ship.name}
                            type="ship"
                            size="sm"
                            className="border-2 border-white/20"
                          />
                        ))
                      }
                    </>
                  )}
                </div>
              )}

              {/* Requirements Section */}
              {counter.requirements && counter.requirements.length > 0 && (
                <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <h4 className="text-sm font-medium text-blue-400 mb-2">Requirements</h4>
                  {counter.requirements.map((req, reqIndex) => (
                    <div 
                      key={`${counter.id}-req-${reqIndex}`}
                      className="text-sm text-white/70"
                    >
                      {req.description}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CounterList;