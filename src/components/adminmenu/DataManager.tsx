import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Upload, RefreshCw, Database, AlertTriangle } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { LoadingIndicator } from '../ui/LoadingIndicator';
import { useFirebase } from '@/contexts/FirebaseContext';

export const DataManager: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { isOnline } = useFirebase();

  const handleExportData = async () => {
    if (!isOnline) {
      setError('Cannot export data while offline');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // upcoming logic for exporting data  
      setSuccess('Data exported successfully');
    } catch (err) {
      setError('Failed to export data');
      console.error('Export error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportData = async () => {
    if (!isOnline) {
      setError('Cannot import data while offline');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // upcoming logic for importing data
      setSuccess('Data imported successfully');
    } catch (err) {
      setError('Failed to import data');
      console.error('Import error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!isOnline) {
      setError('Cannot reset data while offline');
      return;
    }

    if (!window.confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // upcoming logic for resetting data
      setSuccess('Data reset successfully');
    } catch (err) {
      setError('Failed to reset data');
      console.error('Reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-orbitron text-white mb-6">Data Management</h2>

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
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              disabled={!isOnline || isLoading}
              className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg 
                       hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export
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
              disabled={!isOnline || isLoading}
              className="w-full mt-4 px-4 py-2 bg-green-500 text-white rounded-lg 
                       hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import
            </button>
          </div>
        </GlassCard>

        {/* Reset Data */}
        <GlassCard variant="dark" className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-red-500/20">
              <RefreshCw className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-white">Reset Data</h3>
            <p className="text-white/60 text-sm">
              Reset all data to default state. This action cannot be undone.
            </p>
            <button
              onClick={handleReset}
              disabled={!isOnline || isLoading}
              className="w-full mt-4 px-4 py-2 bg-red-500 text-white rounded-lg 
                       hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
        </GlassCard>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <LoadingIndicator size="lg" message="Processing..." />
        </div>
      )}
    </div>
  );
};

export default DataManager;