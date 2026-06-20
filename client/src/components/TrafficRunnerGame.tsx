import React, { useState, useEffect, useRef } from 'react';
import { runnerLevels } from '@/data/runnerGameData';
import { ChevronUp, RotateCcw } from 'lucide-react';

interface TrafficRunnerGameProps {
  onScoreUpdate?: (score: number) => void;
}

export default function TrafficRunnerGame({ onScoreUpdate }: TrafficRunnerGameProps) {
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [playerPosition, setPlayerPosition] = useState<number>(0);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [crashed, setCrashed] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [time, setTime] = useState<number>(0);
  const [hasRightOfWay, setHasRightOfWay] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | undefined>(undefined);
  const keyPressRef = useRef(false);

  const level = runnerLevels[currentLevel];

  // Handle button press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameActive && !crashed) {
        e.preventDefault();
        keyPressRef.current = true;
        setIsMoving(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        keyPressRef.current = false;
        setIsMoving(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameActive, crashed]);

  // Game loop
  useEffect(() => {
    if (!gameActive || crashed) return;

    const gameLoop = () => {
      setPlayerPosition((prev) => {
        let newPos = prev;

        if (isMoving) {
          newPos = prev + 5; // Car moves up

          // Check if player has right of way
          const currentObstacles = level.obstacles.filter(
            (obs) => Math.abs(obs.position - newPos) < 100
          );

          const hasRightOfWayNow = currentObstacles.every(
            (obs) => obs.hasRightOfWay || obs.type === 'stop_sign'
          );

          setHasRightOfWay(hasRightOfWayNow);

          // Check collision
          const collision = currentObstacles.some((obs) => {
            if (obs.hasRightOfWay && obs.type !== 'stop_sign') {
              // Collision with vehicle that has right of way
              return Math.abs(obs.position - newPos) < 50;
            }
            return false;
          });

          if (collision) {
            setCrashed(true);
            setGameActive(false);
            return newPos;
          }

          // Check if reached finish
          if (newPos >= level.totalDistance) {
            setGameActive(false);
            const levelScore = Math.max(0, 1000 - time * 5);
            setScore((prev) => prev + levelScore);
            if (onScoreUpdate) onScoreUpdate(score + levelScore);
          }
        }

        return newPos;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameActive, crashed, isMoving, level, time, score, onScoreUpdate]);

  // Timer
  useEffect(() => {
    if (!gameActive || crashed) return;

    const timer = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameActive, crashed]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw road
    ctx.fillStyle = '#2a2a3e';
    ctx.fillRect(50, 0, canvas.width - 100, canvas.height);

    // Draw lane markers
    ctx.strokeStyle = '#FFD93D';
    ctx.setLineDash([20, 20]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw player car
    const carX = canvas.width / 2 - 20;
    const carY = canvas.height - 80;

    // Car body
    ctx.fillStyle = isMoving ? '#4ECDC4' : '#FF6B6B';
    ctx.fillRect(carX, carY, 40, 60);

    // Car windows
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(carX + 5, carY + 10, 30, 15);
    ctx.fillRect(carX + 5, carY + 30, 30, 15);

    // Draw obstacles
    level.obstacles.forEach((obs) => {
      const obsY = canvas.height - (level.totalDistance - obs.position);

      if (obsY > -50 && obsY < canvas.height + 50) {
        ctx.fillStyle = obs.color;

        if (obs.type === 'pedestrian') {
          // Draw pedestrian
          ctx.fillRect(canvas.width / 2 - 15 + (obs.direction === 'left' ? -50 : 50), obsY, 30, 40);
        } else if (obs.type === 'stop_sign') {
          // Draw stop sign
          ctx.fillStyle = '#FF0000';
          ctx.beginPath();
          ctx.moveTo(canvas.width / 2, obsY);
          ctx.lineTo(canvas.width / 2 + 20, obsY + 15);
          ctx.lineTo(canvas.width / 2 + 20, obsY + 35);
          ctx.lineTo(canvas.width / 2, obsY + 50);
          ctx.lineTo(canvas.width / 2 - 20, obsY + 35);
          ctx.lineTo(canvas.width / 2 - 20, obsY + 15);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('STOP', canvas.width / 2, obsY + 30);
        } else {
          // Draw car/truck
          const width = obs.type === 'truck' ? 50 : 40;
          const offsetX = obs.direction === 'left' ? -100 : 100;
          ctx.fillRect(canvas.width / 2 + offsetX, obsY, width, 35);

          // Windows
          ctx.fillStyle = '#87CEEB';
          ctx.fillRect(canvas.width / 2 + offsetX + 5, obsY + 5, width - 10, 10);
        }
      }
    });

    // Draw status text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Distance: ${Math.floor(playerPosition)}m`, 20, 30);
    ctx.fillText(`Time: ${time}s`, 20, 60);
    ctx.fillText(`Right of Way: ${hasRightOfWay ? '✓ YES' : '✗ NO'}`, 20, 90);

    if (crashed) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CRASH!', canvas.width / 2, canvas.height / 2);
    }
  }, [playerPosition, isMoving, crashed, hasRightOfWay, level, time]);

  const startGame = () => {
    setPlayerPosition(0);
    setTime(0);
    setCrashed(false);
    setGameActive(true);
    setDistance(0);
  };

  const nextLevel = () => {
    if (currentLevel < runnerLevels.length - 1) {
      setCurrentLevel(currentLevel + 1);
      startGame();
    }
  };

  const resetLevel = () => {
    startGame();
  };

  return (
    <div className="w-full space-y-4">
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
        <h3 className="text-lg font-bold">{level.name}</h3>
        <p className="text-sm opacity-90">{level.description}</p>
        <p className="text-xs mt-2">Difficulty: {level.difficulty.toUpperCase()}</p>
      </div>

      <canvas
        ref={canvasRef}
        width={400}
        height={500}
        className="w-full border-4 border-green-500 rounded-lg bg-gray-900"
      />

      <div className="bg-white p-4 rounded-lg space-y-3">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-600">Distance</p>
            <p className="text-lg font-bold text-green-600">{Math.floor(playerPosition)}m</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Time</p>
            <p className="text-lg font-bold text-green-600">{time}s</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Score</p>
            <p className="text-lg font-bold text-green-600">{score}</p>
          </div>
        </div>

        <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
          <p className="text-sm font-semibold">
            {gameActive && !crashed
              ? 'Hold SPACE to move forward. Release when you DON\'T have right of way!'
              : crashed
                ? '❌ You crashed! Release the button when there\'s no right of way.'
                : '✓ Level complete!'}
          </p>
        </div>

        <div className="flex gap-2">
          {!gameActive ? (
            <>
              <button
                onClick={startGame}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
              >
                <ChevronUp size={20} />
                {crashed ? 'Retry Level' : 'Start Level'}
              </button>
              {!crashed && currentLevel < runnerLevels.length - 1 && (
                <button
                  onClick={nextLevel}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                >
                  Next Level
                </button>
              )}
            </>
          ) : (
            <button
              onClick={resetLevel}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
            >
              <RotateCcw size={20} />
              Reset
            </button>
          )}
        </div>

        <div className="text-xs text-gray-600 text-center">
          Level {currentLevel + 1} of {runnerLevels.length}
        </div>
      </div>
    </div>
  );
}
