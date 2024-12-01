import React from 'react';
import { Squad, Fleet, Counter } from '@/types';
import { UnitImage } from '../ui/UnitImage';
import { Edit, Trash2, Video } from 'lucide-react';
import { motion } from 'framer-motion';

interface CounterListProps {
  counters: Counter[];
  targetDefense: Squad | Fleet;
  onEdit: (counter: Counter) => void;
  onDelete: (id: string) => void;
}

export const CounterList: React.FC<CounterListProps> = ({
  counters,
  targetDefense,
  onEdit,
  onDelete
}) => {
  const handleEdit = async (counter: Counter) => {
    try {
      if (onEdit) {
        await onEdit(counter);
      }
    } catch (error) {
      console.error('Error editing counter:', error);
    }
  };

  const handleDelete = async (counterId: string) => {
    try {
      if (onDelete) {
        await onDelete(counterId);
      }
    } catch (error) {
      console.error('Error deleting counter:', error);
    }
  };

  if (counters.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      <h4 className="text-sm font-medium text-white/60">
        Counters for {targetDefense.name}
      </h4>
      <div className="space-y-3">
        {counters
          .filter(counter => counter.targetSquad.id === targetDefense.id)
          .map((counter) => (
            <motion.div
              key={counter.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 bg-white/5 rounded-lg space-y-4"
            >
              {/* Header with badges and actions */}
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

                  {counter.video_url && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400">
                      <Video className="w-3 h-3" />
                      Video
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(counter)}
                    className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(counter.id)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-white/70">{counter.description}</p>

              {/* Mod Requirements */}
              {counter.requirements?.length > 0 && (
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <h4 className="text-sm font-medium text-blue-400 mb-2">Mod Requirements</h4>
                  {counter.requirements
                    .filter(req => req.type === 'mods')
                    .map((req, idx) => (
                      <div key={idx} className="text-sm text-white/70">
                        {req.description}
                      </div>
                    ))}
                </div>
              )}

              {/* Counter Squad/Fleet Preview */}
              {'leader' in counter.counterSquad ? (
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
              ) : (
                <div className="flex items-center gap-2">
                  {counter.counterSquad.capitalShip && (
                    <UnitImage
                      id={counter.counterSquad.capitalShip.id}
                      name={counter.counterSquad.capitalShip.name}
                      type="capital-ship"
                      size="sm"
                      className="border-2 border-blue-400"
                    />
                  )}
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
                </div>
              )}
            </motion.div>
          ))}
      </div>
    </div>
  );
};