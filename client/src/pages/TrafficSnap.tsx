import { useState, useEffect, useMemo } from "react";
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
          <div className="absolute top-4 right-4 bg-white/90 text-slate-900 px-3 py-1 rounded-full text-xs font-semibold">
            IDENTIFY
          </div>
        )}
      </div>
    </div>
  );
}

// Flatten all signs from all zones
const ALL_SIGNS = trafficSnapData.flatMap((zone) => zone.signs);

// Shuffle array utility
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TrafficSnap() {
  const [shuffledSigns] = useState(() => shuffleArray(ALL_SIGNS));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [panX, setPanX] = useState(0);
  const [showDescription, setShowDescription] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);


  const currentSign = shuffledSigns[currentIndex % shuffledSigns.length];

  // Build 3 card options: 1 correct + 2 random wrong answers
  const cardOptions = useMemo(() => {
    const others = shuffleArray(ALL_SIGNS.filter((s) => s.id !== currentSign.id)).slice(0, 2);
    const options = shuffleArray([currentSign, ...others]);
    return options;
  }, [currentSign]);

  // Left-to-right pan animation for the sign tile
  useEffect(() => {
    if (answered) return;
    setPanX(0);
    const start = Date.now();
    const duration = 8000; // 8 seconds to pan across
    const maxPan = 30; // px

    const animate = () => {
      const elapsed = (Date.now() - start) % (duration * 2);
      const progress = elapsed < duration ? elapsed / duration : 2 - elapsed / duration;
      setPanX((progress - 0.5) * maxPan * 2);
      frameRef.current = requestAnimationFrame(animate);
    };

    const frameRef = { current: 0 as number };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [currentIndex, answered]);

  // Smooth 3-2-1 countdown then immediate next question
  useEffect(() => {
    if (!answered) return;

    // Show 3 at 3.8s, 2 at 4.8s, 1 at 5.8s, load next at 6.8s
    const t3 = setTimeout(() => setCountdown(3), 3800);
    const t2 = setTimeout(() => setCountdown(2), 4800);
    const t1 = setTimeout(() => setCountdown(1), 5800);
    const tNext = setTimeout(() => {
      setCountdown(null);
      nextSign();
    }, 6800);

    return () => {
      clearTimeout(t3);
      clearTimeout(t2);
      clearTimeout(t1);
      clearTimeout(tNext);
    };
  }, [answered]);

  // Show description card after 0 seconds (faster - immediately on correct)
  useEffect(() => {
    if (!answered || !isCorrect) return;

    const timer = setTimeout(() => {
      setShowDescription(true);
    }, 0);

    return () => clearTimeout(timer);
  }, [answered, isCorrect]);

  const handleCardClick = (cardIndex: number) => {
    if (answered) return;
    setSelectedCard(cardIndex);
    setAnswered(true);
    const correct = cardOptions[cardIndex].id === currentSign.id;
    setIsCorrect(correct);
    if (correct) {
      setScore((prev) => prev + 1);
    }
  };

  const nextSign = () => {
    setCurrentIndex((prev) => (prev + 1) % shuffledSigns.length);
    setAnswered(false);
    setSelectedCard(null);
    setShowDescription(false);
    setIsCorrect(false);
    setCountdown(null); // Reset countdown
  };



  const getCardStyle = (cardIndex: number) => {
    if (!answered || selectedCard === null) return "from-slate-700 to-slate-900";
    const isThisCorrect = cardOptions[cardIndex].id === currentSign.id;
    const isSelected = selectedCard === cardIndex;
    if (isThisCorrect) return "from-green-500 to-green-700";
    if (isSelected && !isThisCorrect) return "from-red-500 to-red-700";
    return "from-slate-700 to-slate-900 opacity-60";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8">
      <div className="container mx-auto px-4 space-y-8 max-w-3xl">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-bold text-slate-900">Traffic Snap</h1>
          <p className="text-slate-500 text-sm">Sign & Shape Recognition</p>
          <div className="flex justify-center gap-6 mt-2">
            <span className="text-slate-700 font-semibold">Score: <span className="text-green-600">{score}</span></span>
            <span className="text-slate-500 text-sm">{currentIndex + 1} / {shuffledSigns.length}</span>
          </div>
        </div>



        {/* Sign Tile OR Description Card OR Info Display */}
        <AnimatePresence mode="wait">
          {!answered || !showDescription ? (
            <motion.div
              key={`sign-${currentSign.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="relative mx-auto overflow-hidden rounded-2xl shadow-xl bg-black"
              style={{ width: "100%", aspectRatio: "1 / 1", maxWidth: 400 }}
            >
              <motion.img
                src={currentSign.signImage}
                alt={currentSign.name}
                className="absolute inset-0 w-full h-full object-cover"
                animate={{ x: answered ? 0 : panX, scale: answered ? 1 : 1.35 }}
                transition={{ duration: answered ? 0.5 : 0.05, ease: "linear" }}
              />
              {/* Vignette */}
              {!answered && (
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30 pointer-events-none" />
              )}
              {/* Badge */}
              {!answered && (
                <div className="absolute top-4 right-4 bg-white/90 text-slate-900 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                  IDENTIFY
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
              <div className="h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold">{currentSign.name}</h2>
                  <p className="text-lg leading-relaxed">{currentSign.description}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold opacity-75 uppercase">Real-World Use</p>
                  <p className="text-sm leading-relaxed">{currentSign.realWorldApplication}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                  <span className="absolute top-2 right-2 text-white text-lg">✓</span>
                )}
                {answered && selectedCard === idx && option.id !== currentSign.id && (
                  <span className="absolute top-2 right-2 text-white text-lg">✗</span>
                )}
              </motion.button>
            ))}
          </div>
        )}

        {/* Countdown display */}
        {answered && countdown !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              key={countdown}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.3 }}
              className="text-9xl font-black text-red-600 drop-shadow-2xl"
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
