import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trafficSnapData, TrafficSign } from "@/data/trafficSnapData";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

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
          style={{ maxHeight: 144 }}
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

interface CarouselTrackProps {
  group: typeof COLOR_GROUPS[0];
}

function CarouselTrack({ group }: CarouselTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const posRef = useRef(0);
  const animRef = useRef<number>(0);
  const speed = 0.5; // px per frame

  // Duplicate signs for infinite loop
  const doubled = [...group.signs, ...group.signs, ...group.signs];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const cardWidth = 288 + 24; // card width + gap
    const totalWidth = group.signs.length * cardWidth;

    const animate = () => {
      if (!paused) {
        posRef.current += speed;
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
  }, [paused, group.signs.length]);

  return (
    <div
      className={`rounded-3xl border-2 ${group.border} ${group.track} overflow-hidden py-8`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Header */}
      <div className="px-8 mb-6 flex items-center gap-4">
        <span className={`${group.badge} px-4 py-1.5 rounded-full text-sm font-bold tracking-wide`}>
          {group.label}
        </span>
        <span className="text-gray-600 text-sm">{group.subtitle}</span>
        <span className="ml-auto text-xs text-gray-400 italic">Hover to pause</span>
      </div>

      {/* Scrolling track */}
      <div className="overflow-hidden px-8">
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
            All {ALL_SIGNS.length} traffic signs organized by color. Hover over any carousel to pause and read.
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
