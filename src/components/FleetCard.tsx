import { memo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ChevronDown, Plus, Edit } from "lucide-react";
import { Fleet, Counter } from "@/types";
import { GlassCard } from "./ui/GlassCard";
import { UnitImage } from "./ui/UnitImage";
import { VideoIndicator } from "./ui/VideoIndicator";
import { ErrorBoundary } from "react-error-boundary";

interface FleetCardProps {
  fleet: Fleet;
  isSelected: boolean;
  onSelect: () => void;
  counters: Counter[];
  isAdmin?: boolean;
  onEdit?: (fleet: Fleet) => void;
  onDelete?: (fleet: Fleet) => void;
  onDeleteCounter?: (id: string) => void;
  onViewDetails?: () => void;
  isFiltered?: boolean;
  onAddCounter?: (fleet: Fleet) => void;
  onEditCounter?: (counter: Counter) => void;
}

export const FleetCard = memo<FleetCardProps>(
  ({
    fleet,
    isSelected,
    onSelect,
    counters,
    isAdmin,
    onEdit,
    onDelete,
    onDeleteCounter,
    onEditCounter,
    isFiltered = false,
    onAddCounter,
  }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    // Animation variants
    const overlayVariants = {
      initial: { opacity: 0 },
      animate: {
        opacity: 1,
        transition: { duration: 0.3 },
      },
      exit: {
        opacity: 0,
        transition: { duration: 0.2 },
      },
    };

    const cardVariants = {
      initial: { scale: 0.95, opacity: 0 },
      animate: {
        scale: 1,
        opacity: 1,
        transition: {
          duration: 0.3,
          type: "spring",
          stiffness: 300,
          damping: 25,
        },
      },
      exit: {
        scale: 0.95,
        opacity: 0,
        transition: { duration: 0.2 },
      },
    };

    const handleFleetSelect = useCallback(() => {
      if (!isSelected) {
        onSelect();
      }
    }, [isSelected, onSelect]);

    const handleEditFleet = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit?.(fleet);
      },
      [onEdit, fleet]
    );

    const handleDeleteFleet = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this fleet?")) {
          onDelete?.(fleet);
        }
      },
      [onDelete, fleet]
    );

    const handleAddFleetCounter = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onAddCounter?.(fleet);
      },
      [onAddCounter, fleet]
    );

    const handleEditFleetCounter = useCallback(
      (e: React.MouseEvent, counter: Counter) => {
        e.stopPropagation();
        if (onEditCounter) {
          onEditCounter(counter);
        }
      },
      [onEditCounter]
    );

    const handleClickOutside = (e: React.MouseEvent | React.TouchEvent) => {
      const contentElement = contentRef.current;
      const target = e.target as Node;

      if (contentElement && !contentElement.contains(target)) {
        onSelect();
      }
    };

    const handleEditCounter = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>, counter: Counter) => {
        console.log("FleetCard: Edit button clicked for counter:", counter);
        e.preventDefault();
        e.stopPropagation();

        try {
          console.log("Attempting to edit counter:", counter);
          if (onEditCounter) {
            onEditCounter(counter);
            console.log("Successfully called onEditCounter");
          } else {
            console.warn("onEditCounter is undefined");
          }
        } catch (error) {
          console.error("Error in handleEditCounter:", error);
        }
      },
      [onEditCounter]
    );

    const fleetCounters = counters.filter((counter) => {
      const isTargetFleet = counter.targetSquad.id === fleet.id;
      const isCounterFleet = counter.counterSquad.id === fleet.id;
      const isTargetCapitalShip =
        "capitalShip" in counter.targetSquad &&
        counter.targetSquad.capitalShip?.id === fleet.id;
      return isTargetFleet || isCounterFleet || isTargetCapitalShip;
    });

    // useEffect(() => {
    //   console.log('FleetCard received props:', {
    //     isAdmin,
    //     hasEditCounter: Boolean(onEditCounter),
    //     hasDeleteCounter: Boolean(onDeleteCounter)
    //   });
    // }, [isAdmin, onEditCounter, onDeleteCounter]);

    // const cardTitle = (
    //   <h2 className="text-xl font-orbitron text-white">
    //     {fleet.name}
    //   </h2>
    // );

    // const sectionHeadings = (
    //   <>
    //     <h3 className="text-lg font-bold text-white/80 mb-3">Squad Leader</h3>
    //     <h3 className="text-lg font-bold text-white/80 mb-3">Squad Members</h3>
    //     <h3 className="text-lg font-bold text-white/80 mb-3">Requirements</h3>
    //     <h3 className="text-lg font-bold text-white/80">Counters</h3>
    //   </>
    // );

    return (
      <ErrorBoundary
        fallback={
          <GlassCard variant="dark" className="p-4">
            <div className="text-red-400">Error loading fleet card</div>
          </GlassCard>
        }
      >
        <div className={`relative ${isSelected ? "z-50" : "z-0"}`}>
          <motion.div layout onClick={handleFleetSelect} className="w-full">
            <GlassCard
              variant="dark"
              glowColor={fleet.alignment === "light" ? "blue" : "red"}
              isInteractive={!isSelected}
              className={`transition-all duration-300 cursor-pointer ${
                isFiltered ? "opacity-100" : "opacity-50"
              }`}
            >
              <div className="relative p-4">
                {/* Header section */}
                <div className="flex flex-col gap-2 mb-4">
                  {/* Rad 1: Squad namn */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-orbitron text-white">
                        {fleet.name}
                      </h2>
                    </div>
                    <motion.div
                      animate={{ rotate: isSelected ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </div>

                  {/* Rad 2: Admin Controls */}
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleEditFleet}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleDeleteFleet}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {onAddCounter && (
                        <button
                          onClick={handleAddFleetCounter}
                          className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-colors"
                          aria-label="Add counter"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                  {/* Rad 3: Badges */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs ${
                        fleet.alignment === "light"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-400/20"
                          : "bg-red-500/20 text-red-400 border border-red-400/20"
                      }`}
                    >
                      {fleet.alignment === "light" ? "Light Side" : "Dark Side"}
                    </span>
                  </div>
                </div>
                {/* Fleet preview */}
                <div className="flex flex-wrap items-center gap-2">
                  {fleet.capitalShip && (
                    <div className="relative group">
                      <UnitImage
                        id={fleet.capitalShip.id}
                        name={fleet.capitalShip.name}
                        type="capital-ship"
                        size="md"
                        className="rounded-full border-2 border-blue-400/50"
                        isCapital
                      />
                    </div>
                  )}
                  {fleet.startingLineup.map((ship) => (
                    <UnitImage
                      key={ship.id}
                      id={ship.id}
                      name={ship.name}
                      type="ship"
                      size="md"
                      className="rounded-full border-2 border-white/20"
                    />
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <AnimatePresence>
            {isSelected && (
              <div className="fixed inset-0 z-50" onClick={handleClickOutside}>
                <motion.div
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                  variants={overlayVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                />
                <motion.div
                  className="fixed inset-0 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <div
                    ref={contentRef}
                    className="w-full max-w-xl mx-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GlassCard
                      variant="dark"
                      glowColor={fleet.alignment === "light" ? "blue" : "red"}
                      className="min-h-[50vh] max-h-[90vh] overflow-hidden"
                    >
                      {/* Content wrapper */}
                      <div className="p-6 overflow-y-auto max-h-[calc(80vh-3rem)] custom-scrollbar">
                        {/* Capital Ship */}
                        <div className="mb-6">
                          <h3 className="text-sm font-bold text-white/80 mb-3">
                            Capital Ship
                          </h3>
                          {fleet.capitalShip && (
                            <div className="flex items-center gap-3">
                              <UnitImage
                                id={fleet.capitalShip.id}
                                name={fleet.capitalShip.name}
                                type="capital-ship"
                                size="md"
                                className="rounded-full border-2 border-blue-400/50"
                                isCapital
                              />
                              <div>
                                <div className="text-white font-medium">
                                  {fleet.capitalShip.name}
                                </div>
                                <div className="text-white/60 text-sm">
                                  Capital Ship
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Starting Lineup */}
                        <div className="mb-6">
                          <h3 className="text-sm font-bold text-white/80 mb-3">
                            Starting Lineup
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            {fleet.startingLineup.map((ship) => (
                              <div
                                key={ship.id}
                                className="flex items-center gap-3"
                              >
                                <UnitImage
                                  id={ship.id}
                                  name={ship.name}
                                  type="ship"
                                  size="md"
                                  className="rounded-full border-2 border-white/20"
                                />
                                <div>
                                  <div className="text-white font-medium">
                                    {ship.name}
                                  </div>
                                  <div className="text-white/60 text-sm">
                                    Starting Ship
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Reinforcements */}
                        {fleet.reinforcements.length > 0 && (
                          <div className="mb-6">
                            <h3 className="text-sm font-bold text-white/80 mb-3">
                              Reinforcements
                            </h3>
                            {fleet.reinforcements.map((ship, index) => (
                              <div
                                key={ship.id}
                                className="flex items-center gap-3"
                              >
                                <div className="relative">
                                  <UnitImage
                                    id={ship.id}
                                    name={ship.name}
                                    type="ship"
                                    size="md"
                                    className="rounded-full border-2 border-white/20"
                                  />
                                  <div className="absolute -top-1 -left-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                                    {index + 1}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-white font-medium">
                                    {ship.name}
                                  </div>
                                  <div className="text-white/60 text-sm">
                                    Reinforcement {index + 1}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Call Order */}
                        {fleet.callOrder && (
                          <div
                            className={`rounded-lg border p-4 mb-6 ${
                              fleet.alignment === "light"
                                ? "bg-blue-500/10 border-blue-500/20"
                                : "bg-red-500/10 border-red-500/20"
                            }`}
                          >
                            <h3
                              className={`text-sm font-medium mb-1 ${
                                fleet.alignment === "light"
                                  ? "text-blue-400"
                                  : "text-red-400"
                              }`}
                            >
                              Call Order
                            </h3>
                            <p className="text-sm text-white/70">
                              {fleet.callOrder}
                            </p>
                          </div>
                        )}

                        {/* Counters */}
                        {fleetCounters.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium text-white">
                              Counters
                            </h3>
                            <div className="space-y-3">
                              {fleetCounters.map((counter) => (
                                <div
                                  key={counter.id}
                                  className={`rounded-lg p-4 space-y-3 border transition-all duration-200 ${
                                    fleet.alignment === "light"
                                      ? "border-blue-400/20 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-400/30"
                                      : "border-red-400/20 bg-red-500/10 hover:bg-red-500/20 hover:border-red-400/30"
                                  }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`px-2 py-1 rounded-full text-xs ${
                                          counter.counterType === "hard"
                                            ? "bg-green-500/20 text-green-400"
                                            : counter.counterType === "soft"
                                            ? "bg-yellow-500/20 text-yellow-400"
                                            : "bg-red-500/20 text-red-400"
                                        }`}
                                      >
                                        {counter.counterType
                                          .charAt(0)
                                          .toUpperCase() +
                                          counter.counterType.slice(1)}
                                      </span>
                                      {counter.video_url && (
                                        <VideoIndicator
                                          videoUrl={counter.video_url}
                                        />
                                      )}
                                    </div>

                                    {isAdmin && (
                                      <div className="flex gap-2">
                                        <button
                                          onClick={(e) =>
                                            handleEditFleetCounter(e, counter)
                                          }
                                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg"
                                          aria-label="Edit counter"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </button>
                                        {onDeleteCounter && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onDeleteCounter(counter.id);
                                            }}
                                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-white/70">
                                    {counter.description}
                                  </p>

                                  {"capitalShip" in counter.counterSquad && (
                                    <div className="flex flex-col space-y-4">
                                      {/* Capital Ship Section */}
                                      <div>
                                        <h4 className="text-sm text-white/60 mb-2">
                                          Capital Ship
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-2">
                                          {counter.counterSquad.capitalShip && (
                                            <UnitImage
                                              id={
                                                counter.counterSquad.capitalShip
                                                  .id
                                              }
                                              name={
                                                counter.counterSquad.capitalShip
                                                  .name
                                              }
                                              type="capital-ship"
                                              size="md"
                                              className="border-2 border-blue-400"
                                              isCapital
                                            />
                                          )}
                                        </div>
                                      </div>

                                      {/* Starting Lineup Section */}
                                      <div>
                                        <h4 className="text-sm text-white/60 mb-2">
                                          Starting Lineup
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-2">
                                          {counter.counterSquad.startingLineup.map(
                                            (ship) => (
                                              <UnitImage
                                                key={ship.id}
                                                id={ship.id}
                                                name={ship.name}
                                                type="ship"
                                                size="md"
                                                className="border-2 border-white/20"
                                              />
                                            )
                                          )}
                                        </div>
                                      </div>

                                      {/* Reinforcements Section */}
                                      {counter.counterSquad.reinforcements &&
                                        counter.counterSquad.reinforcements
                                          .length > 0 && (
                                          <div>
                                            <h4 className="text-sm text-white/60 mb-2">
                                              Reinforcements
                                            </h4>
                                            <div className="flex flex-wrap items-center gap-2">
                                              {counter.counterSquad.reinforcements.map(
                                                (ship) => (
                                                  <UnitImage
                                                    key={ship.id}
                                                    id={ship.id}
                                                    name={ship.name}
                                                    type="ship"
                                                    size="md"
                                                    className="border-2 border-white/20"
                                                  />
                                                )
                                              )}
                                            </div>
                                          </div>
                                        )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </ErrorBoundary>
    );
  }
);

FleetCard.displayName = "FleetCard";

export default FleetCard;
