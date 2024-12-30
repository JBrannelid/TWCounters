import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Ship, RefreshCw } from 'lucide-react';
import { Fleet, Counter } from '@/types';
import { FleetCard } from './FleetCard';
import ErrorBoundary from './ErrorBoundary';

interface FleetListProps {
 fleets: Fleet[];
 filteredFleets: Fleet[];
 selectedFleetId: string | null;
 onSelectFleet: (id: string | null) => void;
 getCounters: (id: string) => Counter[];
 isAdmin?: boolean;
 onDeleteCounter?: (id: string) => void;
 onViewDetails?: () => void;
}

export const FleetList: React.FC<FleetListProps> = ({
 fleets,
 filteredFleets,
 selectedFleetId,
 onSelectFleet,
 getCounters,
 isAdmin,
 onDeleteCounter,
 onViewDetails
}) => {
 const handleFleetSelect = (fleetId: string) => {
   if (selectedFleetId === fleetId) {
     onSelectFleet(null);
   } else {
     onSelectFleet(fleetId);
   }
 };

 const handleOverlayClick = (e: React.MouseEvent) => {
   if (e.target === e.currentTarget) {
     onSelectFleet(null);
   }
 };

 if (!fleets || fleets.length === 0) {
   return (
     <div className="flex flex-col items-center justify-center py-12 text-white/60">
       <Ship className="w-12 h-12 mb-4 animate-float" />
       <p className="text-lg font-titillium">No fleets found</p>
     </div>
   );
 }

 return (
   <ErrorBoundary 
     fallback={
       <div className="flex flex-col items-center justify-center p-8">
         <div className="p-6 bg-red-500/10 rounded-lg border border-red-500/20 max-w-md w-full">
           <h3 className="text-lg font-medium text-red-400 mb-2">
             Failed to load fleets
           </h3>
           <p className="text-sm text-red-400/80 mb-4">
             Please try refreshing the page
           </p>
           <button
             onClick={() => window.location.reload()}
             className="flex items-center gap-2 px-4 py-2 rounded-lg 
                      bg-red-500/20 text-red-400 hover:bg-red-500/30"
           >
             <RefreshCw className="w-4 h-4" />
             Refresh
           </button>
         </div>
       </div>
     }
   >
     <div className="container mx-auto px-4">
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
         <AnimatePresence>
           {filteredFleets.map((fleet) => {
             const isSelected = selectedFleetId === fleet.id;
             
             return (
               <React.Fragment key={fleet.id}>
                 <motion.div
                   className="w-full max-w-md"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                 >
                   <FleetCard
                     fleet={fleet}
                     isSelected={false}
                     onSelect={() => handleFleetSelect(fleet.id)}
                     counters={getCounters(fleet.id)}
                     isFiltered={true}
                     isAdmin={isAdmin}
                     onDeleteCounter={onDeleteCounter}
                     onViewDetails={onViewDetails}
                   />
                 </motion.div>

                 {isSelected && (
                   <motion.div
                     className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     onClick={handleOverlayClick}
                   >
                     <motion.div
                       className="w-full max-w-2xl overflow-y-auto max-h-[90vh] rounded-lg"
                       initial={{ scale: 0.95, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       exit={{ scale: 0.95, opacity: 0 }}
                       onClick={(e) => e.stopPropagation()}
                     >
                       <FleetCard
                         fleet={fleet}
                         isSelected={true}
                         onSelect={() => handleFleetSelect(fleet.id)}
                         counters={getCounters(fleet.id)}
                         isFiltered={true}
                         isAdmin={isAdmin}
                         onDeleteCounter={onDeleteCounter}
                         onViewDetails={onViewDetails}
                       />
                     </motion.div>
                   </motion.div>
                 )}
               </React.Fragment>
             );
           })}
         </AnimatePresence>
       </div>
     </div>
   </ErrorBoundary>
 );
}