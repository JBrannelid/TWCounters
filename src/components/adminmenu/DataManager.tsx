import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Download, 
  Upload, 
  RefreshCw, 
  AlertTriangle,
  Shield as ShieldIcon, 
  KeyRound,
  CheckCircle
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { FirebaseService } from '@/services/firebaseService';
import { LoadingIndicator } from '../ui/LoadingIndicator';
import { useFirebase } from '@/contexts/FirebaseContext';
import { useAuth } from '@/contexts/AuthContext';

export const DataManager: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { isOnline } = useFirebase();
  const { isMasterAdmin } = useAuth();

  // If user is not a master admin, show access denied message and return to prevent further rendering
  if (!isMasterAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-space-darker p-4">
        <div className="max-w-md w-full">
          <GlassCard variant="dark" className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-red-500/20">
                <KeyRound className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-medium text-white">Access Denied</h3>
              <p className="text-white/60">
                This section is only accessible to master administrators.
              </p>
              <ShieldIcon className="w-16 h-16 text-blue-400/20" />
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  const handleExportData = async () => {
    if (!isOnline) {
      setError('Cannot export data while offline');
      return;
    }

    try {
      setIsSyncing(true);
      setError(null);
      
      // fetch all data from Firebase and wait for it to complete
      const data = await FirebaseService.syncAllData();
      
      // create a JSON file from the data
      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // create a link element and click it to download the file
      const link = document.createElement('a');
      link.href = url;
      link.download = `swgoh_tw_backup_${new Date().toISOString()}.json`;
      document.body.appendChild(link);
      link.click();
      
      // clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess('Data exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export data');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportData = async () => {
    if (!isOnline) {
      setError('Cannot import data while offline');
      return;
    }

    try {
      setIsSyncing(true);
      setError(null);

      // create an input element to select a file from the user's device
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        try {
          const reader = new FileReader();
          reader.onload = async (event) => {
            try {
              const jsonData = JSON.parse(event.target?.result as string);
              
              // validate the JSON data
              if (!jsonData.squads || !jsonData.fleets || !jsonData.counters) {
                throw new Error('Invalid backup file format');
              }

              // import the data to Firebase
              const importPromises = [
                ...jsonData.squads.map((squad: any) => 
                  FirebaseService.addOrUpdateSquad(squad)
                ),
                ...jsonData.fleets.map((fleet: any) => 
                  FirebaseService.addOrUpdateFleet(fleet)
                ),
                ...jsonData.counters.map((counter: any) => 
                  FirebaseService.addOrUpdateCounter(counter)
                )
              ];

              await Promise.all(importPromises);
              setSuccess('Data imported successfully');
            } catch (parseError) {
              console.error('Parse error:', parseError);
              setError('Invalid backup file format');
            }
          };
          reader.readAsText(file);
        } catch (fileError) {
          console.error('File read error:', fileError);
          setError('Failed to read backup file');
        }
      };

      input.click();
    } catch (err) {
      console.error('Import error:', err);
      setError('Failed to import data');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-orbitron text-white">Data Management</h2>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm">
          <ShieldIcon className="w-4 h-4" />
          Master Admin Access
        </div>
      </div>

      {!isOnline && (
        <Alert>
          <AlertTitle>Offline Mode</AlertTitle>
          <AlertDescription>
            You are currently offline. Data management operations are not available.
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
        {/* Export Data */}
        <GlassCard variant="dark" className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-blue-500/20">
              <Download className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-white">Export Data</h3>
            <p className="text-white/60 text-sm">
              Download a backup of all your data in JSON format
            </p>
            <button
              onClick={handleExportData}
              disabled={!isOnline || isSyncing}
              className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg 
                       hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSyncing ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </GlassCard>

        {/* Import Data */}
        <GlassCard variant="dark" className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-green-500/20">
              <Upload className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-lg font-medium text-white">Import Data</h3>
            <p className="text-white/60 text-sm">
              Import data from a previously exported backup file
            </p>
            <button
              onClick={handleImportData}
              disabled={!isOnline || isSyncing}
              className="w-full mt-4 px-4 py-2 bg-green-500 text-white rounded-lg 
                       hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSyncing ? 'Importing...' : 'Import'}
            </button>
          </div>
        </GlassCard>

        {/* Reset Data (inactivate) */}
        <GlassCard variant="dark" className="p-6 opacity-50 cursor-not-allowed">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-red-500/20">
              <RefreshCw className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-white">Reset Data</h3>
            <p className="text-white/60 text-sm">
              This function is currently disabled
            </p>
            <button
              disabled={true}
              className="w-full mt-4 px-4 py-2 bg-red-500/50 text-white rounded-lg 
                       opacity-50 cursor-not-allowed"
            >
              Reset
            </button>
          </div>
        </GlassCard>
      </div>

      {isSyncing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <LoadingIndicator size="lg" message="Processing..." />
        </div>
      )}
    </div>
  );
};

export default DataManager;
