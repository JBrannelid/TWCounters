import React from 'react';
import { motion } from 'framer-motion';
import { X, Clock, Calendar } from 'lucide-react';
import { Squad, Fleet } from '@/types';

interface MetadataViewProps {
  isOpen: boolean;
  onClose: () => void;
  data: Squad | Fleet;
}

export const MetadataView: React.FC<MetadataViewProps> = ({
  isOpen,
  onClose,
  data
}) => {
  if (!isOpen) return null;

  const formatDate = (timestamp: number | string | undefined) => {
    try {
      if (!timestamp) return 'Not available';
  
      // Om det är ett nummer (timestamp i millisekunder)
      if (typeof timestamp === 'number') {
        return new Date(timestamp).toLocaleString();
      }
  
      // Om det är en ISO-sträng, konvertera till datum
      if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleString();
      }
  
      // Om timestamp inte är definierad eller i fel format
      return 'Not available';
    } catch (error) {
      console.log('Date formatting error:', error, typeof timestamp);
      return 'Not available';
    }
  };  

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-space-darker w-full max-w-xs rounded-lg border border-white/10 m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Stängknapp */}
        <button
          onClick={onClose}
          className="absolute right-2 top-2 p-1 text-white/60 hover:text-white hover:bg-white/5 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-4 space-y-3">
          <h2 className="text-xl font-orbitron text-white mb-4">Metadata</h2>
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-white/5 rounded-lg">
              <div className="text-xs font-titillium text-white/40">Name</div>
              <div className="text-sm font-titillium text-white">{data.name}</div>
            </div>
            <div className="p-2 bg-white/5 rounded-lg">
              <div className="text-xs text-white/40">Type</div>
              <div className="text-sm text-white capitalize">{data.type}</div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
            <Calendar className="w-4 h-4 text-white/40" />
            <div>
              <div className="text-xs text-white/40">Created</div>
              <div className="text-sm text-white">
                {formatDate(data.createdAt)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
            <Clock className="w-4 h-4 text-white/40" />
            <div>
              <div className="text-xs text-white/40">Last Updated</div>
              <div className="text-sm text-white">
                {formatDate(data.lastUpdated)}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};