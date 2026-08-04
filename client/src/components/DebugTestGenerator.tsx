import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLocation } from "wouter";

export function DebugTestGenerator() {
  const [, setLocation] = useLocation();
  const [pin, setPin] = useState("8677");
  const [correctAnswers, setCorrectAnswers] = useState(99);
  const [totalQuestions, setTotalQuestions] = useState<50 | 100>(100);
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Generate test data directly
      const selectedAnswers: Record<number, string> = {};
      for (let i = 0; i < correctAnswers; i++) {
        selectedAnswers[i] = 'a';
      }

      const selectedQuestions = Array.from({ length: totalQuestions }, (_, i) => ({
        id: `Q_CERT_${i + 1}`,
        prompt: `Debug Question ${i + 1}`,
        a: `Option A`,
        b: `Option B`,
        c: `Option C`,
        d: `Option D`,
        correct_answer: i < correctAnswers ? 'a' : 'b',
      }));

      const testState = {
        mode: "testing",
        questionCount: totalQuestions,
        currentQuestionIndex: correctAnswers,
        score: correctAnswers,
        selectedAnswers,
        userName: "",
        savePin: pin,
      };

      const progressData = {
        testState,
        selectedQuestions,
        timestamp: new Date().toISOString(),
      };

      // Save to localStorage
      localStorage.setItem(
        `test_progress_${pin}`,
        JSON.stringify(progressData)
      );
      toast.success(`✅ Debug data saved with PIN: ${pin}`);
      toast.info("Use 'Open Saved Progress' button to load it");
    } catch (error) {
      toast.error("Failed to generate debug data");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 px-3 py-1 text-xs bg-purple-600 text-white rounded-full hover:bg-purple-700 opacity-50 hover:opacity-100 transition-opacity"
        data-debug-toggle
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-purple-600 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-purple-600">Debug Test Generator</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-semibold text-gray-700">PIN</label>
          <Input
            type="text"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700">
            Correct Answers (0-{totalQuestions})
          </label>
          <Input
            type="number"
            value={correctAnswers}
            onChange={(e) =>
              setCorrectAnswers(Math.min(totalQuestions, parseInt(e.target.value) || 0))
            }
            min="0"
            max={totalQuestions}
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700">
            Total Questions
          </label>
          <div className="flex gap-2 mt-1">
            <Button
              onClick={() => setTotalQuestions(50)}
              variant={totalQuestions === 50 ? "default" : "outline"}
              className="flex-1"
            >
              50
            </Button>
            <Button
              onClick={() => setTotalQuestions(100)}
              variant={totalQuestions === 100 ? "default" : "outline"}
              className="flex-1"
            >
              100
            </Button>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          className="w-full bg-purple-600 hover:bg-purple-700"
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate & Save"}
        </Button>

        <Button
          onClick={() => setLocation("/crossword")}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          🎮 Play Crossword
        </Button>

        <p className="text-xs text-gray-600 bg-purple-50 p-2 rounded">
          This will save test progress to localStorage. Use "Open Saved Progress" to load it.
        </p>
      </div>
    </div>
  );
}
