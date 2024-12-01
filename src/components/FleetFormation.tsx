import React from 'react';
import { Fleet, Ship } from '@/types';
import { UnitImage } from './ui/UnitImage';
import { AlertTriangle } from 'lucide-react';

interface FleetFormationProps {
  fleet: Fleet;
  showWarnings?: boolean;
}

export const FleetFormation: React.FC<FleetFormationProps> = ({ fleet, showWarnings = false }) => {
  const capitalShipElement = fleet.capitalShip ? (
    <div className="relative">
      <UnitImage
        id={fleet.capitalShip.id}
        name={fleet.capitalShip.name}
        type="capital-ship"
        size="lg"
      />
    </div>
  ) : null;

  return (
    <div className="space-y-4">
      {/* Capital Ship */}
      <div className="border-b border-blue-500/20 pb-2">
        <div className="relative group">
          {capitalShipElement}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 
                       bg-black/90 px-2 py-1 rounded text-xs text-white whitespace-nowrap 
                       opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
            {fleet.capitalShip?.name}
          </div>
        </div>
      </div>

      {/* Starting Lineup */}
      <div>
        <h4 className="text-sm font-medium text-white/60 mb-2">Starting Lineup</h4>
        <div className="grid grid-cols-3 gap-2">
          {fleet.startingLineup.map((ship) => (
            <div key={ship.id} className="relative group">
              <UnitImage
                id={ship.id}
                name={ship.name}
                type="ship"
                size="md"
                className="border border-white/10"
              />
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 
                           bg-black/90 px-2 py-1 rounded text-xs text-white whitespace-nowrap 
                           opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                {ship.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reinforcements */}
      <div>
        <h4 className="text-sm font-medium text-white/60 mb-2">Reinforcements</h4>
        <div className="grid grid-cols-4 gap-2">
          {fleet.reinforcements.map((ship: Ship) => (
            <div key={ship.id} className="relative group">
              <div className="relative">
                <UnitImage
                  id={ship.id}
                  name={ship.name}
                  type="ship"
                  size="md"
                  className="border border-white/10"
                />
                {ship.callOrder && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full 
                               flex items-center justify-center text-white text-xs font-bold">
                    {ship.callOrder}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 
                           bg-black/90 px-2 py-1 rounded text-xs text-white whitespace-nowrap 
                           opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                {ship.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call Order Strategy */}
      {fleet.callOrder && (
        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <h4 className="text-sm font-medium text-blue-400 mb-1">Call Order</h4>
          <p className="text-sm text-white/70">{fleet.callOrder}</p>
        </div>
      )}

      {/* Warnings */}
      {showWarnings && fleet.warnings && fleet.warnings.length > 0 && (
        <div className="space-y-2 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <h4 className="text-sm font-medium text-yellow-400 mb-1">Warnings</h4>
          {fleet.warnings.map((warning: string, index: number) => (
            <div key={index} className="flex items-start gap-2 text-sm text-white/70">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};