import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cloud, RefreshCw, Clock, AlertTriangle,
  Download, Upload, CheckCircle 
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { FirebaseSync } from '@/services/firebaseSync';
import { LoadingIndicator } from '../ui/LoadingIndicator';

export const SyncManager: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncHistory, setSyncHistory] = useState<Array<{
    date: Date;
    success: boolean;
    details?: string;
  }>>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    // Load last sync time from localStorage or server
    const lastSyncTime = localStorage.getItem('lastSyncTime');
    if (lastSyncTime) {
      setLastSync(new Date(lastSyncTime));
    }

    // upcoming logic for loading sync history
    loadSyncHistory();
  }, []);

  const loadSyncHistory = async () => {
    // upcoming logic for loading sync history
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);

    try {
      await FirebaseSync.syncAll();
      
      const now = new Date();
      setLastSync(now);
      localStorage.setItem('lastSyncTime', now.toISOString());
      
      setSyncHistory(prev => [{
        date: now,
        success: true
      }, ...prev].slice(0, 10)); // Keep last 10 records

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sync failed';
      setError(errorMessage);
      setSyncHistory(prev => [{
        date: new Date(),
        success: false,
        details: errorMessage
      }, ...prev].slice(0, 10));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBackup = async () => {
     // upcoming logic for backup
  };

  const handleRestore = async () => {
    // upcoming logic restore
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-orbitron text-white flex items-center gap-2">
          <Cloud className="w-6 h-6" />
          Sync Management
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sync Status Card */}
        <GlassCard variant="darker" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-white">Current Status</h3>
            {lastSync && (
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Clock className="w-4 h-4" />
                Last sync: {lastSync.toLocaleString()}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 
                       bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>

            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 
                       bg-white/5 text-white rounded-lg hover:bg-white/10"
            >
              <Clock className="w-4 h-4" />
              View Sync History
            </button>
          </div>
        </GlassCard>

        {/* Backup & Restore Card */}
        <GlassCard variant="darker" className="p-6">
          <h3 className="text-lg font-medium text-white mb-6">Backup & Restore</h3>

          <div className="space-y-4">
            <button
              onClick={handleBackup}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 
                       bg-white/5 text-white rounded-lg hover:bg-white/10"
            >
              <Download className="w-4 h-4" />
              Create Backup
            </button>

            <button
              onClick={handleRestore}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 
                       bg-white/5 text-white rounded-lg hover:bg-white/10"
            >
              <Upload className="w-4 h-4" />
              Restore from Backup
            </button>
          </div>
        </GlassCard>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Sync Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Sync History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 
                     flex items-center justify-center p-4"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-space-darker p-6 rounded-lg max-w-2xl w-full 
                       border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-medium text-white mb-6">Sync History</h3>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {syncHistory.map((record, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      record.success
                        ? 'bg-green-500/10 border-green-500/20'
                        : 'bg-red-500/10 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {record.success ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        )}
                        <span className={`text-sm ${
                          record.success ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {record.success ? 'Sync Successful' : 'Sync Failed'}
                        </span>
                      </div>
                      <span className="text-sm text-white/60">
                        {record.date.toLocaleString()}
                      </span>
                    </div>
                    {record.details && (
                      <p className="mt-2 text-sm text-white/60">
                        {record.details}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowHistory(false)}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg 
                           hover:bg-white/20"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SyncManager;