import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trafficSnapData, TrafficSign } from "@/data/trafficSnapData";
import { useLocation } from "wouter";
import { ArrowLeft, Play, Pause } from "lucide-react";

// All signs flattened
const ALL_SIGNS = trafficSnapData.flatMap((z) => z.signs);

// Color-coded groups
const COLOR_GROUPS = [
  {
    key: "red",
    label: "Red Signs",
    subtitle: "Stop, Prohibition & Restriction",
    bg: "bg-red-600",
    track: "bg-red-50",
    border: "border-red-300",
    badge: "bg-red-600 text-white",
    heading: "text-red-700",
    card: "bg-white border-red-200",
    dot: "bg-red-500",
    layout: "carousel",
    signs: ALL_SIGNS.filter((s) =>
      ["Stop Sign", "Do Not Enter Sign", "No Parking Sign", "Yield Sign"].includes(s.name)
    ),
  },
  {
    key: "yellow",
    label: "Yellow Signs",
    subtitle: "Hazard & Warning",
    bg: "bg-yellow-500",
    track: "bg-yellow-50",
    border: "border-yellow-300",
    badge: "bg-yellow-500 text-white",
    heading: "text-yellow-700",
    card: "bg-white border-yellow-200",
    dot: "bg-yellow-500",
    layout: "row",
    signs: ALL_SIGNS.filter((s) =>
      ["School Zone Sign", "Curve Ahead Sign", "Slippery Road Sign", "Merge Sign", "Deer Crossing Sign", "Pedestrian Crossing Sign"].includes(s.name)
    ),
  },
  {
    key: "white",
    label: "White Signs",
    subtitle: "Regulatory & Speed Control",
    bg: "bg-gray-700",
    track: "bg-gray-50",
    border: "border-gray-300",
    badge: "bg-gray-700 text-white",
    heading: "text-gray-800",
    card: "bg-white border-gray-200",
    dot: "bg-gray-600",
    layout: "carousel",
    signs: ALL_SIGNS.filter((s) =>
      ["Speed Limit Sign", "One Way Sign"].includes(s.name)
    ),
  },
  {
    key: "blue",
    label: "Blue Signs",
    subtitle: "Services & Information",
    bg: "bg-blue-600",
    track: "bg-blue-50",
    border: "border-blue-300",
    badge: "bg-blue-600 text-white",
    heading: "text-blue-700",
    card: "bg-white border-blue-200",
    dot: "bg-blue-500",
    layout: "carousel",
    signs: ALL_SIGNS.filter((s) =>
      ["Hospital Sign", "Rest Area Sign", "Gas Station Sign", "Lodging Sign", "Handicap Accessible Sign", "Exit Sign"].includes(s.name)
    ),
  },
];

interface SignCardProps {
  sign: TrafficSign;
  cardBg: string;
  headingColor: string;
}

function SignCard({ sign, cardBg, headingColor }: SignCardProps) {
  return (
    <div
      className={`flex-shrink-0 w-72 rounded-2xl border-2 ${cardBg} shadow-md overflow-hidden flex flex-col`}
      style={{ minWidth: 288 }}
    >
      {/* Full sign image */}
      <div className="w-full bg-white flex items-center justify-center p-6" style={{ height: 220 }}>
        <img
          src={sign.signImage}
          alt={sign.name}
          className="max-w-full max-h-full object-contain"
          style={{ maxHeight: 122 }}
        />
      </div>
      {/* Info */}
      <div className="p-5 flex flex-col gap-2 flex-1">
        <h3 className={`font-bold text-lg leading-tight ${headingColor}`}>{sign.name}</h3>
        <p className="text-sm text-gray-700 leading-relaxed">{sign.description}</p>
        <div className="mt-auto pt-3 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Real-World Use</p>
          <p className="text-xs text-gray-600 leading-relaxed">{sign.realWorldApplication}</p>
        </div>
      </div>
    </div>
  );
}

type SpeedLevel = "slow" | "normal" | "fast";

interface CarouselTrackProps {
  group: (typeof COLOR_GROUPS)[0];
}

function CarouselTrack({ group }: CarouselTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [speed, setSpeed] = useState<SpeedLevel>("normal");
  const [playing, setPlaying] = useState(true);
  const posRef = useRef(0);
  const animRef = useRef<number>(0);

  // Speed multipliers
  const speedMap: Record<SpeedLevel, number> = {
    slow: 0.25,
    normal: 0.5,
    fast: 1.0,
  };

  // Duplicate signs for infinite loop
  const doubled = [...group.signs, ...group.signs, ...group.signs];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const cardWidth = 288 + 24; // card width + gap
    const totalWidth = group.signs.length * cardWidth;
    const currentSpeed = speedMap[speed];

    const animate = () => {
      if (playing) {
        posRef.current += currentSpeed;
        if (posRef.current >= totalWidth) {
          posRef.current -= totalWidth;
        }
        if (track) {
          track.style.transform = `translateX(-${posRef.current}px)`;
        }
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [speed, playing, group.signs.length]);

  if (group.layout === "row") {
    // Yellow signs in single row
    return (
      <div className={`rounded-3xl border-2 ${group.border} ${group.track} overflow-hidden`}>
        {/* Slim top strip header */}
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-8 py-3 flex items-center gap-4 shadow-sm">
          <span className="text-white font-bold text-sm tracking-wide">
            {group.label}
          </span>
          <span className="text-white/80 text-xs">{group.subtitle}</span>

          {/* Speed toggle + Pause button */}
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/20 rounded-full p-1 backdrop-blur-sm">
              {(["slow", "normal", "fast"] as SpeedLevel[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-1 rounded-full text-xs font-semibold transition-all ${
                    speed === s
                      ? "bg-white text-yellow-700"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {s === "slow" ? "Slow" : s === "normal" ? "Normal" : "Fast"}
                </button>
              ))}
            </div>

            {/* Pause/Play button */}
            <button
              onClick={() => setPlaying(!playing)}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all backdrop-blur-sm"
              title={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
          </div>
        </div>

        {/* Single row of signs */}
        <div className="overflow-x-auto px-8 py-8">
          <div className="flex gap-6">
            {group.signs.map((sign) => (
              <div
                key={sign.id}
                className={`flex-shrink-0 w-80 rounded-2xl border-2 ${group.card} shadow-md overflow-hidden flex flex-row`}
              >
                {/* Sign image */}
                <div className="w-40 bg-white flex items-center justify-center p-4 flex-shrink-0">
                  <img
                    src={sign.signImage}
                    alt={sign.name}
                    className="max-w-full max-h-full object-contain"
                    style={{ maxHeight: 120 }}
                  />
                </div>
                {/* Description */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <h3 className={`font-bold text-base leading-tight ${group.heading} mb-2`}>
                      {sign.name}
                    </h3>
                    <p className="text-xs text-gray-700 leading-relaxed mb-2">{sign.description}</p>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Use
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {sign.realWorldApplication}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Carousel layout for red, white, blue
  return (
    <div className={`rounded-3xl border-2 ${group.border} ${group.track} overflow-hidden`}>
      {/* Slim top strip header */}
      <div className={`bg-gradient-to-r ${group.bg} to-opacity-90 px-8 py-3 flex items-center gap-4 shadow-sm`}>
        <span className="text-white font-bold text-sm tracking-wide">
          {group.label}
        </span>
        <span className="text-white/80 text-xs">{group.subtitle}</span>

        {/* Speed toggle + Pause button */}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/20 rounded-full p-1 backdrop-blur-sm">
            {(["slow", "normal", "fast"] as SpeedLevel[]).map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded-full text-xs font-semibold transition-all ${
                  speed === s
                    ? "bg-white text-gray-800"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {s === "slow" ? "Slow" : s === "normal" ? "Normal" : "Fast"}
              </button>
            ))}
          </div>

          {/* Pause/Play button */}
          <button
            onClick={() => setPlaying(!playing)}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all backdrop-blur-sm"
            title={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>
      </div>

      {/* Scrolling track */}
      <div className="overflow-hidden px-8 py-8">
        <div
          ref={trackRef}
          className="flex gap-6 will-change-transform"
          style={{ width: "max-content" }}
        >
          {doubled.map((sign, idx) => (
            <SignCard
              key={`${sign.id}-${idx}`}
              sign={sign}
              cardBg={group.card}
              headingColor={group.heading}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SignReference() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white py-10">
      <div className="max-w-7xl mx-auto px-6">
        {/* Back button */}
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-8 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Back to Home
        </button>

        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-black text-slate-900 mb-3 tracking-tight">Traffic Sign Guide</h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            All {ALL_SIGNS.length} traffic signs organized by color. Use controls to adjust carousel speed and pause.
          </p>
        </div>

        {/* Color-coded carousels */}
        <div className="space-y-10">
          {COLOR_GROUPS.map((group) => (
            <CarouselTrack key={group.key} group={group} />
          ))}
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-16 pb-8">
          <p className="text-slate-500 mb-4">Ready to test your knowledge?</p>
          <button
            onClick={() => setLocation("/traffic-snap")}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg shadow-lg transition"
          >
            Play Traffic Snap →
          </button>
        </div>
      </div>
    </div>
  );
}
