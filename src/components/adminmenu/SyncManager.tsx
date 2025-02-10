import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cloud, RefreshCw, Clock, AlertTriangle,
  CheckCircle, Database 
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { FirebaseService } from '@/services/firebaseService';
import { LoadingIndicator } from '../ui/LoadingIndicator';
import { useFirebase } from '@/contexts/FirebaseContext';

export const SyncManager: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [syncStats, setSyncStats] = useState({
    squads: 0,
    fleets: 0,
    counters: 0,
    lastUpdated: null as Date | null
  });
  const { isOnline } = useFirebase();

  // Load initial sync stats
  useEffect(() => {
    const loadSyncStats = async () => {
      try {
        const data = await FirebaseService.syncAllData();
        setSyncStats({
          squads: data.squads.length,
          fleets: data.fleets.length,
          counters: data.counters.length,
          lastUpdated: new Date()
        });
      } catch (error) {
        console.error('Error loading sync stats:', error);
      }
    };

    loadSyncStats();
  }, []);

  // Sync Now functionality
  const handleSync = async () => {
    if (!isOnline) {
      setError('Cannot sync while offline');
      return;
    }

    setIsSyncing(true);
    setError(null);
    try {
      // Force sync all data from Firebase
      const data = await FirebaseService.syncAllData();
      
      // Update sync statistics
      setSyncStats({
        squads: data.squads.length,
        fleets: data.fleets.length,
        counters: data.counters.length,
        lastUpdated: new Date()
      });

      setLastSync(new Date());
      setSuccess('Sync completed successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-orbitron text-white">Sync Management</h2>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm">
          <Database className="w-4 h-4" />
           Protected Level: Admin Access
        </div>
      </div>

      {!isOnline && (
        <Alert>
          <AlertTitle>Offline Mode</AlertTitle>
          <AlertDescription>
            You are currently offline. Sync operations are not available.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="w-4 h-4 text-green-400" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Status Card */}
        <GlassCard variant="dark" className="p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Current Status</h3>
              {lastSync && (
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Clock className="w-4 h-4" />
                  Last sync: {lastSync.toLocaleString()}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-sm text-white/60">Squads</div>
                <div className="text-xl font-medium text-white">{syncStats.squads}</div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-sm text-white/60">Fleets</div>
                <div className="text-xl font-medium text-white">{syncStats.fleets}</div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-sm text-white/60">Counters</div>
                <div className="text-xl font-medium text-white">{syncStats.counters}</div>
              </div>
            </div>

            <button
              onClick={handleSync}
              disabled={!isOnline || isSyncing}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 
                       bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </GlassCard>

        {/* Sync Status Card */}
        <GlassCard variant="dark" className="p-6">
          <div className="flex flex-col space-y-4">
            <h3 className="text-lg font-medium text-white">Real-time Status</h3>
            
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
              <div>
                <div className="font-medium text-white">
                  {isOnline ? 'Connected' : 'Offline'}
                </div>
                <div className="text-sm text-white/60">
                  {isOnline 
                    ? 'Real-time sync is active' 
                    : 'Waiting for connection...'}
                </div>
              </div>
            </div>

            {syncStats.lastUpdated && (
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-sm text-white/60">Last Updated</div>
                <div className="text-white">
                  {syncStats.lastUpdated.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {isSyncing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <LoadingIndicator size="lg" message="Syncing data..." />
        </div>
      )}
    </div>
  );
};