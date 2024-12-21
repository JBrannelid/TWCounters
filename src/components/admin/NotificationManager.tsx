import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';

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
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-sans
              ${notification.type === 'success' 
                ? 'bg-green-500/10 text-green-400 border border-green-400/20' 
                : 'bg-red-500/10 text-red-400 border border-red-400/20'
              }`}
            onClick={() => onDismiss(notification.id)}
          >
            {notification.type === 'success' ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            {notification.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}; 