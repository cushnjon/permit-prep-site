import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    // Generate random pan directions for each position
    return Array(5).fill(0).map(() => Math.random() > 0.5 ? 1 : -1);
  });

  // Pan animation positions (5 positions over 36 seconds - 3x slower)
  const basePanValues = [0, 20, 20, 15, 15];
  const panPositions = basePanValues.map((val, idx) => idx === 0 ? 0 : val * panDirections[idx]);
  const panDuration = 36000; // 36 seconds for 3x slower pan
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
      {/* Widescreen container 16:7 aspect ratio */}
      <div className="relative w-full" style={{ aspectRatio: "16 / 7" }}>
        {/* Clipped image with pan animation */}
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

        {/* Vignette overlay */}
        {!isAnswered && (
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 pointer-events-none" />
        )}

        {/* Identify badge */}
        {!isAnswered && (
          <div className="absolute top-4 right-4 bg-white/90 text-slate-900 px-3 py-1 rounded-full text-xs font-semibold">
            IDENTIFY
          </div>
        )}
      </div>
    </div>
  );
}

interface TrafficSign {
  id: string;
  name: string;
  description: string;
  realWorldApplication: string;
}

const TRAFFIC_SIGNS: TrafficSign[] = [
  {
    id: "stop",
    name: "STOP",
    description: "Come to a complete stop and yield to other traffic",
    realWorldApplication: "Used at intersections to control traffic flow and prevent collisions",
  },
  {
    id: "yield",
    name: "YIELD",
    description: "Slow down and be prepared to stop if necessary",
    realWorldApplication: "Used at intersections where traffic merges or has reduced priority",
  },
  {
    id: "speed-limit",
    name: "SPEED LIMIT",
    description: "Maximum legal speed on this road",
    realWorldApplication: "Posted on roads to maintain safe speeds based on road conditions",
  },
  {
    id: "do-not-enter",
    name: "DO NOT ENTER",
    description: "Do not proceed in this direction",
    realWorldApplication: "Used on one-way streets and divided highways to prevent wrong-way traffic",
  },
  {
    id: "one-way",
    name: "ONE WAY",
    description: "Traffic flows in the direction of the arrow only",
    realWorldApplication: "Indicates traffic direction on one-way streets",
  },
  {
    id: "no-parking",
    name: "NO PARKING",
    description: "Parking is not permitted in this area",
    realWorldApplication: "Used to keep traffic lanes clear and manage parking",
  },
  {
    id: "pedestrian",
    name: "PEDESTRIAN CROSSING",
    description: "Pedestrians may cross the road at this location",
    realWorldApplication: "Warns drivers to watch for pedestrians crossing the street",
  },
  {
    id: "school-zone",
    name: "SCHOOL ZONE",
    description: "Reduced speed limit near schools during school hours",
    realWorldApplication: "Protects children by reducing vehicle speeds near schools",
  },
  {
    id: "curve-ahead",
    name: "CURVE AHEAD",
    description: "Road curves sharply ahead",
    realWorldApplication: "Warns drivers to reduce speed and be prepared for sharp turns",
  },
  {
    id: "slippery-road",
    name: "SLIPPERY ROAD",
    description: "Road surface may be slippery",
    realWorldApplication: "Warns drivers of wet, icy, or loose gravel conditions",
  },
  {
    id: "merge",
    name: "MERGE",
    description: "Traffic lanes are merging",
    realWorldApplication: "Indicates where traffic from two lanes must combine into one",
  },
  {
    id: "deer-crossing",
    name: "DEER CROSSING",
    description: "Wildlife may cross the road",
    realWorldApplication: "Warns drivers of animal crossing areas to prevent collisions",
  },
  {
    id: "exit",
    name: "EXIT",
    description: "Exit ramp ahead",
    realWorldApplication: "Directs drivers to upcoming exit on highways",
  },
  {
    id: "hospital",
    name: "HOSPITAL",
    description: "Hospital or medical facility nearby",
    realWorldApplication: "Directs drivers to emergency medical services",
  },
  {
    id: "rest-area",
    name: "REST AREA",
    description: "Rest stop with facilities ahead",
    realWorldApplication: "Indicates location of rest stops on long highways",
  },
  {
    id: "gas-station",
    name: "GAS STATION",
    description: "Fuel services available",
    realWorldApplication: "Directs drivers to nearby gas stations",
  },
  {
    id: "handicap",
    name: "HANDICAP",
    description: "Accessible parking or facilities",
    realWorldApplication: "Indicates accessible parking and facilities for disabled persons",
  },
  {
    id: "lodging",
    name: "LODGING",
    description: "Hotel or motel nearby",
    realWorldApplication: "Directs travelers to nearby accommodations",
  },
];

interface FlipCardProps {
  sign: TrafficSign | null;
  isFlipped: boolean;
  onFlip: () => void;
  isCorrect: boolean;
  showResult: boolean;
}

function FlipCard({ sign, isFlipped, onFlip, isCorrect, showResult }: FlipCardProps) {
  if (!sign) {
    return (
      <motion.div className="h-80 bg-gray-300 rounded-xl flex items-center justify-center text-gray-500 font-semibold">
        Empty
      </motion.div>
    );
  }

  return (
    <motion.div
      className="h-80 cursor-pointer perspective"
      onClick={onFlip}
      whileHover={!showResult ? { scale: 1.05 } : {}}
    >
      <motion.div
        className="relative w-full h-full"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div
          className={`absolute w-full h-full rounded-xl p-6 flex flex-col justify-between items-center shadow-lg ${
            showResult
              ? isCorrect
                ? "bg-gradient-to-br from-green-500 to-green-700"
                : "bg-gradient-to-br from-red-500 to-red-700"
              : "bg-gradient-to-br from-green-500 to-green-700"
          }`}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="text-white text-center">
            <p className="text-sm font-semibold opacity-75">Traffic Sign</p>
            <p className="text-2xl font-bold mt-2">{sign.name}</p>
          </div>
          <p className="text-white text-xs text-center opacity-75">
            {showResult ? (isCorrect ? "✓ Correct!" : "✗ Wrong") : "Click to reveal"}
          </p>
        </div>

        {/* Back */}
        <div
          className="absolute w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 flex flex-col justify-between shadow-lg"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="text-white text-sm space-y-3">
            <div>
              <p className="font-semibold text-xs opacity-75 uppercase">Description</p>
              <p className="text-sm">{sign.description}</p>
            </div>
            <div>
              <p className="font-semibold text-xs opacity-75 uppercase">Real-World Use</p>
              <p className="text-sm">{sign.realWorldApplication}</p>
            </div>
          </div>
          <p className="text-white text-xs text-center opacity-75">Click to flip back</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function TrafficSnap() {
  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const [correctCardPosition, setCorrectCardPosition] = useState(0);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);

  const currentSign = TRAFFIC_SIGNS[currentSignIndex % TRAFFIC_SIGNS.length];

  // Get visible signs - correct sign in random position, others null
  const getVisibleSigns = (): (TrafficSign | null)[] => {
    const signs: (TrafficSign | null)[] = [null, null, null];
    signs[correctCardPosition] = currentSign;
    return signs;
  };

  const handleCardFlip = (position: number) => {
    if (answered) return;
    setFlipped((prev) => ({ ...prev, [position]: !prev[position] }));
  };

  const handleCardClick = (position: number) => {
    if (answered) return;
    setSelectedPosition(position);
    setAnswered(true);

    if (position === correctCardPosition) {
      setScore((prev) => prev + 1);
    }
  };

  const nextSign = () => {
    const newPosition = Math.floor(Math.random() * 3);
    setCorrectCardPosition(newPosition);
    setCurrentSignIndex((prev) => (prev + 1) % TRAFFIC_SIGNS.length);
    setFlipped({});
    setAnswered(false);
    setSelectedPosition(null);
  };

  const visibleSigns = getVisibleSigns();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8">
      <div className="container mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">Traffic Snap: Sign & Shape</h1>
          <p className="text-slate-600">Identify the correct traffic sign</p>
          <p className="text-lg font-semibold text-slate-700">Score: {score}</p>
        </div>

        {/* Top: All Signs Image */}
        <div className="rounded-xl overflow-hidden shadow-lg">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/all-traffic-signs-collection-ABfZqE94PcY8kqcmLCdrLc.webp"
            alt="All Traffic Signs"
            className="w-full h-auto"
          />
        </div>

        {/* Current Challenge */}
        <div className="bg-white rounded-lg p-6 shadow-md">
          <p className="text-center text-slate-700 font-semibold mb-2">Find this sign:</p>
          <p className="text-center text-3xl font-bold text-slate-900">{currentSign.name}</p>
        </div>

        {/* Bottom: Flip Cards */}
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-8">
            <AnimatePresence mode="wait">
              {visibleSigns.map((sign, position) => (
                <motion.div
                  key={position}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => handleCardClick(position)}
                >
                  <FlipCard
                    sign={sign}
                    isFlipped={flipped[position] || false}
                    onFlip={() => handleCardFlip(position)}
                    isCorrect={position === correctCardPosition}
                    showResult={answered && selectedPosition === position}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Next Button */}
          {answered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center"
            >
              <button
                onClick={nextSign}
                className="px-8 py-3 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-700 transition"
              >
                Next Sign →
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
