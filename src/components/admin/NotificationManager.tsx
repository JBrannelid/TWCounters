import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, X } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

interface Notification {
  id: string;
  type: 'success' | 'error';
  message: string;
}

interface NotificationManagerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  notifications,
  onDismiss
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className="pointer-events-auto"
          >
            <GlassCard
              variant="dark"
              glowColor={notification.type === 'success' ? 'blue' : 'red'}
              className={`
                flex items-center gap-2 p-4 
                ${notification.type === 'success' 
                  ? 'border-blue-400/20' 
                  : 'border-red-400/20'}
              `}
            >
              <div className={`
                rounded-full p-1
                ${notification.type === 'success' 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'bg-red-500/20 text-red-400'}
              `}>
                {notification.type === 'success' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
              </div>

              <span className={`flex-1 text-sm ${
                notification.type === 'success' ? 'text-blue-400' : 'text-red-400'
              }`}>
                {notification.message}
              </span>

              <button
                onClick={() => onDismiss(notification.id)}
                className={`p-1 rounded-lg transition-colors ${
                  notification.type === 'success'
                    ? 'text-blue-400/60 hover:text-blue-400 hover:bg-blue-400/10'
                    : 'text-red-400/60 hover:text-red-400 hover:bg-red-400/10'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </GlassCard>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};