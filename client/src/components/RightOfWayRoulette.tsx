import React, { useState, useEffect } from "react";
import scenarios from "@/data/rightOfWayRouletteData";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClickedVehicle {
  id: string;
  index: number;
}

export default function RightOfWayRoulette() {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [clickSequence, setClickSequence] = useState<ClickedVehicle[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [winStreak, setWinStreak] = useState(0);
  const [crashed, setCrashed] = useState(false);
  const [score, setScore] = useState(0);
  const [animatedVehicles, setAnimatedVehicles] = useState<Set<string>>(
    new Set()
  );

  const scenario = scenarios[currentScenarioIndex];
  const allVehicles = Object.entries(scenario.setup).filter(
    ([_, v]) => v !== undefined
  );

  const handleVehicleClick = (vehicleId: string) => {
    if (isCorrect !== null || crashed) return;

    const newSequence = [...clickSequence, { id: vehicleId, index: clickSequence.length }];
    setClickSequence(newSequence);

    // Check if this click is correct
    const expectedVehicle = scenario.correct_sequence[newSequence.length - 1];
    const isClickCorrect = vehicleId === expectedVehicle;

    if (!isClickCorrect) {
      // Crash!
      setCrashed(true);
      setIsCorrect(false);
      setWinStreak(0);
      return;
    }

    // Animate the vehicle
    setAnimatedVehicles((prev) => new Set(prev).add(vehicleId));

    // Check if sequence is complete
    if (newSequence.length === scenario.correct_sequence.length) {
      setIsCorrect(true);
      setWinStreak((prev) => prev + 1);
      setScore((prev) => prev + 20);
    }
  };

  const handleReset = () => {
    setClickSequence([]);
    setIsCorrect(null);
    setCrashed(false);
    setAnimatedVehicles(new Set());
  };

  const handleNextScenario = () => {
    setCurrentScenarioIndex((prev) => (prev + 1) % scenarios.length);
    handleReset();
  };

  const handlePrevScenario = () => {
    setCurrentScenarioIndex(
      (prev) => (prev - 1 + scenarios.length) % scenarios.length
    );
    handleReset();
  };

  const getVehiclePosition = (vehicleId: string) => {
    const vehicle = scenario.setup[vehicleId as keyof typeof scenario.setup];
    if (!vehicle) return { x: 0, y: 0 };

    if (animatedVehicles.has(vehicleId)) {
      return { x: vehicle.endX, y: vehicle.endY };
    }
    return { x: vehicle.startX, y: vehicle.startY };
  };

  const renderIntersectionBackground = () => {
    const canvasWidth = 500;
    const canvasHeight = 400;

    if (scenario.background_type === "4way") {
      return (
        <svg width={canvasWidth} height={canvasHeight} className="bg-gray-200">
          {/* Road */}
          <rect x={0} y={150} width={canvasWidth} height={100} fill="#333" />
          <rect x={150} y={0} width={100} height={canvasHeight} fill="#333" />

          {/* Lane markings */}
          <line
            x1={0}
            y1={200}
            x2={canvasWidth}
            y2={200}
            stroke="white"
            strokeWidth={2}
            strokeDasharray="10,10"
          />
          <line
            x1={200}
            y1={0}
            x2={200}
            y2={canvasHeight}
            stroke="white"
            strokeWidth={2}
            strokeDasharray="10,10"
          />

          {/* Stop sign */}
          <g transform="translate(150, 150)">
            <polygon
              points="0,-20 20,-10 20,10 0,20 -20,10 -20,-10"
              fill="#FF0000"
            />
            <text
              x={0}
              y={5}
              textAnchor="middle"
              fill="white"
              fontSize={12}
              fontWeight="bold"
            >
              STOP
            </text>
          </g>
        </svg>
      );
    } else if (scenario.background_type === "tjunction") {
      return (
        <svg width={canvasWidth} height={canvasHeight} className="bg-gray-200">
          {/* Main road */}
          <rect x={0} y={150} width={canvasWidth} height={100} fill="#333" />
          {/* Side road */}
          <rect x={150} y={0} width={100} height={150} fill="#333" />

          {/* Lane markings */}
          <line
            x1={0}
            y1={200}
            x2={canvasWidth}
            y2={200}
            stroke="white"
            strokeWidth={2}
            strokeDasharray="10,10"
          />

          {/* Yield sign */}
          <g transform="translate(150, 140)">
            <polygon
              points="0,-25 25,-15 25,15 0,25 -25,15 -25,-15"
              fill="#FF0000"
              stroke="white"
              strokeWidth={2}
            />
            <text
              x={0}
              y={5}
              textAnchor="middle"
              fill="white"
              fontSize={10}
              fontWeight="bold"
            >
              YIELD
            </text>
          </g>
        </svg>
      );
    } else if (scenario.background_type === "roundabout") {
      return (
        <svg width={canvasWidth} height={canvasHeight} className="bg-gray-200">
          {/* Roundabout circle */}
          <circle cx={250} cy={200} r={80} fill="none" stroke="#333" strokeWidth={40} />
          <circle cx={250} cy={200} r={40} fill="white" />

          {/* Entrance roads */}
          <rect x={200} y={300} width={100} height={100} fill="#333" />
          <line
            x1={250}
            y1={380}
            x2={250}
            y2={400}
            stroke="white"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        </svg>
      );
    } else if (scenario.background_type === "highway") {
      return (
        <svg width={canvasWidth} height={canvasHeight} className="bg-gray-200">
          {/* Highway lanes */}
          <rect x={0} y={100} width={canvasWidth} height={50} fill="#333" />
          <rect x={0} y={200} width={canvasWidth} height={50} fill="#333" />

          {/* Lane markings */}
          <line
            x1={0}
            y1={150}
            x2={canvasWidth}
            y2={150}
            stroke="yellow"
            strokeWidth={3}
            strokeDasharray="20,10"
          />
          <line
            x1={0}
            y1={250}
            x2={canvasWidth}
            y2={250}
            stroke="white"
            strokeWidth={2}
            strokeDasharray="10,10"
          />

          {/* On-ramp */}
          <path d="M 0 280 Q 100 250 150 200" fill="none" stroke="#333" strokeWidth={40} />
        </svg>
      );
    }

    return null;
  };

  return (
    <div className="w-full space-y-6 p-6 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Right-of-Way Roulette</h2>
          <p className="text-sm text-gray-600">
            Scenario {currentScenarioIndex + 1} of {scenarios.length}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-green-600">{winStreak}</div>
          <p className="text-xs text-gray-600">Win Streak</p>
        </div>
      </div>

      {/* Scenario Title */}
      <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
        <h3 className="text-lg font-bold text-gray-900">{scenario.title}</h3>
        <p className="text-sm text-gray-600 mt-1">{scenario.intersection_type}</p>
      </div>

      {/* Canvas Area */}
      <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex justify-center p-4">
          {renderIntersectionBackground()}
        </div>

        {/* Vehicles on Canvas */}
        <div className="absolute inset-0 pointer-events-none">
          {allVehicles.map(([vehicleId, vehicle]) => {
            const pos = getVehiclePosition(vehicleId);
            const isInSequence = clickSequence.some((v) => v.id === vehicleId);
            const sequenceIndex = clickSequence.findIndex((v) => v.id === vehicleId);

            return (
              <div
                key={vehicleId}
                className="absolute pointer-events-auto cursor-pointer transition-all duration-500"
                style={{
                  left: `${(pos.x / 500) * 100}%`,
                  top: `${(pos.y / 400) * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
                onClick={() => handleVehicleClick(vehicleId)}
              >
                <div
                  className={`text-4xl p-2 rounded-lg transition-all ${
                    isInSequence
                      ? "bg-green-300 ring-2 ring-green-600 scale-110"
                      : "hover:scale-125 hover:bg-yellow-200 hover:rounded-full"
                  }`}
                >
                  {vehicle.emoji}
                </div>
                {isInSequence && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                    #{sequenceIndex + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Messages */}
      {crashed && (
        <div className="bg-red-100 border-l-4 border-red-600 p-4 rounded">
          <p className="font-bold text-red-800">💥 {scenario.crash_fail_text}</p>
        </div>
      )}

      {isCorrect && (
        <div className="bg-green-100 border-l-4 border-green-600 p-4 rounded">
          <p className="font-bold text-green-800">✅ Correct!</p>
          <p className="text-sm text-green-700 mt-2">{scenario.rule_explanation}</p>
          <p className="text-lg font-bold text-green-800 mt-2">+20 Points</p>
        </div>
      )}

      {/* Sequence Display */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <p className="text-sm font-semibold text-gray-700 mb-2">Your Sequence:</p>
        <div className="flex gap-2 flex-wrap">
          {clickSequence.length === 0 ? (
            <p className="text-gray-500 text-sm">Click vehicles in the correct order...</p>
          ) : (
            clickSequence.map((click, idx) => (
              <div
                key={idx}
                className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold"
              >
                {idx + 1}. {click.id}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Rule Explanation */}
      <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
        <p className="text-sm text-gray-700">
          <span className="font-bold text-blue-900">📋 Rule:</span> {scenario.rule_explanation}
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={handleReset}
          variant="outline"
          className="flex items-center gap-2"
          disabled={clickSequence.length === 0}
        >
          <RotateCcw size={16} />
          Reset Scenario
        </Button>

        <Button
          onClick={handlePrevScenario}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ChevronLeft size={16} />
          Previous
        </Button>

        <Button
          onClick={handleNextScenario}
          variant="outline"
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
