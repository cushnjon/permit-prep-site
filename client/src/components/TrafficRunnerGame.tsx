import React, { useRef, useState, useEffect } from 'react';

const TrafficRunnerGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapImageRef = useRef<HTMLImageElement | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'crashed'>('idle');
  const [playerStopped, setPlayerStopped] = useState(false);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const CAMERA_ZOOM = 3; // Close-up zoom level
  const MAP_WIDTH = 1408;
  const MAP_HEIGHT = 768;
  const CAR_SIZE = 12;

  const gameStateRef = useRef<{
    playerX: number;
    playerY: number;
    playerHeading: number; // 0=up, 90=right, 180=down, 270=left
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
    playerX: 200,
    playerY: 96,
    playerHeading: 0,
    playerSpeed: 2.0,
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

  // Road network - lanes on the city map
  // Horizontal roads (y-coordinates)
  const horizontalRoads = [
    { y: 96, lanes: [80, 112] },      // Top road
    { y: 224, lanes: [208, 240] },    // Second road
    { y: 352, lanes: [336, 368] },    // Middle road
    { y: 480, lanes: [464, 496] },    // Fourth road
    { y: 608, lanes: [592, 624] },    // Bottom road
  ];

  // Vertical roads (x-coordinates)
  const verticalRoads = [
    { x: 96, lanes: [80, 112] },      // Left road
    { x: 224, lanes: [208, 240] },    // Second road
    { x: 352, lanes: [336, 368] },    // Middle road
    { x: 480, lanes: [464, 496] },    // Fourth road
    { x: 608, lanes: [592, 624] },    // Fifth road
    { x: 736, lanes: [720, 752] },    // Sixth road
    { x: 864, lanes: [848, 880] },    // Seventh road
    { x: 992, lanes: [976, 1008] },   // Eighth road
    { x: 1120, lanes: [1104, 1136] }, // Ninth road
    { x: 1248, lanes: [1232, 1264] }, // Right road
  ];

  // Get the current road the car is on
  const getCurrentRoad = (x: number, y: number, heading: number): { road: any; type: string } | null => {
    const tolerance = 30;
    
    if (heading === 0 || heading === 180) {
      // Moving vertically - check horizontal roads
      for (const road of horizontalRoads) {
        if (Math.abs(y - road.y) < tolerance) {
          return { road, type: 'horizontal' };
        }
      }
    } else if (heading === 90 || heading === 270) {
      // Moving horizontally - check vertical roads
      for (const road of verticalRoads) {
        if (Math.abs(x - road.x) < tolerance) {
          return { road, type: 'vertical' };
        }
      }
    }
    return null;
  };

  // Keep car centered in lane
  const keepInLane = (x: number, y: number, heading: number): { x: number; y: number } => {
    const roadInfo = getCurrentRoad(x, y, heading);
    if (!roadInfo) return { x, y };

    const { road, type } = roadInfo;
    if (type === 'horizontal') {
      // Snap to center of lane
      const centerY = road.y;
      return { x, y: centerY };
    } else {
      // Snap to center of lane
      const centerX = road.x;
      return { x: centerX, y };
    }
  };

  // Check if can turn at intersection
  const canTurnAtIntersection = (x: number, y: number): boolean => {
    const tolerance = 50; // Increased tolerance for easier turning
    let onHorizontal = false;
    let onVertical = false;

    for (const road of horizontalRoads) {
      if (Math.abs(y - road.y) < tolerance) onHorizontal = true;
    }
    for (const road of verticalRoads) {
      if (Math.abs(x - road.x) < tolerance) onVertical = true;
    }

    return onHorizontal && onVertical;
  };

  // Get next heading after turn
  const getNextHeading = (currentHeading: number, turnDirection: 'left' | 'right'): number => {
    if (turnDirection === 'left') {
      return (currentHeading - 90 + 360) % 360;
    } else {
      return (currentHeading + 90) % 360;
    }
  };

  // Move car forward
  const moveForward = (x: number, y: number, heading: number, speed: number): { x: number; y: number } => {
    const radians = (heading * Math.PI) / 180;
    const newX: number = x - Math.sin(radians) * speed;
    const newY: number = y - Math.cos(radians) * speed;

    // Keep in bounds
    const boundX: number = Math.max(CAR_SIZE, Math.min(MAP_WIDTH - CAR_SIZE, newX));
    const boundY: number = Math.max(CAR_SIZE, Math.min(MAP_HEIGHT - CAR_SIZE, newY));

    return { x: boundX, y: boundY };
  };

  const spawnCoins = (): Array<{ x: number; y: number }> => {
    const coins: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < 15; i++) {
      let x: number = 0, y: number = 0, valid = false;
      while (!valid) {
        x = Math.random() * (MAP_WIDTH - 100) + 50;
        y = Math.random() * (MAP_HEIGHT - 100) + 50;
        // Place coins on roads
        const onHorizontal = horizontalRoads.some(r => Math.abs(y - r.y) < 30);
        const onVertical = verticalRoads.some(r => Math.abs(x - r.x) < 30);
        valid = onHorizontal || onVertical;
      }
      coins.push({ x, y });
    }
    return coins;
  };

  const spawnAI = (): Array<{ x: number; y: number; heading: number; speed: number }> => {
    const vehicles: Array<{ x: number; y: number; heading: number; speed: number }> = [];
    for (let i = 0; i < 4; i++) {
      const roadType = Math.random() > 0.5 ? 'horizontal' : 'vertical';
      let x: number = 0, y: number = 0, heading: number = 0, speed: number = 0;

      if (roadType === 'horizontal') {
        const road = horizontalRoads[Math.floor(Math.random() * horizontalRoads.length)];
        x = Math.random() * MAP_WIDTH;
        y = road.y;
        heading = Math.random() > 0.5 ? 90 : 270;
        speed = 0.8 + Math.random() * 0.8;
      } else {
        const road = verticalRoads[Math.floor(Math.random() * verticalRoads.length)];
        x = road.x;
        y = Math.random() * MAP_HEIGHT;
        heading = Math.random() > 0.5 ? 0 : 180;
        speed = 0.8 + Math.random() * 0.8;
      }

      vehicles.push({ x, y, heading, speed });
    }
    return vehicles;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameStateRef.current;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw map with camera following player
    if (mapImageRef.current) {
      const cameraX = state.playerX - CANVAS_WIDTH / (2 * CAMERA_ZOOM);
      const cameraY = state.playerY - CANVAS_HEIGHT / (2 * CAMERA_ZOOM);

      ctx.save();
      ctx.scale(CAMERA_ZOOM, CAMERA_ZOOM);
      ctx.drawImage(mapImageRef.current, -cameraX, -cameraY);
      ctx.restore();
    }

    // Draw AI vehicles
    ctx.fillStyle = '#ff6b6b';
    for (const vehicle of state.aiVehicles) {
      const screenX = (vehicle.x - (state.playerX - CANVAS_WIDTH / (2 * CAMERA_ZOOM))) * CAMERA_ZOOM;
      const screenY = (vehicle.y - (state.playerY - CANVAS_HEIGHT / (2 * CAMERA_ZOOM))) * CAMERA_ZOOM;

      if (screenX > -20 && screenX < CANVAS_WIDTH + 20 && screenY > -20 && screenY < CANVAS_HEIGHT + 20) {
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate((vehicle.heading * Math.PI) / 180);
        ctx.fillRect(-CAR_SIZE / 2, -CAR_SIZE, CAR_SIZE, CAR_SIZE * 2);
        ctx.restore();
      }
    }

    // Draw coins
    ctx.fillStyle = '#ffeb3b';
    for (const coin of state.coins) {
      const screenX = (coin.x - (state.playerX - CANVAS_WIDTH / (2 * CAMERA_ZOOM))) * CAMERA_ZOOM;
      const screenY = (coin.y - (state.playerY - CANVAS_HEIGHT / (2 * CAMERA_ZOOM))) * CAMERA_ZOOM;

      if (screenX > -10 && screenX < CANVAS_WIDTH + 10 && screenY > -10 && screenY < CANVAS_HEIGHT + 10) {
        ctx.beginPath();
        ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw player car (green)
    ctx.fillStyle = '#4caf50';
    ctx.save();
    ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.rotate((state.playerHeading * Math.PI) / 180);
    ctx.fillRect(-CAR_SIZE / 2, -CAR_SIZE, CAR_SIZE, CAR_SIZE * 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(-CAR_SIZE / 2, -CAR_SIZE, CAR_SIZE, CAR_SIZE * 2);
    ctx.restore();

    // Draw HUD
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 300, 80);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`Score: ${state.score}`, 10, 20);
    ctx.fillText(`Time: ${(state.time / 60).toFixed(1)}s`, 10, 40);
    ctx.fillText(`Coins: ${state.coins.length - Math.floor(state.score / 10)}`, 10, 60);

    ctx.font = 'bold 12px monospace';
    ctx.fillText(`Scenario: ${scenarios[state.scenarioIndex]}`, 10, 75);
  };

  const loop = () => {
    const state = gameStateRef.current;

    if (state.gameState === 'playing' && !playerStopped) {
      // Update time
      state.time += 1;
      state.graceTime += 1 / 60;
      state.scenarioTime += 1 / 60;

      // Rotate scenario every 15 seconds
      if (state.scenarioTime > 15) {
        state.scenarioIndex = (state.scenarioIndex + 1) % scenarios.length;
        state.scenarioTime = 0;
      }

      // Move player car forward
      let newPos = moveForward(state.playerX, state.playerY, state.playerHeading, state.playerSpeed);
      newPos = keepInLane(newPos.x, newPos.y, state.playerHeading);
      state.playerX = newPos.x;
      state.playerY = newPos.y;

      // Random turns at intersections (50% chance every 1 second)
      if (state.time % 60 === 0 && canTurnAtIntersection(state.playerX, state.playerY)) {
        if (Math.random() > 0.5) {
          state.playerHeading = getNextHeading(state.playerHeading, 'left');
          state.lastTurnTime = state.time;
        } else {
          state.playerHeading = getNextHeading(state.playerHeading, 'right');
          state.lastTurnTime = state.time;
        }
      }

      // Move AI vehicles
      for (const vehicle of state.aiVehicles) {
        let aiPos = moveForward(vehicle.x, vehicle.y, vehicle.heading, vehicle.speed);

        // Random turns at intersections
        if (Math.random() > 0.98 && canTurnAtIntersection(aiPos.x, aiPos.y)) {
          vehicle.heading = getNextHeading(vehicle.heading, Math.random() > 0.5 ? 'left' : 'right');
        }

        // Keep in bounds
        if (aiPos.x < 0 || aiPos.x > MAP_WIDTH || aiPos.y < 0 || aiPos.y > MAP_HEIGHT) {
          vehicle.x = Math.random() * MAP_WIDTH;
          vehicle.y = Math.random() * MAP_HEIGHT;
        } else {
          vehicle.x = aiPos.x;
          vehicle.y = aiPos.y;
        }
      }

      // Coin collection
      state.coins = state.coins.filter(coin => {
        const dist = Math.hypot(coin.x - state.playerX, coin.y - state.playerY);
        if (dist < 20) {
          state.score += 10;
          return false;
        }
        return true;
      });

      // Collision detection (only if not paused and grace period is over)
      if (!playerStopped && state.graceTime > 2) {
        for (const vehicle of state.aiVehicles) {
          const dist = Math.hypot(vehicle.x - state.playerX, vehicle.y - state.playerY);
          if (dist < 40) {
            state.gameState = 'crashed';
          }
        }
      }
    }

    draw();
    rafRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    const img = new Image();
    img.src = '/manus-storage/city-map_781596a2.png';
    img.onload = () => {
      mapImageRef.current = img;
    };
  }, []);

  const handlePlay = () => {
    gameStateRef.current.gameState = 'playing';
    gameStateRef.current.playerX = 200;
    gameStateRef.current.playerY = 96;
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

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="w-full bg-gray-900 rounded-lg overflow-hidden">
      <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full"
        />
      </div>

      <div className="flex gap-2 p-4 bg-gray-800 justify-center">
        <button
          onClick={handlePlay}
          disabled={gameState === 'playing'}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          ▶ Play Car
        </button>
        <button
          onClick={handlePause}
          disabled={gameState !== 'playing'}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
        >
          ⏸ Pause
        </button>
        <button
          onClick={handleStop}
          disabled={gameState === 'idle'}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          ⏹ Stop Car
        </button>
      </div>
    </div>
  );
};

export default TrafficRunnerGame;
