import React from 'react';
import { Plus } from 'lucide-react';
import { Squad, Fleet } from '@/types';

interface CounterButtonProps {
  defense: Squad | Fleet;
  onAddCounter: (defense: Squad | Fleet) => void;
  disabled?: boolean;
}

export const CounterButton: React.FC<CounterButtonProps> = ({
  defense,
  onAddCounter,
  disabled = false
}) => {
  return (
    <button
      onClick={() => onAddCounter(defense)}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg 
                ${disabled 
                  ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed' 
                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'} 
                transition-colors`}
    >
      <Plus className="w-4 h-4" />
      Add Counter
    </button>
  );
};