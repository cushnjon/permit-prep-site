import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trafficSnapData } from "@/data/trafficSnapData";

// Cinematic Sign Image Component for Text Drive
export function CinematicSignImage({
  src,
  alt,
  isAnswered,
}: {
  src: string;
  alt: string;
  isAnswered: boolean;
}) {
  const [panPosition, setPanPosition] = useState(0);
  const [panDirections] = useState(() => {
    return Array(5).fill(0).map(() => Math.random() > 0.5 ? 1 : -1);
  });

  const basePanValues = [0, 20, 20, 15, 15];
  const panPositions = basePanValues.map((val, idx) => idx === 0 ? 0 : val * panDirections[idx]);
  const panDuration = 36000;
  const intervalDuration = panDuration / panPositions.length;

  useEffect(() => {
    if (isAnswered) return;
    const interval = setInterval(() => {
      setPanPosition((prev) => (prev + 1) % panPositions.length);
    }, intervalDuration);
    return () => clearInterval(interval);
  }, [isAnswered, intervalDuration]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-black/5">
      <div className="relative w-full" style={{ aspectRatio: "16 / 7" }}>
        <motion.img
          src={src}
          alt={alt}
          className="absolute w-full h-full object-cover"
          animate={{
            x: isAnswered ? 0 : panPositions[panPosition],
            scale: isAnswered ? 1 : 1.35,
          }}
          transition={{
            duration: isAnswered ? 0.6 : intervalDuration / 1000,
            ease: isAnswered ? "easeOut" : "linear",
          }}
        />
        {!isAnswered && (
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 pointer-events-none" />
        )}
        {!isAnswered && (
          <div className="absolute top-4 right-4 bg-white/90 text-slate-900 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
            IDENTIFY
          </div>
        )}
      </div>
    </div>
  );
}

// All traffic signs
const ALL_SIGNS = trafficSnapData.flatMap((zone) => zone.signs);

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type GameMode = "normal" | "blur-zoom";

export default function TrafficSnap() {
  const [gameMode, setGameMode] = useState<GameMode>("normal");
  const [remainingSigns, setRemainingSigns] = useState(() => shuffleArray([...ALL_SIGNS]));
  const [answered, setAnswered] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [panX, setPanX] = useState(0);
  const [showDescription, setShowDescription] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<typeof ALL_SIGNS>([]);

  // Blur & Zoom mode state
  const [blurElapsed, setBlurElapsed] = useState(0);
  const blurTimerRef = useRef<number | null>(null);
  const blurStartRef = useRef<number>(0);
  
  // Language toggle
  const [showSpanish, setShowSpanish] = useState(false);

  const currentSign = remainingSigns[0];
  const totalAnswered = 18 - remainingSigns.length;

  // Build 3 card options: 1 correct + 2 random wrong answers
  const cardOptions = useMemo(() => {
    if (!currentSign) return [];
    const others = shuffleArray(ALL_SIGNS.filter((s) => s.id !== currentSign.id)).slice(0, 2);
    const options = shuffleArray([currentSign, ...others]);
    return options;
  }, [currentSign]);

  // Left-to-right pan animation for the sign tile
  useEffect(() => {
    if (answered || gameCompleted) return;
    setPanX(0);
    const start = Date.now();
    const duration = 8000;
    const maxPan = 30;

    const animate = () => {
      const elapsed = (Date.now() - start) % (duration * 2);
      const progress = elapsed < duration ? elapsed / duration : 2 - elapsed / duration;
      setPanX((progress - 0.5) * maxPan * 2);
      frameRef.current = requestAnimationFrame(animate);
    };

    const frameRef = { current: 0 as number };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [answered, gameCompleted]);

  // Blur & Zoom timer — runs from 0 to 30 seconds
  useEffect(() => {
    if (gameMode !== "blur-zoom" || answered || gameCompleted) {
      if (blurTimerRef.current) cancelAnimationFrame(blurTimerRef.current);
      return;
    }
    blurStartRef.current = Date.now();
    setBlurElapsed(0);

    const tick = () => {
      const elapsed = (Date.now() - blurStartRef.current) / 1000;
      const clamped = Math.min(elapsed, 30);
      setBlurElapsed(clamped);
      if (clamped < 30) {
        blurTimerRef.current = requestAnimationFrame(tick);
      }
    };
    blurTimerRef.current = requestAnimationFrame(tick);
    return () => {
      if (blurTimerRef.current) cancelAnimationFrame(blurTimerRef.current);
    };
  }, [gameMode, answered, gameCompleted]);

  // Smooth 3-2-1 countdown then immediate next question
  useEffect(() => {
    if (!answered || gameCompleted) return;

    const t3 = setTimeout(() => setCountdown(3), 3800);
    const t2 = setTimeout(() => setCountdown(2), 4800);
    const t1 = setTimeout(() => setCountdown(1), 5800);
    const tNext = setTimeout(() => {
      nextSign();
    }, 6800);

    return () => {
      clearTimeout(t3);
      clearTimeout(t2);
      clearTimeout(t1);
      clearTimeout(tNext);
    };
  }, [answered, gameCompleted]);

  // Show description card immediately on correct, after 1 sec on incorrect
  useEffect(() => {
    if (!answered) return;
    const delay = isCorrect ? 0 : 1000; // 1 second for incorrect
    const timer = setTimeout(() => setShowDescription(true), delay);
    return () => clearTimeout(timer);
  }, [answered, isCorrect]);

  // Calculate blur & zoom values from elapsed time (0-30s)
  const blurProgress = Math.min(blurElapsed / 30, 1);
  const currentZoom = gameMode === "blur-zoom" && !answered ? 1.5 - blurProgress * 0.5 : (answered ? 1 : 1.35);
  const currentBlur = gameMode === "blur-zoom" && !answered ? (1 - blurProgress) * 18 : 0;

  // Points for blur mode: 100 at t=0, 0 at t=30
  const getBlurPoints = () => Math.round(Math.max(0, 100 - (blurElapsed / 30) * 100));

  const handleCardClick = (cardIndex: number) => {
    if (answered) return;
    setSelectedCard(cardIndex);
    setAnswered(true);
    const correct = cardOptions[cardIndex].id === currentSign.id;
    setIsCorrect(correct);
    if (correct) {
      const pts = gameMode === "blur-zoom" ? getBlurPoints() : 1;
      setScore((prev) => prev + pts);
    }
  };

  const nextSign = () => {
    if (isCorrect) {
      // Remove correct sign from remaining
      const newRemaining = remainingSigns.slice(1);
      if (newRemaining.length === 0) {
        // All 18 signs completed!
        setGameCompleted(true);
        return;
      }
      setRemainingSigns(newRemaining);
    } else {
      // Move incorrect sign to end of queue
      const incorrectSign = remainingSigns[0];
      setWrongAnswers((prev) => {
        // Only add if not already in wrong answers
        if (!prev.find((s) => s.id === incorrectSign.id)) {
          return [...prev, incorrectSign];
        }
        return prev;
      });
      const newRemaining = [...remainingSigns.slice(1), remainingSigns[0]];
      setRemainingSigns(newRemaining);
    }

    setAnswered(false);
    setSelectedCard(null);
    setShowDescription(false);
    setIsCorrect(false);
    setCountdown(null);
    setBlurElapsed(0);
  };

  const getCardStyle = (cardIndex: number) => {
    if (!answered || selectedCard === null) return "from-slate-700 to-slate-900";
    const isThisCorrect = cardOptions[cardIndex].id === currentSign.id;
    const isSelected = selectedCard === cardIndex;
    if (isThisCorrect) return "from-green-500 to-green-700";
    if (isSelected && !isThisCorrect) return "from-red-500 to-red-700";
    return "from-slate-700 to-slate-900";
  };

  // Game completion screen
  if (gameCompleted) {
    const hasWrongAnswers = wrongAnswers.length > 0;
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl text-center">
          <h1 className={`text-5xl font-bold mb-4 ${hasWrongAnswers ? "text-yellow-600" : "text-green-600"}`}>
            {hasWrongAnswers ? "✓ Complete!" : "🎉 Perfect!"}
          </h1>
          <p className="text-3xl font-bold text-slate-900 mb-2">
            {hasWrongAnswers ? "Game Finished" : "All 18 Signs Mastered"}
          </p>
          <p className="text-xl text-slate-600 mb-8">Final Score: {score} points</p>
          
          {hasWrongAnswers && (
            <div className="mb-8 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg text-left">
              <p className="font-bold text-yellow-900 mb-4">Signs You Missed ({wrongAnswers.length}):</p>
              <div className="grid grid-cols-2 gap-4">
                {wrongAnswers.map((sign) => (
                  <div key={sign.id} className="p-4 bg-white rounded border border-yellow-200 flex flex-col items-center">
                    <img src={sign.signImage} alt={sign.name} className="h-24 object-contain mb-3" />
                    <p className="font-semibold text-slate-900 text-center">{sign.name}</p>
                    <p className="text-xs text-slate-600 mt-2 text-center">{sign.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <motion.button
            onClick={() => {
              setRemainingSigns(shuffleArray([...ALL_SIGNS]));
              setGameCompleted(false);
              setScore(0);
              setWrongAnswers([]);
              setAnswered(false);
              setSelectedCard(null);
              setShowDescription(false);
              setIsCorrect(false);
              setCountdown(null);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-green-600 text-white font-bold rounded-lg text-lg"
          >
            Play Again
          </motion.button>
        </div>
      </div>
    );
  }

  if (!currentSign) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6 flex flex-col items-center justify-center">
      {/* Header */}
      <div className="w-full max-w-2xl mb-8 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Traffic Snap</h1>
        <p className="text-slate-600 mb-4">Sign & Shape Recognition</p>
        <div className="flex justify-center items-center gap-4 mb-6">
          <span className="text-2xl font-bold text-green-600">Score: {score}</span>
          <span className="text-lg text-slate-600">{totalAnswered} / 18</span>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <div className="flex gap-1 bg-slate-200 rounded-full p-1 w-fit">
            <button
              onClick={() => { setGameMode("normal"); }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                gameMode === "normal"
                  ? "bg-white text-slate-900 shadow"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => { setGameMode("blur-zoom"); }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                gameMode === "blur-zoom"
                  ? "bg-slate-900 text-white shadow"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              🌫 Blur & Zoom
            </button>
            <motion.button
              onClick={() => setShowSpanish(!showSpanish)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all bg-yellow-100 hover:bg-yellow-200 text-yellow-900"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {showSpanish ? "English" : "Español"}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Blur Points Display */}
      {gameMode === "blur-zoom" && !answered && (
        <div className="mb-4 text-center">
          <p className="text-sm text-slate-600">Points Available: <span className="font-bold text-blue-600">{getBlurPoints()}</span></p>
          <div className="w-48 h-2 bg-slate-300 rounded-full mt-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-700"
              animate={{ width: `${(blurElapsed / 30) * 100}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      )}

      {/* Sign Tile or Description Card */}
      <div className="w-full max-w-2xl mb-8">
        <AnimatePresence mode="wait">
          {!showDescription ? (
            <motion.div
              key={`sign-${currentSign.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="relative mx-auto rounded-2xl shadow-xl overflow-hidden"
              style={{ width: "100%", aspectRatio: "1 / 1", maxWidth: 400 }}
            >
              <motion.img
                src={currentSign.signImage}
                alt={currentSign.name}
                className="w-full h-full object-cover"
                animate={{
                  x: panX,
                  scale: currentZoom,
                  filter: `blur(${currentBlur}px)`,
                }}
                transition={{ duration: 0.05, ease: "linear" }}
              />
              {/* Vignette */}
              {!answered && (
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30 pointer-events-none" />
              )}
              {/* Badge */}
              {!answered && (
                <div className="absolute top-4 right-4 bg-white/90 text-slate-900 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                  {gameMode === "blur-zoom" ? "BLUR MODE" : "IDENTIFY"}
                </div>
              )}
              {/* Zone badge */}
              <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold">
                {currentSign.zone}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`desc-${currentSign.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="relative mx-auto rounded-2xl shadow-xl bg-gradient-to-br from-blue-500 to-blue-700 p-8 text-white"
              style={{ width: "100%", aspectRatio: "1 / 1", maxWidth: 400 }}
            >
              {gameMode === "blur-zoom" && isCorrect && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="absolute top-4 right-4 bg-green-400 text-green-900 px-6 py-3 rounded-full text-4xl font-black shadow-lg"
                >
                  +{getBlurPoints()}
                </motion.div>
              )}
              <div className="h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-3xl font-bold">{showSpanish && currentSign.name_es ? currentSign.name_es : currentSign.name}</h2>
                    {(currentSign.name_es || currentSign.description_es) && (
                      <motion.button
                        onClick={() => setShowSpanish(!showSpanish)}
                        className="px-2 py-1 rounded text-xs bg-yellow-300 hover:bg-yellow-400 text-yellow-900 font-semibold transition-colors flex-shrink-0"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {showSpanish ? "English" : "Español"}
                      </motion.button>
                    )}
                  </div>
                  <p className="text-lg leading-relaxed">{showSpanish && currentSign.description_es ? currentSign.description_es : currentSign.description}</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold opacity-75 uppercase">Real-World Use</p>
                    <p className="text-sm leading-relaxed">{showSpanish && currentSign.realWorldApplication_es ? currentSign.realWorldApplication_es : currentSign.realWorldApplication}</p>
                  </div>
                  <motion.button
                    onClick={nextSign}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    Next →
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Three Answer Cards */}
      {!showDescription && (
        <div className="grid grid-cols-3 gap-4">
          {cardOptions.map((option, idx) => (
            <motion.button
              key={option.id + idx}
              onClick={() => handleCardClick(idx)}
              disabled={answered}
              whileHover={!answered ? { scale: 1.04, y: -4 } : {}}
              whileTap={!answered ? { scale: 0.97 } : {}}
              className={`relative h-28 rounded-xl bg-gradient-to-br ${getCardStyle(idx)} text-white font-bold text-sm p-4 flex flex-col items-center justify-center shadow-lg transition-all duration-300 cursor-pointer disabled:cursor-default`}
            >
              <span className="text-center leading-tight">{option.name}</span>
              {answered && option.id === currentSign.id && (
                <span className="text-xs mt-2 opacity-75">✓ Correct</span>
              )}
              {answered && selectedCard === idx && option.id !== currentSign.id && (
                <span className="text-xs mt-2 opacity-75">✗ Wrong</span>
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* 3-2-1 Countdown Overlay */}
      {countdown !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            key={countdown}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-9xl font-black text-red-600 drop-shadow-2xl"
          >
            {countdown}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
