import React, { useRef, useState, useEffect } from 'react';

const TrafficRunnerGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'crashed'>('idle');
  const [score, setScore] = useState(0);
  const [brakeForce, setBrakeForce] = useState(0);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 400;
  const PLAY_DURATION = 2000; // 2 seconds of driving
  const SCENARIO_DURATION = 3000; // 3 seconds to respond
  const BRAKE_TAP_FORCE = 0.5;
  const BRAKE_MAX_FORCE = 1.0;
  const BRAKE_RAMP_TIME = 2000; // 2 seconds to build from 50% to 100%

  const gameStateRef = useRef<{
    isPlaying: boolean;
    crashed: boolean;
    score: number;
    time: number;
    phase: 'playing' | 'scenario'; // Current phase
    phaseStartTime: number;
    brakeForce: number;
    brakeStartTime: number;
    scenarioType: string;
    scenarioMessage: string;
    playerResponded: boolean;
    responseCorrect: boolean;
  }>({
    isPlaying: false,
    crashed: false,
    score: 0,
    time: 0,
    phase: 'playing',
    phaseStartTime: 0,
    brakeForce: 0,
    brakeStartTime: 0,
    scenarioType: '',
    scenarioMessage: '',
    playerResponded: false,
    responseCorrect: false,
  });

  const scenarios = [
    {
      type: 'collision',
      message: 'INCOMING CAR! Brake to avoid collision',
      requiredBrake: 0.7,
    },
    {
      type: 'right-of-way',
      message: 'PEDESTRIAN CROSSING! Yield the right of way',
      requiredBrake: 0.8,
    },
    {
      type: 'collision',
      message: 'STOP SIGN AHEAD! Come to a complete stop',
      requiredBrake: 0.95,
    },
    {
      type: 'right-of-way',
      message: 'RED LIGHT! Stop at the intersection',
      requiredBrake: 0.9,
    },
  ];

  const getRandomScenario = () => {
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  };

  const handlePlay = () => {
    gameStateRef.current = {
      isPlaying: true,
      crashed: false,
      score: 0,
      time: 0,
      phase: 'playing',
      phaseStartTime: 0,
      brakeForce: 0,
      brakeStartTime: 0,
      scenarioType: '',
      scenarioMessage: '',
      playerResponded: false,
      responseCorrect: false,
    };
    setGameState('playing');
    setScore(0);
    setBrakeForce(0);
  };

  const handleStop = () => {
    gameStateRef.current.isPlaying = false;
    gameStateRef.current.crashed = false;
    setGameState('idle');
    setBrakeForce(0);
  };

  const handleBrakeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    const force = Math.max(0, Math.min(1, 1 - y / height));

    // Tap = instant 50%
    if (force > 0.4) {
      gameStateRef.current.brakeForce = Math.max(gameStateRef.current.brakeForce, BRAKE_TAP_FORCE);
      gameStateRef.current.brakeStartTime = Date.now();
    }

    setBrakeForce(gameStateRef.current.brakeForce);
  };

  const handleBrakeMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons === 1) {
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const height = rect.height;
      const dragForce = Math.max(0, Math.min(1, 1 - y / height));

      // Time ramp: 50% + 50% over 2 seconds
      const timeSinceStart = Date.now() - gameStateRef.current.brakeStartTime;
      const timeRamp = BRAKE_TAP_FORCE + (BRAKE_MAX_FORCE - BRAKE_TAP_FORCE) * Math.min(1, timeSinceStart / BRAKE_RAMP_TIME);

      gameStateRef.current.brakeForce = Math.max(dragForce, timeRamp);
      setBrakeForce(gameStateRef.current.brakeForce);
    }
  };

  const handleBrakeMouseUp = () => {
    gameStateRef.current.brakeForce = 0;
    gameStateRef.current.brakeStartTime = 0;
    setBrakeForce(0);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      const state = gameStateRef.current;

      // Clear canvas
      ctx.fillStyle = '#87ceeb';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (!state.isPlaying) {
        // Idle screen
        ctx.fillStyle = '#333';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click Play to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        requestAnimationFrame(gameLoop);
        return;
      }

      state.time += 16; // ~60fps

      // Draw road
      ctx.fillStyle = '#333';
      ctx.fillRect(0, CANVAS_HEIGHT / 2 - 60, CANVAS_WIDTH, 120);

      // Draw lane markings
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 20]);
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT / 2);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw player car
      const carX = CANVAS_WIDTH / 2;
      const carY = CANVAS_HEIGHT / 2;
      ctx.fillStyle = '#00aa00';
      ctx.fillRect(carX - 20, carY - 15, 40, 30);
      ctx.fillStyle = '#000';
      ctx.fillRect(carX - 15, carY - 10, 12, 10);
      ctx.fillRect(carX + 3, carY - 10, 12, 10);

      // Phase management
      const cycleTime = state.time % (PLAY_DURATION + SCENARIO_DURATION);

      if (cycleTime < PLAY_DURATION) {
        // Playing phase - just driving
        state.phase = 'playing';
        ctx.fillStyle = '#000';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${state.score}`, 20, 30);
        ctx.fillText(`Time: ${(state.time / 1000).toFixed(1)}s`, 20, 60);
      } else {
        // Scenario phase
        if (state.phase === 'playing') {
          // Just entered scenario phase - initialize it
          const scenario = getRandomScenario();
          state.phase = 'scenario';
          state.scenarioType = scenario.type;
          state.scenarioMessage = scenario.message;
          state.playerResponded = false;
          state.responseCorrect = false;
          state.brakeForce = 0;
          setBrakeForce(0);
        }

        // Draw scenario overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw scenario message
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(state.scenarioMessage, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

        // Check if player braked enough
        if (!state.playerResponded && state.brakeForce > 0.5) {
          state.playerResponded = true;
          state.responseCorrect = true;
          state.score += 100;
          setScore(state.score);
        }

        // Draw feedback
        const scenarioElapsed = cycleTime - PLAY_DURATION;
        if (state.playerResponded) {
          ctx.fillStyle = state.responseCorrect ? '#00ff00' : '#ff0000';
          ctx.font = 'bold 24px Arial';
          ctx.fillText(state.responseCorrect ? 'CORRECT! +100' : 'WRONG! Crash!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
        } else {
          ctx.fillStyle = '#ffff00';
          ctx.font = '20px Arial';
          ctx.fillText(`Brake now! ${((SCENARIO_DURATION - scenarioElapsed) / 1000).toFixed(1)}s`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
        }

        // Check for timeout or crash
        if (scenarioElapsed > SCENARIO_DURATION) {
          if (!state.playerResponded) {
            // Timeout - crash
            state.crashed = true;
            state.isPlaying = false;
            setGameState('crashed');
          }
        }
      }

      // Draw crash screen
      if (state.crashed) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CRASH!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
      }

      requestAnimationFrame(gameLoop);
    };

    gameLoop();
  }, []);

  return (
    <div className="w-full space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full border-2 border-gray-300 rounded-lg bg-white"
          />
        </div>
        <div
          className="w-20 bg-gradient-to-b from-green-500 via-yellow-500 to-red-500 rounded-lg cursor-pointer border-2 border-gray-400 relative"
          onMouseDown={handleBrakeMouseDown}
          onMouseMove={handleBrakeMouseMove}
          onMouseUp={handleBrakeMouseUp}
          onMouseLeave={handleBrakeMouseUp}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-sm">BRAKE</span>
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 bg-blue-500 opacity-50 transition-all"
            style={{ height: `${brakeForce * 100}%` }}
          />
          <div className="absolute bottom-2 left-0 right-0 text-center text-white font-bold text-xs">
            {Math.round(brakeForce * 100)}%
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handlePlay}
          disabled={gameState === 'playing'}
          className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold disabled:opacity-50"
        >
          ▶ Play
        </button>
        <button
          onClick={handleStop}
          disabled={gameState === 'idle'}
          className="px-6 py-2 bg-red-500 text-white rounded-lg font-semibold disabled:opacity-50"
        >
          ⏹ Stop
        </button>
      </div>
    </div>
  );
};

export default TrafficRunnerGame;
