import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { trafficSnapData, TrafficSign } from "@/data/trafficSnapData";

export default function TrafficSnap() {
  const [, setLocation] = useLocation();
  const [currentZoneIndex, setCurrentZoneIndex] = useState(0);
  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showShape, setShowShape] = useState(true);
  const [showSign, setShowSign] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  const currentZone = trafficSnapData[currentZoneIndex];
  const currentSign = currentZone.signs[currentSignIndex];
  const totalSigns = trafficSnapData.reduce((sum, z) => sum + z.signs.length, 0);
  const answeredSigns = totalAnswered;
  const progressPercentage = (answeredSigns / totalSigns) * 100;

  const generateMultipleChoice = (correctName: string) => {
    const allSigns = trafficSnapData.flatMap((z) => z.signs);
    const otherSigns = allSigns
      .filter((s) => s.name !== correctName)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const choices = [
      { text: correctName, isCorrect: true },
      ...otherSigns.map((s) => ({ text: s.name, isCorrect: false })),
    ].sort(() => Math.random() - 0.5);

    return choices;
  };

  const [choices, setChoices] = useState(generateMultipleChoice(currentSign.name));

  useEffect(() => {
    setChoices(generateMultipleChoice(currentSign.name));
    setAnswered(false);
    setSelectedAnswer(null);
    setShowShape(true);
    setShowSign(false);
    setShowQuestion(false);
  }, [currentSignIndex, currentZoneIndex]);

  const handleShapeSwipe = () => {
    setShowShape(false);
    setShowSign(true);
    setTimeout(() => setShowQuestion(true), 300);
  };

  const handleAnswerSelect = (choice: { text: string; isCorrect: boolean }) => {
    setSelectedAnswer(choice.text);
    setAnswered(true);
    setTotalAnswered(totalAnswered + 1);

    if (choice.isCorrect) {
      setScore(score + 10);
      setCorrectAnswers(correctAnswers + 1);
    }
  };

  const handleNext = () => {
    if (currentSignIndex < currentZone.signs.length - 1) {
      setCurrentSignIndex(currentSignIndex + 1);
    } else if (currentZoneIndex < trafficSnapData.length - 1) {
      setCurrentZoneIndex(currentZoneIndex + 1);
      setCurrentSignIndex(0);
    } else {
      // Game complete
      setLocation("/");
    }
  };

  const handleReset = () => {
    setCurrentZoneIndex(0);
    setCurrentSignIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setTotalAnswered(0);
    setAnswered(false);
    setSelectedAnswer(null);
    setShowShape(true);
    setShowSign(false);
    setShowQuestion(false);
  };

  const isCorrect = choices.find((c) => c.text === selectedAnswer)?.isCorrect;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-green-700">Traffic Snap: Sign & Shape</h1>
          <div className="flex items-center gap-4 text-lg font-semibold">
            <span className="text-blue-700">Score: {score}</span>
            <span className="text-green-700">Progress: {Math.round(progressPercentage)}%</span>
          </div>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Zone Info */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-white border-2 border-green-200">
              <h2 className="text-xl font-bold text-green-700 mb-2">{currentZone.zone}</h2>
              <p className="text-sm text-gray-700 mb-4">{currentZone.description}</p>
              <div className="text-sm font-semibold text-blue-700">
                Sign {currentSignIndex + 1} of {currentZone.signs.length}
              </div>
            </Card>
          </div>

          {/* Center: Game Area */}
          <div className="lg:col-span-2">
            {/* Shape Swipe */}
            {showShape && !showSign && (
              <Card className="p-8 bg-white border-2 border-blue-300 text-center">
                <h3 className="text-lg font-semibold text-gray-700 mb-6">Swipe to reveal the sign shape</h3>
                <div className="flex justify-center mb-6">
                  <img
                    src={currentSign.shapeImage}
                    alt={currentSign.shape}
                    className="h-40 w-40 object-contain"
                  />
                </div>
                <Button
                  onClick={handleShapeSwipe}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold"
                >
                  <ChevronRight className="mr-2" /> Swipe to Reveal
                </Button>
              </Card>
            )}

            {/* Sign Display */}
            {showSign && (
              <Card className="p-8 bg-white border-2 border-green-300 text-center">
                <h3 className="text-lg font-semibold text-gray-700 mb-6">This is a {currentSign.shape.toUpperCase()} sign</h3>
                <div className="flex justify-center mb-6">
                  <img
                    src={currentSign.signImage}
                    alt={currentSign.name}
                    className="h-48 w-48 object-contain"
                  />
                </div>
              </Card>
            )}

            {/* Question */}
            {showQuestion && (
              <Card className="p-8 bg-white border-2 border-green-400">
                <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">What is this sign?</h3>

                {/* Multiple Choice */}
                <div className="space-y-3 mb-6">
                  {choices.map((choice, idx) => (
                    <Button
                      key={idx}
                      onClick={() => !answered && handleAnswerSelect(choice)}
                      disabled={answered}
                      className={`w-full py-3 px-4 text-left font-semibold rounded-lg transition-all ${
                        !answered
                          ? "bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300"
                          : selectedAnswer === choice.text
                          ? choice.isCorrect
                            ? "bg-green-500 text-white border border-green-600"
                            : "bg-red-500 text-white border border-red-600"
                          : choice.isCorrect
                          ? "bg-green-500 text-white border border-green-600"
                          : "bg-gray-100 text-gray-800 border border-gray-300"
                      }`}
                    >
                      {choice.text}
                    </Button>
                  ))}
                </div>

                {/* Feedback */}
                {answered && (
                  <div className={`p-4 rounded-lg mb-6 ${isCorrect ? "bg-green-100 border-2 border-green-500" : "bg-red-100 border-2 border-red-500"}`}>
                    <p className={`font-semibold ${isCorrect ? "text-green-700" : "text-red-700"}`}>
                      {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
                    </p>
                    <p className="text-sm mt-2 text-gray-700">
                      <strong>Description:</strong> {currentSign.description}
                    </p>
                    <p className="text-sm mt-2 text-gray-700">
                      <strong>Real-World Application:</strong> {currentSign.realWorldApplication}
                    </p>
                  </div>
                )}

                {/* Navigation */}
                {answered && (
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={handleNext}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
                    >
                      Next <ChevronRight className="ml-2" />
                    </Button>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="mt-8 flex justify-between items-center max-w-4xl mx-auto">
          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            className="px-6 py-2 rounded-lg font-semibold"
          >
            <ChevronLeft className="mr-2" /> Back to Home
          </Button>
          <div className="text-sm font-semibold text-gray-700">
            Correct: {correctAnswers} / {totalAnswered}
          </div>
          <Button
            onClick={handleReset}
            variant="outline"
            className="px-6 py-2 rounded-lg font-semibold"
          >
            <RotateCcw className="mr-2" /> Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
