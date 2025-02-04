import React, { useState } from 'react';
import { Squad, Fleet, Counter, CounterInput } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useFirebase } from '@/contexts/FirebaseContext';
import { LoadingIndicator } from '../ui/LoadingIndicator';
import AdminLayout from './layouts/AdminLayout';
import { PermissionsManager } from './PermissionsManager';
import SquadManager from './SquadManager';
import FleetManager from './FleetManager';
import { NewDefenseModal } from './NewDefenseModal';

interface AdminDashboardProps {
  squads: Squad[];
  fleets: Fleet[];
  counters: Counter[];
  onUpdateSquad: (squad: Squad) => Promise<void>;
  onDeleteSquad: (id: string) => void;
  onUpdateFleet: (fleet: Fleet) => Promise<void>;
  onDeleteFleet: (id: string) => void;
  onAddCounter: (counterData: CounterInput) => Promise<void>;
  onUpdateCounter: (counter: Counter) => void;
  onDeleteCounter: (id: string) => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  squads,
  fleets,
  counters,
  onUpdateSquad,
  onDeleteSquad,
  onUpdateFleet,
  onDeleteFleet,
  onAddCounter,
  onUpdateCounter,
  onDeleteCounter,
  onLogout
}) => {
  const [currentTab, setCurrentTab] = useState('squads');
  const [showNewDefenseModal, setShowNewDefenseModal] = useState(false);
  const [newDefenseType, setNewDefenseType] = useState<'squad' | 'fleet' | null>(null);

  // Nya states för counter-hantering
  const [showCounterEditor, setShowCounterEditor] = useState(false);
  const [selectedDefense, setSelectedDefense] = useState<Squad | Fleet | null>(null);
  const [isFleet, setIsFleet] = useState(false);
  
  const { isAdmin } = useAuth();
  const { isLoading } = useFirebase();

  const handleAddNewDefense = (type: 'squad' | 'fleet') => {
    setNewDefenseType(type);
    setShowNewDefenseModal(true);
  };

  const handleCloseNewDefenseModal = () => {
    setShowNewDefenseModal(false);
    setNewDefenseType(null);
  };

  const handleNewDefenseSave = async (defense: Squad | Fleet) => {
    try {
      if ('characters' in defense) {
        await onUpdateSquad(defense as Squad);
      } else {
        await onUpdateFleet(defense as Fleet);
      }
      handleCloseNewDefenseModal();
    } catch (error) {
      console.error('Error saving defense:', error);
    }
  };

  const handleSquadAddCounter = async (squad: Squad) => {
    setSelectedDefense(squad);
    setIsFleet(false);
    setShowCounterEditor(true);
  };
  
  const handleFleetAddCounter = (fleet: Fleet) => {
    const counterData: CounterInput = {
      targetSquad: fleet,
      counterSquad: fleet,
      counterType: "hard",
      description: "",
      strategy: [],
      requirements: []
    };
    onAddCounter(counterData);
  };

  const handleCounterSave = async (counterData: Omit<Counter, "id">) => {
    try {
      await onAddCounter(counterData);
      setShowCounterEditor(false);
      setSelectedDefense(null);
    } catch (error) {
      console.error('Error saving counter:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-space-darker flex items-center justify-center">
        <LoadingIndicator size="lg" message="Loading admin dashboard..." />
      </div>
    );
  }

const renderContent = () => {
  switch (currentTab) {
    case 'squads':
      return (
        <SquadManager
          squads={squads}
          counters={counters}
          availableUnits={[]}
          onUpdate={onUpdateSquad}
          onDelete={onDeleteSquad}
          onAddCounter={handleSquadAddCounter}
          onEditCounter={onUpdateCounter}
          onDeleteCounter={onDeleteCounter}
        />
      );
    case 'fleets':
      return (
        <FleetManager
          fleets={fleets}
          counters={counters}
          availableUnits={[]}
          onUpdate={onUpdateFleet}
          onDelete={onDeleteFleet}
          onAddCounter={handleFleetAddCounter} // Now matches the new type
          onEditCounter={onUpdateCounter}
          onDeleteCounter={onDeleteCounter}
        />
    );
  }
};

  return (
    <>
      <AdminLayout
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onLogout={onLogout}
        onNewClick={() => handleAddNewDefense(currentTab === 'squads' ? 'squad' : 'fleet')}
      >
        {renderContent()}
      </AdminLayout>

      {showNewDefenseModal && newDefenseType && (
        <NewDefenseModal
          isOpen={showNewDefenseModal}
          onClose={handleCloseNewDefenseModal}
          onSave={handleNewDefenseSave}
          initialType={newDefenseType}
          availableUnits={[]} // Pass appropriate units here
        />
      )}
    </>
  );
};

export default AdminDashboard;