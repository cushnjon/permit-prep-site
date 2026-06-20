import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { rightOfWayScenarios, Scenario } from "@/data/rightOfWayData";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface RightOfWayGameProps {
  onScoreUpdate: (points: number) => void;
}

export default function RightOfWayGame({ onScoreUpdate }: RightOfWayGameProps) {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [scenarioComplete, setScenarioComplete] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [totalScore, setTotalScore] = useState(0);

  const currentScenario = rightOfWayScenarios[currentScenarioIndex];
  const selectedChoiceObj = selectedChoice
    ? currentScenario.choices.find(c => c.id === selectedChoice)
    : null;

  const handleChoiceClick = (choiceId: string) => {
    if (selectedChoice) return; // Prevent changing answer

    setSelectedChoice(choiceId);
    const choice = currentScenario.choices.find(c => c.id === choiceId);
    
    if (choice?.is_correct) {
      setTotalScore(prev => prev + choice.points);
      onScoreUpdate(choice.points);
    }

    setScenarioComplete(true);
  };

  const handleNextScenario = () => {
    if (currentScenarioIndex < rightOfWayScenarios.length - 1) {
      setCurrentScenarioIndex(prev => prev + 1);
      setSelectedChoice(null);
      setScenarioComplete(false);
    } else {
      setGameComplete(true);
    }
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
                Scenario {currentScenarioIndex + 1} of {rightOfWayScenarios.length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{currentScenario.description}</p>
          </div>

          {/* Scenario Details */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-accent/5 border border-accent/20 rounded-lg"
          >
            <p className="text-sm font-medium text-foreground mb-2">{currentScenario.situation}</p>
            <p className="text-xs text-muted-foreground italic">{currentScenario.image_description}</p>
          </motion.div>

          {/* Choices */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-primary">What should you do?</p>
            {currentScenario.choices.map((choice, index) => (
              <motion.button
                key={choice.id}
                onClick={() => handleChoiceClick(choice.id)}
                disabled={selectedChoice !== null}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                  selectedChoice === choice.id
                    ? choice.is_correct
                      ? "bg-green-50 border-green-400"
                      : "bg-red-50 border-red-400"
                    : selectedChoice
                    ? "bg-muted border-border opacity-50"
                    : "bg-card border-border hover:border-accent hover:bg-accent/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{choice.text}</p>
                  </div>
                  {selectedChoice === choice.id && (
                    <div className="flex-shrink-0 mt-0.5">
                      {choice.is_correct ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {selectedChoiceObj && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-lg border-2 ${
                  selectedChoiceObj.is_correct
                    ? "bg-green-50 border-green-300"
                    : "bg-red-50 border-red-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {selectedChoiceObj.is_correct ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${selectedChoiceObj.is_correct ? "text-green-800" : "text-red-800"}`}>
                      {selectedChoiceObj.is_correct ? "Correct!" : "Incorrect"}
                    </p>
                    <p className="text-sm text-foreground mt-1">{selectedChoiceObj.feedback}</p>
                    <p className={`text-xs font-medium mt-2 ${selectedChoiceObj.is_correct ? "text-green-700" : "text-red-700"}`}>
                      {selectedChoiceObj.is_correct ? `+${selectedChoiceObj.points} points` : "0 points"}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Learning Tip */}
          {scenarioComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <p className="text-xs font-semibold text-blue-900 mb-1">💡 Learning Tip</p>
              <p className="text-sm text-blue-800">{currentScenario.learning_tip}</p>
            </motion.div>
          )}

          {/* Next Button */}
          {scenarioComplete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button
                onClick={handleNextScenario}
                className="w-full bg-accent hover:bg-accent/90"
              >
                {currentScenarioIndex < rightOfWayScenarios.length - 1 ? "Next Scenario" : "Complete Game"}
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
            You've mastered {rightOfWayScenarios.length} critical driving scenarios.
          </p>
          <p className="text-lg font-bold text-green-800">Total Score: {totalScore} points</p>
        </motion.div>
      )}
    </div>
  );
}
