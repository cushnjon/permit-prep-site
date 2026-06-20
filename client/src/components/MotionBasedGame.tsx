import React, { useState, useEffect, useRef } from "react";
import { motionBasedScenarios, Scenario, Vehicle } from "@/data/motionBasedGameData";
import { IsometricVehicle } from "./IsometricVehicle";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MotionBasedGame() {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [crashed, setCrashed] = useState(false);
  const [success, setSuccess] = useState(false);
  const [winStreak, setWinStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [vehiclePositions, setVehiclePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [elapsedTime, setElapsedTime] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const scenario = motionBasedScenarios[currentScenarioIndex];

  // Initialize vehicle positions
  useEffect(() => {
    const initialPositions: Record<string, { x: number; y: number }> = {};
    scenario.vehicles.forEach((vehicle) => {
      initialPositions[vehicle.id] = { x: vehicle.startX, y: vehicle.startY };
    });
    setVehiclePositions(initialPositions);
  }, [scenario]);

  // Auto-start when vehicle is selected
  useEffect(() => {
    if (selectedVehicleId && !isPlaying && !crashed && !success) {
      // Small delay before starting
      const timer = setTimeout(() => {
        setIsPlaying(true);
        startTimeRef.current = null;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedVehicleId, isPlaying, crashed, success]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      setElapsedTime(elapsed);

      const newPositions: Record<string, { x: number; y: number }> = {};

      scenario.vehicles.forEach((vehicle) => {
        const vehicleElapsed = elapsed - vehicle.startTime;

        if (vehicleElapsed < 0) {
          // Vehicle hasn't started yet
          newPositions[vehicle.id] = { x: vehicle.startX, y: vehicle.startY };
        } else if (vehicleElapsed >= vehicle.duration) {
          // Vehicle has finished
          newPositions[vehicle.id] = { x: vehicle.endX, y: vehicle.endY };
        } else {
          // Vehicle is moving
          const progress = vehicleElapsed / vehicle.duration;
          newPositions[vehicle.id] = {
            x: vehicle.startX + (vehicle.endX - vehicle.startX) * progress,
            y: vehicle.startY + (vehicle.endY - vehicle.startY) * progress,
          };
        }
      });

      setVehiclePositions(newPositions);

      // Check for collisions
      checkCollisions(newPositions);

      // Check if scenario is complete
      if (elapsed >= scenario.duration) {
        setIsPlaying(false);
        if (!crashed && selectedVehicleId === scenario.correctVehicleId) {
          setSuccess(true);
          setWinStreak((prev) => prev + 1);
          setScore((prev) => prev + 25);
        }
      } else {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, scenario, selectedVehicleId]);

  const checkCollisions = (positions: Record<string, { x: number; y: number }>) => {
    if (crashed) return;

    const vehicleIds = Object.keys(positions);
    for (let i = 0; i < vehicleIds.length; i++) {
      for (let j = i + 1; j < vehicleIds.length; j++) {
        const v1 = positions[vehicleIds[i]];
        const v2 = positions[vehicleIds[j]];

        const distance = Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2));
        if (distance < 40) {
          // Collision detected
          setCrashed(true);
          setIsPlaying(false);
          setWinStreak(0);
        }
      }
    }
  };

  const handleSelectVehicle = (vehicleId: string) => {
    if (isPlaying || success || crashed) return;
    setSelectedVehicleId(vehicleId);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setSelectedVehicleId(null);
    setCrashed(false);
    setSuccess(false);
    setElapsedTime(0);
    startTimeRef.current = null;

    const initialPositions: Record<string, { x: number; y: number }> = {};
    scenario.vehicles.forEach((vehicle) => {
      initialPositions[vehicle.id] = { x: vehicle.startX, y: vehicle.startY };
    });
    setVehiclePositions(initialPositions);
  };

  const handleNextScenario = () => {
    setCurrentScenarioIndex((prev) => (prev + 1) % motionBasedScenarios.length);
    handleReset();
  };

  const handlePrevScenario = () => {
    setCurrentScenarioIndex((prev) => (prev - 1 + motionBasedScenarios.length) % motionBasedScenarios.length);
    handleReset();
  };

  return (
    <div className="w-full space-y-6 p-6 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Right-of-Way Roulette</h2>
          <p className="text-sm text-gray-600">
            Scenario {currentScenarioIndex + 1} of {motionBasedScenarios.length}
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
        <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
      </div>

      {/* Canvas Area */}
      <div className="relative bg-gray-900 rounded-lg shadow-lg overflow-hidden" style={{ height: "400px" }}>
        <svg width="100%" height="100%" className="absolute inset-0">
          {/* Draw intersection background */}
          <defs>
            <pattern id="road" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="20" height="20" fill="#333" />
              <line x1="0" y1="10" x2="20" y2="10" stroke="#FFD700" strokeWidth="1" strokeDasharray="5,5" />
            </pattern>
          </defs>

          {/* Roads */}
          <rect x="0" y="150" width="500" height="100" fill="url(#road)" />
          <rect x="150" y="0" width="100" height="400" fill="url(#road)" />

          {/* Center line */}
          <line x1="0" y1="200" x2="500" y2="200" stroke="#FFD700" strokeWidth="2" strokeDasharray="10,10" />
          <line x1="200" y1="0" x2="200" y2="400" stroke="#FFD700" strokeWidth="2" strokeDasharray="10,10" />

          {/* Stop signs */}
          <g transform="translate(150, 150)">
            <polygon points="0,-20 20,-10 20,10 0,20 -20,10 -20,-10" fill="#FF0000" />
            <text x="0" y="5" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
              STOP
            </text>
          </g>
        </svg>

        {/* Animated Vehicles */}
        <div className="absolute inset-0">
          {scenario.vehicles.map((vehicle) => {
            const pos = vehiclePositions[vehicle.id] || { x: vehicle.startX, y: vehicle.startY };
            const isSelected = selectedVehicleId === vehicle.id;

            return (
              <div
                key={vehicle.id}
                className="absolute transition-all"
                style={{
                  left: `${(pos.x / 500) * 100}%`,
                  top: `${(pos.y / 400) * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  className={`p-2 rounded-lg ${
                    isSelected
                      ? "bg-yellow-300 ring-4 ring-yellow-500 scale-125"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  <IsometricVehicle type={vehicle.type} color={vehicle.color} size={32} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Status Overlay */}
        {crashed && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/80 backdrop-blur">
            <div className="text-center">
              <div className="text-6xl mb-4">💥</div>
              <p className="text-white text-2xl font-bold">CRASH!</p>
              <p className="text-white text-sm mt-2">Collision detected. Try again!</p>
            </div>
          </div>
        )}

        {success && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-500/80 backdrop-blur">
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-white text-2xl font-bold">SUCCESS!</p>
              <p className="text-white text-sm mt-2">+25 Points</p>
            </div>
          </div>
        )}
      </div>

      {/* Vehicle Selection Cards */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">Select the vehicle with the right of way:</p>
        <div className="grid grid-cols-1 gap-2">
          {scenario.vehicles.map((vehicle) => (
            <button
              key={vehicle.id}
              onClick={() => handleSelectVehicle(vehicle.id)}
              disabled={isPlaying || success || crashed}
              className={`p-4 rounded-lg text-left transition-all ${
                selectedVehicleId === vehicle.id
                  ? "bg-yellow-300 ring-2 ring-yellow-500 scale-105"
                  : "bg-gray-100 hover:bg-gray-200"
              } ${isPlaying || success || crashed ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center gap-3">
                <IsometricVehicle type={vehicle.type} color={vehicle.color} size={24} />
                <div>
                  <p className="font-bold text-gray-900">{vehicle.name}</p>
                  <p className="text-xs text-gray-600">{vehicle.label}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Rule Explanation */}
      <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
        <p className="text-sm text-gray-700">
          <span className="font-bold text-blue-900">📋 Rule:</span> {scenario.rule}
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={handleReset}
          variant="outline"
          className="flex items-center gap-2"
          disabled={!selectedVehicleId && !isPlaying && !success && !crashed}
        >
          <RotateCcw size={16} />
          Reset
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

      {/* Score Display */}
      <div className="bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded-lg text-center">
        <p className="text-3xl font-bold text-gray-900">{score} Points</p>
      </div>
    </div>
  );
}
