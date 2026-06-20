import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { colorClashRounds, ColorClashRound, SignageCard } from "@/data/colorClashData";
import { Button } from "@/components/ui/button";

interface ColorClashGameProps {
  onScoreUpdate: (points: number) => void;
}

const CATEGORIES = [
  { id: "regulatory", label: "Regulatory", color: "bg-red-100 border-red-300" },
  { id: "warning", label: "Warning", color: "bg-yellow-100 border-yellow-300" },
  { id: "guide", label: "Guide", color: "bg-green-100 border-green-300" },
  { id: "blue", label: "Blue Signs", color: "bg-blue-100 border-blue-300" },
  { id: "brown", label: "Brown Signs", color: "bg-amber-100 border-amber-300" },
  { id: "orange", label: "Construction", color: "bg-orange-100 border-orange-300" },
];

export default function ColorClashGame({ onScoreUpdate }: ColorClashGameProps) {
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [roundComplete, setRoundComplete] = useState(false);
  const [roundScore, setRoundScore] = useState(0);

  const currentRound = colorClashRounds[currentRoundIndex];

  const handleCardDrop = (cardId: string, categoryId: string) => {
    const correctCategory = currentRound.correct_matches[cardId];
    const isCorrect = correctCategory === categoryId;

    setMatches(prev => ({
      ...prev,
      [cardId]: categoryId
    }));

    setFeedback(prev => ({
      ...prev,
      [cardId]: isCorrect ? "✓ Correct!" : "✗ Try again"
    }));

    if (isCorrect) {
      setRoundScore(prev => prev + 10);
      onScoreUpdate(10);
    }
  };

  const handleNextRound = () => {
    if (currentRoundIndex < colorClashRounds.length - 1) {
      setCurrentRoundIndex(prev => prev + 1);
      setMatches({});
      setFeedback({});
      setRoundComplete(false);
      setRoundScore(0);
    } else {
      setRoundComplete(true);
    }
  };

  const allMatched = Object.keys(matches).length === currentRound.cards.length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-primary mb-2">{currentRound.title}</h3>
        <p className="text-sm text-muted-foreground">{currentRound.description}</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentRound.cards.map(card => (
          <motion.div
            key={card.id}
            className="p-4 border-2 border-border rounded-lg bg-card hover:bg-accent/5 transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-sm font-medium text-primary mb-2">{card.sign_name}</div>
            <div className="text-xs text-muted-foreground mb-3 italic">{card.image_description}</div>
            {feedback[card.id] && (
              <div className={`text-xs font-bold mb-2 ${feedback[card.id].includes("✓") ? "text-green-600" : "text-red-600"}`}>
                {feedback[card.id]}
              </div>
            )}
            {!matches[card.id] && (
              <div className="text-xs text-muted-foreground">Drag to a category below</div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Category Dropzones */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-primary">Match to Categories:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CATEGORIES.map(category => (
            <motion.div
              key={category.id}
              className={`p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all ${category.color} min-h-24 flex items-center justify-center`}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                // For click-based matching
                const unmatchedCard = currentRound.cards.find(
                  c => !matches[c.id] && currentRound.correct_matches[c.id] === category.id
                );
                if (unmatchedCard) {
                  handleCardDrop(unmatchedCard.id, category.id);
                }
              }}
            >
              <div className="text-center">
                <div className="font-semibold text-sm">{category.label}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {Object.values(matches).filter(m => m === category.id).length} matched
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Matched Cards Display */}
      {Object.keys(matches).length > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-semibold text-green-800 mb-2">Matched Cards:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(matches).map(([cardId, categoryId]) => {
              const card = currentRound.cards.find(c => c.id === cardId);
              const category = CATEGORIES.find(c => c.id === categoryId);
              return (
                <div key={cardId} className="text-xs bg-white px-2 py-1 rounded border border-green-300">
                  {card?.sign_name} → {category?.label}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Round Score */}
      <div className="p-4 bg-accent/10 rounded-lg">
        <p className="text-sm font-semibold text-primary">Round Score: {roundScore} points</p>
      </div>

      {/* Next Button */}
      {allMatched && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={handleNextRound}
            className="w-full bg-accent hover:bg-accent/90"
          >
            {currentRoundIndex < colorClashRounds.length - 1 ? "Next Round" : "Complete Game"}
          </Button>
        </motion.div>
      )}

      {roundComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-6 bg-green-50 border-2 border-green-300 rounded-lg text-center"
        >
          <h3 className="text-lg font-bold text-green-800 mb-2">Color Clash Complete!</h3>
          <p className="text-sm text-green-700">Total Score: {roundScore} points</p>
        </motion.div>
      )}
    </div>
  );
}
