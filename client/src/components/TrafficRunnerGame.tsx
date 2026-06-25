import React, { useState, useRef, useCallback, useEffect } from 'react';

const TrafficRunnerGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapImageRef = useRef<HTMLImageElement | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'crashed'>('idle');
  const [playerStopped, setPlayerStopped] = useState(false);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const CAMERA_ZOOM = 4; // Close-up zoom level
  const MAP_WIDTH = 1600;
  const MAP_HEIGHT = 1280;

  const gameStateRef = useRef<{
    playerX: number;
    playerY: number;
    playerHeading: number;
    playerSpeed: number;
    score: number;
    time: number;
    coins: Array<{ x: number; y: number }>;
    aiVehicles: Array<{ x: number; y: number; heading: number; speed: number }>;
    scenarioIndex: number;
    scenarioTime: number;
    lastTurnTime: number;
    gameState: 'idle' | 'playing' | 'crashed';
    graceTime: number;
  }>({
    playerX: 800,
    playerY: 640,
    playerHeading: 0,
    playerSpeed: 3.75,
    score: 0,
    time: 0,
    coins: [] as Array<{ x: number; y: number }>,
    aiVehicles: [] as Array<{ x: number; y: number; heading: number; speed: number }>,
    scenarioIndex: 0,
    scenarioTime: 0,
    lastTurnTime: 0,
    gameState: 'idle' as 'idle' | 'playing' | 'crashed',
    graceTime: 0,
  });

  const rafRef = useRef<number | undefined>(undefined);

  const scenarios = [
    'Unprotected Left Turn',
    'Right Turn—Pedestrian',
    '4-Way Stop',
    'Emergency Vehicle',
    'T-Intersection',
    'Roundabout Entry',
    'Driveway Exit',
    'Green Light Left Turn',
  ];

  // Road network for pixel-art map
  const roads = [
    // Horizontal roads
    { type: 'horizontal' as const, y: 160, x1: 0, x2: 1600 },
    { type: 'horizontal' as const, y: 320, x1: 0, x2: 1600 },
    { type: 'horizontal' as const, y: 480, x1: 0, x2: 1600 },
    { type: 'horizontal' as const, y: 640, x1: 0, x2: 1600 },
    { type: 'horizontal' as const, y: 800, x1: 0, x2: 1600 },
    // Vertical roads
    { type: 'vertical' as const, x: 320, y1: 0, y2: 1280 },
    { type: 'vertical' as const, x: 640, y1: 0, y2: 1280 },
    { type: 'vertical' as const, x: 960, y1: 0, y2: 1280 },
    { type: 'vertical' as const, x: 1280, y1: 0, y2: 1280 },
  ];

  const isOnRoad = (x: number, y: number): boolean => {
    const tolerance = 40;
    for (const road of roads) {
      if (road.type === 'horizontal') {
        if (Math.abs(y - road.y) < tolerance && x >= road.x1 && x <= road.x2) return true;
      } else {
        if (Math.abs(x - road.x) < tolerance && y >= road.y1 && y <= road.y2) return true;
      }
    }
    return false;
  };

  const findClosestRoadPoint = (x: number, y: number): { x: number; y: number; dist: number } => {
    let closest: { x: number; y: number; dist: number } = { x, y, dist: Infinity };
    for (const road of roads) {
      if (road.type === 'horizontal') {
        const dist = Math.abs(y - road.y);
        if (dist < closest.dist && x >= road.x1 && x <= road.x2) {
          closest = { x, y: road.y, dist };
        }
      } else {
        const dist = Math.abs(x - road.x);
        if (dist < closest.dist && y >= road.y1 && y <= road.y2) {
          closest = { x: road.x, y, dist };
        }
      }
    }
    return closest;
  };

  const spawnCoins = (): Array<{ x: number; y: number }> => {
    const coins: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < 15; i++) {
      let x: number = 0;
      let y: number = 0;
      let onRoad = false;
      while (!onRoad) {
        x = Math.random() * MAP_WIDTH;
        y = Math.random() * MAP_HEIGHT;
        onRoad = isOnRoad(x, y);
      }
      coins.push({ x, y });
    }
    return coins;
  };

  const spawnAI = () => {
    const vehicles = [];
    const playerX = 800;
    const playerY = 640;
    const minDistance = 500; // Minimum distance from player (increased for safety)
    
    for (let i = 0; i < 4; i++) {
      let x: number = 0;
      let y: number = 0;
      let heading: number = 0;
      let validSpawn = false;
      
      // Keep trying until we find a valid spawn point
      while (!validSpawn) {
        const roadIndex = Math.floor(Math.random() * roads.length);
        const road = roads[roadIndex];
        
        if (road.type === 'horizontal') {
          x = Math.random() * (road.x2 - road.x1) + road.x1;
          y = road.y;
          heading = Math.random() > 0.5 ? 0 : Math.PI;
        } else {
          x = road.x;
          y = Math.random() * (road.y2 - road.y1) + road.y1;
          heading = Math.random() > 0.5 ? Math.PI / 2 : (3 * Math.PI) / 2;
        }
        
        // Check distance from player
        const dist = Math.hypot(x - playerX, y - playerY);
        if (dist > minDistance) {
          validSpawn = true;
        }
      }
      
      vehicles.push({
        x,
        y,
        heading,
        speed: 0.8 + Math.random() * 0.8,
      });
    }
    return vehicles;
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameStateRef.current;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw map with close-up camera
    if (mapImageRef.current && mapImageRef.current.complete) {
      const screenX = CANVAS_WIDTH / 2;
      const screenY = CANVAS_HEIGHT / 2;
      const mapX = state.playerX * CAMERA_ZOOM - screenX;
      const mapY = state.playerY * CAMERA_ZOOM - screenY;

      ctx.save();
      ctx.scale(CAMERA_ZOOM, CAMERA_ZOOM);
      ctx.drawImage(mapImageRef.current, -mapX / CAMERA_ZOOM, -mapY / CAMERA_ZOOM);
      ctx.restore();
    }

    // Draw coins
    for (const coin of state.coins) {
      const screenX = (coin.x - state.playerX) * CAMERA_ZOOM + CANVAS_WIDTH / 2;
      const screenY = (coin.y - state.playerY) * CAMERA_ZOOM + CANVAS_HEIGHT / 2;
      if (screenX > -20 && screenX < CANVAS_WIDTH + 20 && screenY > -20 && screenY < CANVAS_HEIGHT + 20) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw AI vehicles
    for (const vehicle of state.aiVehicles) {
      const screenX = (vehicle.x - state.playerX) * CAMERA_ZOOM + CANVAS_WIDTH / 2;
      const screenY = (vehicle.y - state.playerY) * CAMERA_ZOOM + CANVAS_HEIGHT / 2;
      if (screenX > -40 && screenX < CANVAS_WIDTH + 40 && screenY > -40 && screenY < CANVAS_HEIGHT + 40) {
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(vehicle.heading);
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(-12, -8, 24, 16);
        ctx.restore();
      }
    }

    // Draw player car (centered)
    ctx.save();
    ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.rotate(state.playerHeading);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(-10, -6, 20, 12);
    ctx.restore();

    // Draw HUD
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 100);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${state.score}`, 10, 25);
    ctx.fillText(`Time: ${state.time.toFixed(1)}s`, 200, 25);
    ctx.fillText(`Coins: ${state.coins.length}`, 400, 25);
    ctx.fillText(`Scenario: ${scenarios[state.scenarioIndex]}`, 10, 50);

    // Draw crashed overlay
    if (state.gameState === 'crashed') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CRASHED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.font = '20px Arial';
      ctx.fillText(`Final Score: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }

    // Draw idle overlay
    if (state.gameState === 'idle') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 - 80, 300, 160);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Pixel-Art City Driving', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      ctx.font = '14px Arial';
      ctx.fillText('Collect coins and avoid traffic.', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.fillText('Close-up camera view.', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5);
      ctx.fillText('Click Play Car to start.', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    }
  }, []);

  const loop = useCallback(() => {
    const state = gameStateRef.current;

    if (state.gameState === 'playing') {
      state.time += 1 / 60;

      // Update scenario
      state.scenarioTime += 1 / 60;
      if (state.scenarioTime > 15) {
        state.scenarioIndex = (state.scenarioIndex + 1) % scenarios.length;
        state.scenarioTime = 0;
      }

      // Player movement
      if (!playerStopped) {
        state.playerX += Math.cos(state.playerHeading) * state.playerSpeed;
        state.playerY += Math.sin(state.playerHeading) * state.playerSpeed;

        // 50/50 random turns at intersections
        state.lastTurnTime += 1 / 60;
        if (state.lastTurnTime > 2 + Math.random() * 3) {
          const rand = Math.random();
          if (rand < 0.33) {
            state.playerHeading -= Math.PI / 2;
          } else if (rand < 0.66) {
            state.playerHeading += Math.PI / 2;
          }
          state.lastTurnTime = 0;
        }

        // Wrap around map
        if (state.playerX < 0) state.playerX = MAP_WIDTH;
        if (state.playerX > MAP_WIDTH) state.playerX = 0;
        if (state.playerY < 0) state.playerY = MAP_HEIGHT;
        if (state.playerY > MAP_HEIGHT) state.playerY = 0;

        // Keep on road
        const closest = findClosestRoadPoint(state.playerX, state.playerY);
        if (closest.dist > 40) {
          state.playerX = closest.x;
          state.playerY = closest.y;
        }
      }

      // AI vehicle movement
      for (const vehicle of state.aiVehicles) {
        vehicle.x += Math.cos(vehicle.heading) * vehicle.speed;
        vehicle.y += Math.sin(vehicle.heading) * vehicle.speed;

        // Wrap around
        if (vehicle.x < 0) vehicle.x = MAP_WIDTH;
        if (vehicle.x > MAP_WIDTH) vehicle.x = 0;
        if (vehicle.y < 0) vehicle.y = MAP_HEIGHT;
        if (vehicle.y > MAP_HEIGHT) vehicle.y = 0;

        // Random turns
        if (Math.random() < 0.01) {
          if (Math.random() < 0.5) {
            vehicle.heading -= Math.PI / 2;
          } else {
            vehicle.heading += Math.PI / 2;
          }
        }
      }

      // Coin collection
      for (let i = state.coins.length - 1; i >= 0; i--) {
        const coin = state.coins[i];
        const dist = Math.hypot(coin.x - state.playerX, coin.y - state.playerY);
        if (dist < 30) {
          state.coins.splice(i, 1);
          state.score += 10;
        }
      }

      // Collision detection (only if not paused and grace period is over)
      if (!playerStopped && state.graceTime > 2) {
        for (const vehicle of state.aiVehicles) {
          const dist = Math.hypot(vehicle.x - state.playerX, vehicle.y - state.playerY);
          if (dist < 40) {
            state.gameState = 'crashed';
          }
        }
      }
      
      // Update grace time
      state.graceTime += 1 / 60;
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

  useEffect(() => {
    const img = new Image();
    img.src = '/manus-storage/90_ca1fa21b.png';
    img.onload = () => {
      mapImageRef.current = img;
    };
  }, []);

  const handlePlay = () => {
    gameStateRef.current.gameState = 'playing';
    gameStateRef.current.playerX = 800;
    gameStateRef.current.playerY = 640;
    gameStateRef.current.playerHeading = 0;
    gameStateRef.current.score = 0;
    gameStateRef.current.time = 0;
    gameStateRef.current.coins = spawnCoins();
    gameStateRef.current.aiVehicles = spawnAI();
    gameStateRef.current.lastTurnTime = 0;
    gameStateRef.current.graceTime = 0;
    setGameState('playing');
    setPlayerStopped(false);
  };

  const handlePause = () => {
    setPlayerStopped(!playerStopped);
  };

  const handleStop = () => {
    gameStateRef.current.gameState = 'idle';
    setGameState('idle');
    setPlayerStopped(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Traffic Jam: Pixel-Art City</h3>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-yellow-300 rounded-lg bg-black w-full"
      />
      <div className="flex gap-2 justify-center">
        <button
          onClick={handlePlay}
          disabled={gameState === 'playing'}
          className="px-6 py-2 bg-green-500 text-white font-bold rounded disabled:opacity-50"
        >
          ▶ Play Car
        </button>
        <button
          onClick={handlePause}
          disabled={gameState !== 'playing'}
          className="px-6 py-2 bg-yellow-500 text-white font-bold rounded disabled:opacity-50"
        >
          ⏸ Pause
        </button>
        <button
          onClick={handleStop}
          disabled={gameState === 'idle'}
          className="px-6 py-2 bg-red-500 text-white font-bold rounded disabled:opacity-50"
        >
          ⏹ Stop Car
        </button>
      </div>
    </div>
  );
};

export default TrafficRunnerGame;
