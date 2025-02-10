import React from 'react';
import { Squad, Fleet, Counter } from '@/types';
import { FirebaseService } from '@/services/firebaseService';
import { UnitImage } from '../ui/UnitImage';
import { Edit, Trash2, Plus, ChevronDown } from 'lucide-react';
import { VideoIndicator } from '../ui/VideoIndicator';
import { motion, AnimatePresence } from 'framer-motion';

interface DefenseCardProps {
  defense: Squad | Fleet;
  onEdit: (defense: Squad | Fleet) => void;
  onDelete: (defense: Squad | Fleet) => void;
  onAddCounter: (defense: Squad | Fleet) => void;
  onEditCounter: (counter: Counter) => void;
  onDeleteCounter: (counterId: string) => void;
  isAdmin: boolean;
}

export const DefenseCard: React.FC<DefenseCardProps> = ({
  defense,
  onEdit,
  onDelete,
  onAddCounter,
  onEditCounter,
  onDeleteCounter,
  isAdmin
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [counters, setCounters] = React.useState<Counter[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  console.log('DefenseCard rendered with:', {
    defenseId: defense.id,
    defenseName: defense.name,
    isAdmin,
    hasEditHandler: !!onEdit,
    hasDeleteHandler: !!onDelete,
    hasAddCounterHandler: !!onAddCounter
  });

  const handleEditDefense = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🔍 DefenseCard edit clicked:', defense);
    try {
      onEdit(defense);
    } catch (error) {
      console.error('Error in handleEditDefense:', error);
    }
  };

  // Load counters when defense changes or when expanded
  React.useEffect(() => {
    const loadCounters = async () => {
      if (!defense.id) return;
      setIsLoading(true);
      try {
        console.log('Loading counters for defense:', defense.id);
        const countersList = await FirebaseService.getCounters();
        console.log('All counters:', countersList);
        
        const relevantCounters = countersList.filter(counter => {
          const isTargetDefense = counter.targetSquad?.id === defense.id;
          const isCounterDefense = counter.counterSquad?.id === defense.id;
          const isCapitalShip = defense.type === 'fleet' && 
            'capitalShip' in counter.targetSquad && 
            counter.targetSquad.capitalShip?.id === defense.id;
            
          console.log('Counter evaluation:', {
            counterId: counter.id,
            isTargetDefense,
            isCounterDefense,
            isCapitalShip
          });
          
          return isTargetDefense || isCounterDefense || isCapitalShip;
        });
        
        console.log('Relevant counters:', relevantCounters);
        setCounters(relevantCounters);
      } catch (error) {
        console.error('Error loading counters:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCounters();
  }, [defense.id, isExpanded]);

  const handleEditCounter = async (e: React.MouseEvent, counter: Counter) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('DefenseCard: Starting counter edit with:', counter);
    try {
      if (onEditCounter) {
        const completeCounter = {
          ...counter,
          targetSquad: defense,
          id: counter.id,
          counterType: counter.counterType,
          description: counter.description,
          counterSquad: counter.counterSquad,
          video_url: counter.video_url,
          twOmicronRequired: counter.twOmicronRequired,
          twOmicronComment: counter.twOmicronComment
        };
        
        console.log('DefenseCard: Sending complete counter data:', completeCounter);
        await onEditCounter(completeCounter);
      }
    } catch (error) {
      console.error('Error in handleEditCounter:', error);
    }
  };

  const handleDeleteCounter = (e: React.MouseEvent, counterId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this counter?')) {
      onDeleteCounter(counterId);
    }
  };

  return (
<div className="bg-space-dark border border-white/10 rounded-lg p-4 relative">  
{/* Defense Header */}
      <div className="flex justify-between items-start mb-4 relative">
        <div className="flex-1">
          <h3 className="text-lg font-orbitron text-white">{defense.name}</h3>
          
          {/* Unit Images */}
          <div className="flex flex-wrap gap-2 mt-4">
            {'leader' in defense ? (
              // Squad preview
              <>
                {defense.leader && (
                  <UnitImage
                    id={defense.leader.id}
                    name={defense.leader.name}
                    type="squad-leader"
                    size="md"
                    isLeader
                  />
                )}
                {defense.characters.map((char) => (
                  <UnitImage
                    key={char.id}
                    id={char.id}
                    name={char.name}
                    type="squad-member"
                    size="md"
                  />
                ))}
              </>
            ) : (
              // Fleet preview
              <>
                {defense.capitalShip && (
                  <UnitImage
                    id={defense.capitalShip.id}
                    name={defense.capitalShip.name}
                    type="capital-ship"
                    size="md"
                    isCapital
                  />
                )}
                {defense.startingLineup.map((ship) => (
                  <UnitImage
                    key={ship.id}
                    id={ship.id}
                    name={ship.name}
                    type="ship"
                    size="md"
                  />
                ))}
              </>
            )}
          </div>
          
          {/* Alignment badge */}
          <div className="mt-2">
            <span className={`px-2 py-1 rounded-full text-xs ${
              defense.alignment === 'light'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-400/20'
                : 'bg-red-500/20 text-red-400 border border-red-400/20'
            }`}>
              {defense.alignment === 'light' ? 'Light Side' : 'Dark Side'}
            </span>
          </div>
        </div>

        {/* Admin Controls */}
{/* Admin Controls */}
{isAdmin && (
  <div className="absolute top-4 right-4 flex gap-2 z-50 bg-black/50 p-1 rounded-lg">
    <button
      onClick={handleEditDefense}
      className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg"
      aria-label="Edit defense"
    >
      <Edit className="w-4 h-4" />
    </button>
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this defense?')) {
          onDelete(defense);
        }
      }}
      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
      aria-label="Delete defense"
    >
      <Trash2 className="w-4 h-4" />
    </button>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onAddCounter(defense);
      }}
      className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg"
      aria-label="Add counter"
    >
      <Plus className="w-4 h-4" />
    </button>
  </div>
)}
      </div>

      {/* Counters Section */}
      <div className="mt-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full"
        >
          <span className="text-white">Counters ({counters.length})</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 space-y-4"
            >
              {counters.map((counter) => (
                <div
                  key={counter.id}
                  className="p-4 bg-white/5 rounded-lg border border-white/10"
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

                    {isAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => handleEditCounter(e, counter)}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg"
                          aria-label="Edit counter"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteCounter(e, counter.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="mt-2 text-white/70">{counter.description}</p>

                  {/* Counter Squad/Fleet Preview */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {counter.counterSquad && 'leader' in counter.counterSquad ? (
                      <>
                        {counter.counterSquad.leader && (
                          <UnitImage
                            id={counter.counterSquad.leader.id}
                            name={counter.counterSquad.leader.name}
                            type="squad-leader"
                            size="md"
                            isLeader
                          />
                        )}
                        {counter.counterSquad.characters?.map((char) => (
                          <UnitImage
                            key={char.id}
                            id={char.id}
                            name={char.name}
                            type="squad-member"
                            size="md"
                          />
                        ))}
                      </>
                    ) : (
                      <>
                        {counter.counterSquad.capitalShip && (
                          <UnitImage
                            id={counter.counterSquad.capitalShip.id}
                            name={counter.counterSquad.capitalShip.name}
                            type="capital-ship"
                            size="md"
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
                          />
                        ))}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DefenseCard;