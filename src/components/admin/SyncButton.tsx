import React, { useState, useEffect } from 'react';
import { FirebaseSync } from '@/services/firebaseSync';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

export const SyncButton: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Reset knappens utseende efter feedback
  useEffect(() => {
    let feedbackTimer: NodeJS.Timeout;
    if (showFeedback) {
      feedbackTimer = setTimeout(() => {
        setShowFeedback(false);
      }, 4000);
    }
    return () => {
      if (feedbackTimer) clearTimeout(feedbackTimer);
    };
  }, [showFeedback]);

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    setSuccess(false);
    setShowFeedback(false);
  
    try {
      // Kör båda promises samtidigt utan att spara resultatet
      await Promise.all([
        FirebaseSync.syncAll(),
        new Promise(resolve => setTimeout(resolve, 2000)) // Garanterad minimisynktid
      ]);
  
      setSuccess(true);
      // Visa success-feedback i 4 sekunder
      setTimeout(() => {
        setShowFeedback(true);
        setSuccess(true);
        // Återställ efter 4 sekunder
        setTimeout(() => {
          setSuccess(false);
          setShowFeedback(false);
        }, 4000);
      }, 100); // Kort delay för att säkerställa att animationen syns
  
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod vid synkronisering');
      // Visa error-feedback i 4 sekunder
      setTimeout(() => {
        setShowFeedback(true);
        // Återställ efter 4 sekunder
        setTimeout(() => {
          setError(null);
          setShowFeedback(false);
        }, 4000);
      }, 100);
    } finally {
      setIsSyncing(false);
    }
  };
  // Funktion för att bestämma knappens styling
  const getButtonStyles = () => {
    if (isSyncing) return 'bg-gray-500 cursor-not-allowed';
    if (showFeedback) {
      if (success) return 'bg-green-500 hover:bg-green-600';
      if (error) return 'bg-red-500 hover:bg-red-600';
    }
    return 'bg-blue-500 hover:bg-blue-600';
  };

  return (
    <div className="relative">
      <motion.button
        onClick={handleSync}
        disabled={isSyncing}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getButtonStyles()} 
                   text-white transition-all duration-300`}
        animate={{
          scale: isSyncing ? 0.98 : 1,
        }}
      >
        <RefreshCw 
          className={`w-4 h-4 transition-transform ${isSyncing ? 'animate-spin' : ''}`}
        />
        {isSyncing ? 'Syncing...' : 'Sync Data'}
      </motion.button>

      <AnimatePresence>
        {(error || success) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full mt-2 right-0 min-w-[200px]"
          >
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="bg-green-500/10 border-green-500/20 text-green-400">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>Data synced successfully!</AlertDescription>
              </Alert>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};