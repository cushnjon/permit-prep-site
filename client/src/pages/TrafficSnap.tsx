import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { trafficSnapData } from "@/data/trafficSnapData";

// Cinematic pan keyframes: moves the 125%-zoomed image around in a slow loop
// We cycle through 5 pan positions over ~12 seconds
const PAN_POSITIONS = [
  { x: 0, y: 0 },
  { x: 8, y: -6 },
  { x: -8, y: 6 },
  { x: 6, y: 8 },
  { x: -6, y: -8 },
  { x: 0, y: 0 },
];

export function CinematicSignImage({
  src,
  alt,
  isAnswered,
}: {
  src: string;
  alt: string;
  isAnswered: boolean;
}) {
  const [panIndex, setPanIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Advance pan position every 2.4 seconds while not answered
  useEffect(() => {
    if (isAnswered) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setPanIndex((prev) => (prev + 1) % PAN_POSITIONS.length);
    }, 2400);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAnswered]);

  // Reset pan when sign changes
  useEffect(() => {
    setPanIndex(0);
  }, [src]);

  const pos = PAN_POSITIONS[panIndex];

  return (
    // Widescreen container — 16:9 aspect ratio, clips the zoomed image
    <div
      className="relative w-full overflow-hidden rounded-xl bg-gray-900"
      style={{ aspectRatio: "16 / 7" }}
    >
      {/* Full-size image clipped by container, then zoomed + panned inside */}
      <img
        src={src}
        alt={alt}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          // 125% zoom + pan offset — smooth transition between positions
          transform: isAnswered
            ? "scale(1) translate(0, 0)"
            : `scale(1.25) translate(${pos.x * 2}px, ${pos.y * 2}px)`,
          transition: isAnswered
            ? "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)"
            : "transform 2.4s cubic-bezier(0.45, 0, 0.55, 1)",
          willChange: "transform",
        }}
      />

      {/* Subtle vignette overlay for cinematic feel */}
      {!isAnswered && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.35) 100%)",
          }}
        />
      )}

      {/* "Live" badge while panning */}
      {!isAnswered && (
        <span className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-full tracking-widest uppercase">
          Identify
        </span>
      )}
    </div>
  );
}

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
  const progressPercentage = (totalAnswered / totalSigns) * 100;

  const generateMultipleChoice = (correctName: string) => {
    const allSigns = trafficSnapData.flatMap((z) => z.signs);
    const otherSigns = allSigns
      .filter((s) => s.name !== correctName)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    return [
      { text: correctName, isCorrect: true },
      ...otherSigns.map((s) => ({ text: s.name, isCorrect: false })),
    ].sort(() => Math.random() - 0.5);
  };

  const [choices, setChoices] = useState(() =>
    generateMultipleChoice(currentSign.name)
  );

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
    setTimeout(() => setShowQuestion(true), 350);
  };

  const handleAnswerSelect = (choice: { text: string; isCorrect: boolean }) => {
    if (answered) return;
    setSelectedAnswer(choice.text);
    setAnswered(true);
    setTotalAnswered((t) => t + 1);
    if (choice.isCorrect) {
      setScore((s) => s + 10);
      setCorrectAnswers((c) => c + 1);
    }
  };

  const handleNext = () => {
    if (currentSignIndex < currentZone.signs.length - 1) {
      setCurrentSignIndex((i) => i + 1);
    } else if (currentZoneIndex < trafficSnapData.length - 1) {
      setCurrentZoneIndex((z) => z + 1);
      setCurrentSignIndex(0);
    } else {
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
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-3xl font-bold text-green-700">
            Traffic Snap: Sign &amp; Shape
          </h1>
          <div className="flex items-center gap-4 text-lg font-semibold">
            <span className="text-blue-700">Score: {score}</span>
            <span className="text-green-700">
              Progress: {Math.round(progressPercentage)}%
            </span>
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
              <h2 className="text-xl font-bold text-green-700 mb-2">
                {currentZone.zone}
              </h2>
              <p className="text-sm text-gray-700 mb-4">
                {currentZone.description}
              </p>
              <div className="text-sm font-semibold text-blue-700">
                Sign {currentSignIndex + 1} of {currentZone.signs.length}
              </div>
            </Card>
          </div>

          {/* Center: Game Area */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* ── SHAPE SWIPE PHASE ── */}
            {showShape && !showSign && (
              <Card className="overflow-hidden bg-white border-2 border-blue-300">
                <h3 className="text-lg font-semibold text-gray-700 mb-3 px-6 pt-6">
                  Swipe to reveal the sign shape
                </h3>
                {/* Widescreen container for shape image */}
                <div className="px-6 pb-4">
                  <CinematicSignImage
                    src={currentSign.shapeImage}
                    alt={currentSign.shape}
                    isAnswered={false}
                  />
                </div>
                <div className="px-6 pb-6 text-center">
                  <Button
                    onClick={handleShapeSwipe}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold"
                  >
                    <ChevronRight className="mr-2" /> Swipe to Reveal
                  </Button>
                </div>
              </Card>
            )}

            {/* ── SIGN + QUESTION PHASE ── */}
            {showSign && (
              <Card className="overflow-hidden bg-white border-2 border-green-300">
                {/* Widescreen cinematic image — always visible once sign is shown */}
                <CinematicSignImage
                  src={currentSign.signImage}
                  alt={currentSign.name}
                  isAnswered={answered}
                />

                {/* Shape label strip */}
                <div className="px-6 pt-3 pb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    {currentSign.shape} shape
                  </span>
                </div>

                {/* Question + choices */}
                {showQuestion && (
                  <div className="px-6 pb-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      What is this sign?
                    </h3>

                    <div className="space-y-3 mb-4">
                      {choices.map((choice, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAnswerSelect(choice)}
                          disabled={answered}
                          className={[
                            "w-full py-3 px-4 text-left font-semibold rounded-lg border transition-all duration-150",
                            !answered
                              ? "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300 active:scale-[0.98]"
                              : selectedAnswer === choice.text
                              ? choice.isCorrect
                                ? "bg-green-500 text-white border-green-600"
                                : "bg-red-500 text-white border-red-600"
                              : choice.isCorrect
                              ? "bg-green-500 text-white border-green-600"
                              : "bg-gray-100 text-gray-500 border-gray-200",
                          ].join(" ")}
                        >
                          {choice.text}
                        </button>
                      ))}
                    </div>

                    {/* Feedback panel */}
                    {answered && (
                      <div
                        className={`p-4 rounded-lg mb-4 border-2 ${
                          isCorrect
                            ? "bg-green-50 border-green-400"
                            : "bg-red-50 border-red-400"
                        }`}
                      >
                        <p
                          className={`font-bold text-base mb-1 ${
                            isCorrect ? "text-green-700" : "text-red-700"
                          }`}
                        >
                          {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
                        </p>
                        <p className="text-sm text-gray-700 mb-1">
                          <strong>Description:</strong>{" "}
                          {currentSign.description}
                        </p>
                        <p className="text-sm text-gray-700">
                          <strong>Real-World Application:</strong>{" "}
                          {currentSign.realWorldApplication}
                        </p>
                      </div>
                    )}

                    {answered && (
                      <div className="flex justify-center">
                        <Button
                          onClick={handleNext}
                          className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg font-semibold"
                        >
                          Next <ChevronRight className="ml-2" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="mt-8 flex justify-between items-center">
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
