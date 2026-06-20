import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { rightOfWayRouletteScenarios, IntersectionScenario } from "@/data/rightOfWayRouletteData";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, XCircle, Zap } from "lucide-react";

interface IntersectionSimulatorProps {
  onScoreUpdate: (points: number) => void;
}

export default function IntersectionSimulator({ onScoreUpdate }: IntersectionSimulatorProps) {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedSequence, setSelectedSequence] = useState<string[]>([]);
  const [scenarioComplete, setScenarioComplete] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [crashOccurred, setCrashOccurred] = useState(false);

  const currentScenario = rightOfWayRouletteScenarios[currentScenarioIndex];
  const vehicleIds = Object.keys(currentScenario.setup);

  const handleVehicleClick = (vehicleId: string) => {
    if (scenarioComplete || crashOccurred) return;

    const newSequence = [...selectedSequence, vehicleId];
    setSelectedSequence(newSequence);

    // Check if this is the correct next vehicle
    if (newSequence[newSequence.length - 1] !== currentScenario.correct_sequence[newSequence.length - 1]) {
      setCrashOccurred(true);
      return;
    }

    // Check if sequence is complete
    if (newSequence.length === currentScenario.correct_sequence.length) {
      setTotalScore(prev => prev + currentScenario.points);
      onScoreUpdate(currentScenario.points);
      setScenarioComplete(true);
    }
  };

  const handleNextScenario = () => {
    if (currentScenarioIndex < rightOfWayRouletteScenarios.length - 1) {
      setCurrentScenarioIndex(prev => prev + 1);
      setSelectedSequence([]);
      setScenarioComplete(false);
      setCrashOccurred(false);
    } else {
      setGameComplete(true);
    }
  };

  const getVehicleIcon = (vehicleId: string) => {
    const vehicle = currentScenario.setup[vehicleId];
    if (vehicle.type === "emergency") return "🚨";
    if (vehicle.type === "pedestrian") return "🚶";
    return "🚗";
  };

  const getVehicleColor = (vehicleId: string) => {
    if (selectedSequence.includes(vehicleId)) {
      return "bg-green-100 border-green-400";
    }
    if (crashOccurred && vehicleId === selectedSequence[selectedSequence.length - 1]) {
      return "bg-red-100 border-red-400";
    }
    return "bg-card border-border hover:border-accent";
  };

  return (
    <div className="space-y-6">
      {!gameComplete ? (
        <>
          {/* Scenario Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-primary">{currentScenario.title}</h3>
              <span className="text-xs font-semibold text-accent">
                Scenario {currentScenarioIndex + 1} of {rightOfWayRouletteScenarios.length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{currentScenario.intersection_type}</p>
          </div>

          {/* Intersection Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-gradient-to-br from-accent/5 to-primary/5 border-2 border-dashed border-accent/30 rounded-lg"
          >
            <div className="text-center mb-4">
              <p className="text-sm font-semibold text-primary mb-2">Tap vehicles in the correct order:</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {currentScenario.correct_sequence.map((vehicleId, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span className="text-2xl">{getVehicleIcon(vehicleId)}</span>
                    {idx < currentScenario.correct_sequence.length - 1 && (
                      <span className="text-accent font-bold">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Intersection Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {vehicleIds.map((vehicleId) => {
                const vehicle = currentScenario.setup[vehicleId];
                const isSelected = selectedSequence.includes(vehicleId);
                const isCorrectNext =
                  vehicleId === currentScenario.correct_sequence[selectedSequence.length];

                return (
                  <motion.button
                    key={vehicleId}
                    onClick={() => handleVehicleClick(vehicleId)}
                    disabled={scenarioComplete || crashOccurred || isSelected}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 border-2 rounded-lg transition-all ${getVehicleColor(vehicleId)} ${
                      isCorrectNext && !crashOccurred ? "ring-2 ring-accent ring-offset-2" : ""
                    } ${isSelected || crashOccurred ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="text-3xl mb-2">{getVehicleIcon(vehicleId)}</div>
                    <p className="text-xs font-bold text-foreground">{vehicleId.toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">{vehicle.position}</p>
                    <p className="text-xs text-muted-foreground">{vehicle.action}</p>
                  </motion.button>
                );
              })}
            </div>

            {/* Current Sequence Display */}
            <div className="p-3 bg-card border border-border rounded-lg">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Your sequence:</p>
              <div className="flex gap-2 flex-wrap">
                {selectedSequence.length > 0 ? (
                  selectedSequence.map((vehicleId, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1 bg-accent/20 border border-accent rounded text-sm font-semibold text-accent"
                    >
                      {getVehicleIcon(vehicleId)} {vehicleId}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">Tap a vehicle to start...</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Crash Feedback */}
          <AnimatePresence>
            {crashOccurred && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-lg border-2 border-red-300 bg-red-50"
              >
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-800 mb-2">CRASH!</p>
                    <p className="text-sm text-red-700">{currentScenario.crash_fail_text}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rule Explanation */}
          {scenarioComplete && !crashOccurred && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-green-800 mb-2">Correct!</p>
                  <p className="text-sm text-green-700">{currentScenario.rule_explanation}</p>
                  <p className="text-sm font-semibold text-green-800 mt-2">+{currentScenario.points} points</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Next Button */}
          {(scenarioComplete || crashOccurred) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button
                onClick={handleNextScenario}
                className="w-full bg-accent hover:bg-accent/90"
              >
                {currentScenarioIndex < rightOfWayRouletteScenarios.length - 1
                  ? "Next Scenario"
                  : "Complete Game"}
              </Button>
            </motion.div>
          )}
        </>
      ) : (
        /* Game Complete Screen */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-green-50 border-2 border-green-300 rounded-lg text-center"
        >
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-green-800 mb-2">Right-of-Way Roulette Complete!</h3>
          <p className="text-sm text-green-700 mb-4">
            You've mastered {rightOfWayRouletteScenarios.length} critical intersection scenarios.
          </p>
          <p className="text-lg font-bold text-green-800">Total Score: {totalScore} points</p>
        </motion.div>
      )}
    </div>
  );
}
