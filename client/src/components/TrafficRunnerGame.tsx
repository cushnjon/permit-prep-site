import React, { useState, useRef, useCallback, useEffect } from 'react';

const TrafficRunnerGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'crashed'>('idle');
  const [playerStopped, setPlayerStopped] = useState(false);
  const gameStateRef = useRef({
    playerX: 400,
    playerY: 400,
    playerHeading: -Math.PI / 2,
    playerSpeed: 3.75,
    playerStopped: false,
    aiVehicles: [] as Array<{ x: number; y: number; heading: number; speed: number }>,
    coins: [] as Array<{ x: number; y: number; collected: boolean }>,
    scenarioIndex: 0,
    scenarioTime: 0,
    trafficLightTime: 0,
    gameState: 'idle' as 'idle' | 'playing' | 'crashed',
    score: 0,
    time: 0,
    lastTurnTime: 0,
  });
  const rafRef = useRef<number | undefined>(undefined);

  // Larger map with 8x8 grid
  const GRID_SIZE = 100;
  const GRID_COLS = 8;
  const GRID_ROWS = 8;
  const ZOOM = 2;
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  const verticalRoads = Array.from({ length: 7 }, (_, i) => (i + 1) * GRID_SIZE);
  const horizontalRoads = Array.from({ length: 7 }, (_, i) => (i + 1) * GRID_SIZE);

  const scenarios = [
    { name: 'Unprotected Left Turn', law: 'Yield to oncoming traffic' },
    { name: 'Right Turn—Pedestrian', law: 'Check for pedestrians before turning' },
    { name: '4-Way Stop', law: 'First to stop has right of way' },
    { name: 'Emergency Vehicle', law: 'Pull over and yield immediately' },
    { name: 'T-Intersection', law: 'Yield to traffic on main road' },
    { name: 'Roundabout Entry', law: 'Yield to traffic in roundabout' },
    { name: 'Driveway Exit', law: 'Yield to all traffic on street' },
    { name: 'Green Light Left Turn', law: 'Yield to oncoming traffic' },
  ];

  const findClosestRoadPoint = (x: number, y: number) => {
    let closest = { x, y, heading: 0 };
    let minDist = Infinity;

    // Check vertical roads
    for (const roadX of verticalRoads) {
      const dist = Math.abs(x - roadX);
      if (dist < minDist) {
        minDist = dist;
        closest = { x: roadX, y, heading: -Math.PI / 2 };
      }
    }

    // Check horizontal roads
    for (const roadY of horizontalRoads) {
      const dist = Math.abs(y - roadY);
      if (dist < minDist) {
        minDist = dist;
        closest = { x, y: roadY, heading: 0 };
      }
    }

    return closest;
  };

  const isOnRoad = (x: number, y: number) => {
    const closest = findClosestRoadPoint(x, y);
    return Math.hypot(x - closest.x, y - closest.y) < 30;
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameStateRef.current;

    // Clear canvas
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Calculate camera offset (center on player)
    const cameraX = state.playerX * ZOOM - CANVAS_WIDTH / 2;
    const cameraY = state.playerY * ZOOM - CANVAS_HEIGHT / 2;

    ctx.save();
    ctx.translate(-cameraX, -cameraY);

    // Draw roads
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 40 * ZOOM;

    // Vertical roads
    for (const roadX of verticalRoads) {
      ctx.beginPath();
      ctx.moveTo(roadX * ZOOM, 0);
      ctx.lineTo(roadX * ZOOM, GRID_SIZE * GRID_ROWS * ZOOM);
      ctx.stroke();
    }

    // Horizontal roads
    for (const roadY of horizontalRoads) {
      ctx.beginPath();
      ctx.moveTo(0, roadY * ZOOM);
      ctx.lineTo(GRID_SIZE * GRID_COLS * ZOOM, roadY * ZOOM);
      ctx.stroke();
    }

    // Draw road center lines
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 2 * ZOOM;
    ctx.setLineDash([10 * ZOOM, 10 * ZOOM]);

    for (const roadX of verticalRoads) {
      ctx.beginPath();
      ctx.moveTo(roadX * ZOOM, 0);
      ctx.lineTo(roadX * ZOOM, GRID_SIZE * GRID_ROWS * ZOOM);
      ctx.stroke();
    }

    for (const roadY of horizontalRoads) {
      ctx.beginPath();
      ctx.moveTo(0, roadY * ZOOM);
      ctx.lineTo(GRID_SIZE * GRID_COLS * ZOOM, roadY * ZOOM);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw traffic lights and stop signs at intersections
    for (const roadX of verticalRoads) {
      for (const roadY of horizontalRoads) {
        const lightColor = state.trafficLightTime < 15 ? '#FF0000' : '#00FF00';

        // Traffic lights at all 4 corners
        ctx.fillStyle = lightColor;
        ctx.beginPath();
        ctx.arc((roadX - 20) * ZOOM, (roadY - 20) * ZOOM, 8 * ZOOM, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc((roadX + 20) * ZOOM, (roadY - 20) * ZOOM, 8 * ZOOM, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc((roadX - 20) * ZOOM, (roadY + 20) * ZOOM, 8 * ZOOM, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc((roadX + 20) * ZOOM, (roadY + 20) * ZOOM, 8 * ZOOM, 0, Math.PI * 2);
        ctx.fill();

        // Stop sign at bottom-right
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc((roadX + 30) * ZOOM, (roadY + 30) * ZOOM, 10 * ZOOM, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${12 * ZOOM}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('S', (roadX + 30) * ZOOM, (roadY + 30) * ZOOM);
      }
    }

    // Draw coins
    ctx.fillStyle = '#FFD700';
    for (const coin of state.coins) {
      if (!coin.collected) {
        ctx.beginPath();
        ctx.arc(coin.x * ZOOM, coin.y * ZOOM, 6 * ZOOM, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw AI vehicles
    ctx.fillStyle = '#FF0000';
    for (const vehicle of state.aiVehicles) {
      ctx.save();
      ctx.translate(vehicle.x * ZOOM, vehicle.y * ZOOM);
      ctx.rotate(vehicle.heading);
      ctx.fillRect(-7 * ZOOM, -10 * ZOOM, 14 * ZOOM, 20 * ZOOM);
      ctx.restore();
    }

    // Draw player car
    ctx.fillStyle = '#00FF00';
    ctx.save();
    ctx.translate(state.playerX * ZOOM, state.playerY * ZOOM);
    ctx.rotate(state.playerHeading);
    ctx.fillRect(-7 * ZOOM, -10 * ZOOM, 14 * ZOOM, 20 * ZOOM);
    ctx.restore();

    ctx.restore();

    // Draw HUD
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 120);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${state.score}`, 10, 25);
    ctx.fillText(`Time: ${state.time.toFixed(1)}s`, 150, 25);
    ctx.fillText(`Coins: ${state.coins.filter(c => !c.collected).length}`, 300, 25);

    // Draw scenario
    const scenario = scenarios[state.scenarioIndex % scenarios.length];
    ctx.fillStyle = '#FFFF00';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`⚠ ${scenario.name}`, CANVAS_WIDTH / 2, 50);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.fillText(scenario.law, CANVAS_WIDTH / 2, 70);

    // Draw idle screen
    if (state.gameState === 'idle') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 - 80, 300, 160);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Street Navigation', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.font = '14px Arial';
      ctx.fillText('Collect coins while driving.', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.fillText('Avoid AI traffic to survive.', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5);
      ctx.fillText('Click Play Car to start.', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    }

    // Draw crashed screen
    if (state.gameState === 'crashed') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#FF0000';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CRASHED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px Arial';
      ctx.fillText(`Final Score: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }
  }, []);

  const loop = useCallback(() => {
    const state = gameStateRef.current;

    if (state.gameState === 'playing') {
      // Update time
      state.time += 1 / 60;

      // Update scenario
      state.scenarioTime += 1 / 60;
      if (state.scenarioTime > 15) {
        state.scenarioIndex = (state.scenarioIndex + 1) % scenarios.length;
        state.scenarioTime = 0;
      }

      // Update traffic lights
      state.trafficLightTime += 1 / 60;
      if (state.trafficLightTime > 30) {
        state.trafficLightTime = 0;
      }

      // Player movement
      if (!playerStopped) {
        state.playerX += Math.cos(state.playerHeading) * state.playerSpeed;
        state.playerY += Math.sin(state.playerHeading) * state.playerSpeed;

        // 50/50 chance to turn at intersections
        const nearestVertical = verticalRoads.reduce((prev, curr) =>
          Math.abs(curr - state.playerX) < Math.abs(prev - state.playerX) ? curr : prev
        );
        const nearestHorizontal = horizontalRoads.reduce((prev, curr) =>
          Math.abs(curr - state.playerY) < Math.abs(prev - state.playerY) ? curr : prev
        );

        const atIntersection =
          Math.abs(state.playerX - nearestVertical) < 25 &&
          Math.abs(state.playerY - nearestHorizontal) < 25;

        if (atIntersection && state.time - state.lastTurnTime > 2) {
          if (Math.random() < 0.5) {
            // 50% chance to turn
            if (Math.random() < 0.5) {
              state.playerHeading += Math.PI / 2; // Turn right
            } else {
              state.playerHeading -= Math.PI / 2; // Turn left
            }
            state.lastTurnTime = state.time;
          }
        }

        // Wrap around map
        if (state.playerX < 0) state.playerX = GRID_SIZE * GRID_COLS;
        if (state.playerX > GRID_SIZE * GRID_COLS) state.playerX = 0;
        if (state.playerY < 0) state.playerY = GRID_SIZE * GRID_ROWS;
        if (state.playerY > GRID_SIZE * GRID_ROWS) state.playerY = 0;
      }

      // AI vehicle movement
      if (state.aiVehicles.length === 0) {
        for (let i = 0; i < 5; i++) {
          const roadType = Math.random() < 0.5 ? 'vertical' : 'horizontal';
          let x, y, heading;

          if (roadType === 'vertical') {
            const roadX = verticalRoads[Math.floor(Math.random() * verticalRoads.length)];
            x = roadX;
            y = Math.random() * GRID_SIZE * GRID_ROWS;
            heading = -Math.PI / 2;
          } else {
            x = Math.random() * GRID_SIZE * GRID_COLS;
            const roadY = horizontalRoads[Math.floor(Math.random() * horizontalRoads.length)];
            y = roadY;
            heading = 0;
          }

          state.aiVehicles.push({
            x,
            y,
            heading,
            speed: 1.5 + Math.random() * 1.5,
          });
        }
      }

      for (const vehicle of state.aiVehicles) {
        vehicle.x += Math.cos(vehicle.heading) * vehicle.speed;
        vehicle.y += Math.sin(vehicle.heading) * vehicle.speed;

        // 50/50 chance to turn at intersections
        const nearestVertical = verticalRoads.reduce((prev, curr) =>
          Math.abs(curr - vehicle.x) < Math.abs(prev - vehicle.x) ? curr : prev
        );
        const nearestHorizontal = horizontalRoads.reduce((prev, curr) =>
          Math.abs(curr - vehicle.y) < Math.abs(prev - vehicle.y) ? curr : prev
        );

        const atIntersection =
          Math.abs(vehicle.x - nearestVertical) < 25 &&
          Math.abs(vehicle.y - nearestHorizontal) < 25;

        if (atIntersection && Math.random() < 0.02) {
          if (Math.random() < 0.5) {
            vehicle.heading += Math.PI / 2;
          } else {
            vehicle.heading -= Math.PI / 2;
          }
        }

        // Wrap around
        if (vehicle.x < 0) vehicle.x = GRID_SIZE * GRID_COLS;
        if (vehicle.x > GRID_SIZE * GRID_COLS) vehicle.x = 0;
        if (vehicle.y < 0) vehicle.y = GRID_SIZE * GRID_ROWS;
        if (vehicle.y > GRID_SIZE * GRID_ROWS) vehicle.y = 0;

        // Collision with player
        if (Math.hypot(state.playerX - vehicle.x, state.playerY - vehicle.y) < 15) {
          state.gameState = 'crashed';
        }
      }

      // Coin collection
      if (state.coins.length === 0) {
        for (let i = 0; i < 12; i++) {
          let x, y;
          do {
            x = Math.random() * GRID_SIZE * GRID_COLS;
            y = Math.random() * GRID_SIZE * GRID_ROWS;
          } while (!isOnRoad(x, y));
          state.coins.push({ x, y, collected: false });
        }
      }

      for (const coin of state.coins) {
        if (!coin.collected && Math.hypot(state.playerX - coin.x, state.playerY - coin.y) < 15) {
          coin.collected = true;
          state.score += 10;
        }
      }
    }

    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw, playerStopped]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [loop]);

  const handlePlay = () => {
    gameStateRef.current.gameState = 'playing';
    gameStateRef.current.playerX = GRID_SIZE * 4;
    gameStateRef.current.playerY = GRID_SIZE * 4;
    gameStateRef.current.playerHeading = -Math.PI / 2;
    gameStateRef.current.score = 0;
    gameStateRef.current.time = 0;
    gameStateRef.current.coins = [];
    gameStateRef.current.aiVehicles = [];
    gameStateRef.current.lastTurnTime = 0;
    setGameState('playing');
    setPlayerStopped(false);
  };

  const handlePause = () => {
    setPlayerStopped(!playerStopped);
  };

  const handleStop = () => {
    gameStateRef.current.gameState = 'idle';
    gameStateRef.current.playerX = GRID_SIZE * 4;
    gameStateRef.current.playerY = GRID_SIZE * 4;
    gameStateRef.current.score = 0;
    gameStateRef.current.time = 0;
    gameStateRef.current.coins = [];
    gameStateRef.current.aiVehicles = [];
    setGameState('idle');
    setPlayerStopped(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Traffic Jam: Intersection Simulator</h3>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-yellow-300 rounded-lg bg-green-200 w-full"
      />
      <div className="flex gap-2 justify-center">
        <button
          onClick={handlePlay}
          disabled={gameState === 'playing'}
          className="px-6 py-2 bg-green-500 text-white rounded font-bold disabled:opacity-50"
        >
          ▶ Play Car
        </button>
        <button
          onClick={handlePause}
          disabled={gameState !== 'playing'}
          className="px-6 py-2 bg-yellow-500 text-white rounded font-bold disabled:opacity-50"
        >
          {playerStopped ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button
          onClick={handleStop}
          className="px-6 py-2 bg-red-500 text-white rounded font-bold disabled:opacity-50"
        >
          ⏹ Stop Car
        </button>
      </div>
    </div>
  );
};

export default TrafficRunnerGame;
