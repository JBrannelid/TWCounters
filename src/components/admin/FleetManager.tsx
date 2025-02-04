import React, { useState } from 'react';
import { Fleet, Counter, Ship, CounterInput } from '@/types';
import { useFirebase } from '@/contexts/FirebaseContext';
import { LoadingIndicator } from '../ui/LoadingIndicator';
import FleetEditor from './FleetEditor';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { AlertTriangle } from 'lucide-react';
import { normalizeId } from '@/lib/imageMapping';

interface FleetManagerProps {
  fleets: Fleet[];
  counters: Counter[];
  availableUnits: Ship[];
  onUpdate: (fleet: Fleet) => Promise<void>;
  onDelete: (id: string) => void;
  onAddCounter: (fleet: Fleet) => void;  // Changed from CounterInput to Fleet
  onEditCounter: (counter: Counter) => void;
  onDeleteCounter: (id: string) => void;
}

export const FleetManager: React.FC<FleetManagerProps> = ({
  fleets,
  counters,
  availableUnits,
  onUpdate,
  onDelete,
  onAddCounter,
  onEditCounter,
  onDeleteCounter
}) => {
  const { isOnline, isLoading } = useFirebase();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAddCounter = async (fleet: Fleet) => {
    if (!isOnline) {
      setError("Cannot add counter while offline");
      return;
    }
  
    try {
      setSaving(true);
      onAddCounter(fleet); // Simply pass the fleet through
      setError(null);
    } catch (error) {
      console.error("Error adding counter:", error);
      setError(error instanceof Error ? error.message : "Failed to add counter");
    } finally {
      setSaving(false);
    }
  };
  

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingIndicator size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!isOnline && (
        <Alert>
          <AlertTitle>Offline Mode</AlertTitle>
          <AlertDescription>
            You are currently offline. Changes will be saved when you reconnect.
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

      <FleetEditor
        fleets={fleets}
        counters={counters}
        availableUnits={availableUnits}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onAddCounter={handleAddCounter}
        onEditCounter={onEditCounter}
        onDeleteCounter={onDeleteCounter}
        isOnline={isOnline}
        saving={saving}
      />
    </div>
  );
};

export default FleetManager;