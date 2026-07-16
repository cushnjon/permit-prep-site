import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { trafficSnapData } from "@/data/trafficSnapData";

// Flatten all signs from all zones
const ALL_SIGNS = trafficSnapData.flatMap((zone) => zone.signs);

// Group signs by color
const SIGN_COLORS = {
  red: {
    name: "Red Signs",
    description: "Regulatory signs indicating stop, yield, or prohibition",
    signs: ALL_SIGNS.filter((s) => ["Stop Sign", "Do Not Enter Sign", "No Parking Sign"].includes(s.name)),
  },
  yellow: {
    name: "Yellow Signs",
    description: "Warning signs alerting drivers to potential hazards",
    signs: ALL_SIGNS.filter((s) => 
      ["School Zone Sign", "Curve Ahead Sign", "Slippery Road Sign", "Merge Sign", "Deer Crossing Sign"].includes(s.name)
    ),
  },
  blue: {
    name: "Blue Signs",
    description: "Informational signs providing directions and services",
    signs: ALL_SIGNS.filter((s) => 
      ["Hospital Sign", "Rest Area Sign", "Gas Station Sign", "Lodging Sign"].includes(s.name)
    ),
  },
  white: {
    name: "White & Green Signs",
    description: "Regulatory and directional signs",
    signs: ALL_SIGNS.filter((s) => 
      ["Speed Limit Sign", "One Way Sign", "Exit Sign", "Handicap Accessible Sign", "Pedestrian Crossing Sign"].includes(s.name)
    ),
  },
};

interface CarouselProps {
  colorKey: string;
  colorData: {
    name: string;
    description: string;
    signs: typeof ALL_SIGNS;
  };
}

function SignCarousel({ colorKey, colorData }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(colorData.signs.length / itemsPerPage);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages);
  };

  const startIdx = currentIndex * itemsPerPage;
  const visibleSigns = colorData.signs.slice(startIdx, startIdx + itemsPerPage);

  const colorBgMap: Record<string, string> = {
    red: "bg-red-50 border-red-200",
    yellow: "bg-yellow-50 border-yellow-200",
    blue: "bg-blue-50 border-blue-200",
    white: "bg-gray-50 border-gray-200",
  };

  const colorAccentMap: Record<string, string> = {
    red: "text-red-700",
    yellow: "text-yellow-700",
    blue: "text-blue-700",
    white: "text-gray-700",
  };

  const colorButtonMap: Record<string, string> = {
    red: "bg-red-500 hover:bg-red-600",
    yellow: "bg-yellow-500 hover:bg-yellow-600",
    blue: "bg-blue-500 hover:bg-blue-600",
    white: "bg-gray-500 hover:bg-gray-600",
  };

  return (
    <div className={`rounded-2xl border-2 p-8 ${colorBgMap[colorKey]}`}>
      <div className="mb-6">
        <h2 className={`text-3xl font-bold ${colorAccentMap[colorKey]} mb-2`}>{colorData.name}</h2>
        <p className="text-gray-600">{colorData.description}</p>
      </div>

      {/* Carousel */}
      <div className="relative">
        <div className="grid grid-cols-3 gap-6 mb-6">
          {visibleSigns.map((sign) => (
            <motion.div
              key={sign.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Sign Image */}
              <div className="relative w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                <img
                  src={sign.signImage}
                  alt={sign.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Sign Info */}
              <div className="p-4 space-y-3">
                <h3 className="font-bold text-lg text-gray-900">{sign.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{sign.description}</p>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Real-World Use</p>
                  <p className="text-xs text-gray-600 line-clamp-2">{sign.realWorldApplication}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Navigation */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              className={`${colorButtonMap[colorKey]} text-white p-2 rounded-lg transition`}
            >
              <ChevronLeft size={24} />
            </button>

            <div className="text-sm font-semibold text-gray-600">
              {currentIndex + 1} / {totalPages}
            </div>

            <button
              onClick={handleNext}
              className={`${colorButtonMap[colorKey]} text-white p-2 rounded-lg transition`}
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SignReference() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Traffic Sign Reference</h1>
          <p className="text-slate-600">Complete guide to all traffic signs organized by color</p>
        </div>

        {/* Carousels */}
        <div className="space-y-8">
          {Object.entries(SIGN_COLORS).map(([colorKey, colorData]) => (
            <SignCarousel key={colorKey} colorKey={colorKey} colorData={colorData} />
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-slate-600 text-sm">
            Master these signs to ace your DMV test. Practice with Traffic Snap for interactive learning!
          </p>
        </div>
      </div>
    </div>
  );
}
