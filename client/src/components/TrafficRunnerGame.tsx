import React, { useState, useRef, useCallback, useEffect } from 'react';

const TrafficRunnerGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'crashed'>('idle');
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [coins, setCoins] = useState(0);
  const [playerStopped, setPlayerStopped] = useState(false);
  const stateRef = useRef({ score: 0, time: 0, coins: 0, gameState: 'idle' as const });
  const rafRef = useRef<number | undefined>(undefined);

  // ─── DMV Test Site Map Layout (actual coordinates) ───────────────────
  // Vertical roads (N-S): N Lind Ave, N Rogers Ave, Foster Ave, N Lockwood Ave, N Liano Ave
  // Horizontal roads (E-W): W Winona St, W Foster Ave, W Lovejoy Ave, W Liano Ave, W Carmen Ave
  // Plus diagonal roads and curves

  const roads = [
    // Vertical roads (N-S)
    { x1: 100, y1: 0, x2: 100, y2: 500, name: 'N Lind Ave' },
    { x1: 200, y1: 0, x2: 200, y2: 500, name: 'N Rogers Ave' },
    { x1: 300, y1: 0, x2: 300, y2: 500, name: 'Foster Ave' },
    { x1: 400, y1: 0, x2: 400, y2: 500, name: 'N Lockwood Ave' },
    { x1: 500, y1: 0, x2: 500, y2: 500, name: 'N Liano Ave' },

    // Horizontal roads (E-W)
    { x1: 0, y1: 100, x2: 600, y2: 100, name: 'W Winona St' },
    { x1: 0, y1: 200, x2: 600, y2: 200, name: 'W Foster Ave' },
    { x1: 0, y1: 300, x2: 600, y2: 300, name: 'W Lovejoy Ave' },
    { x1: 0, y1: 400, x2: 600, y2: 400, name: 'W Liano Ave' },
    { x1: 0, y1: 500, x2: 600, y2: 500, name: 'W Carmen Ave' },

    // Diagonal roads (approximation of the actual map)
    { x1: 150, y1: 0, x2: 50, y2: 200, name: 'Diagonal 1' },
    { x1: 450, y1: 0, x2: 550, y2: 200, name: 'Diagonal 2' },
  ];

  const intersections = [
    { x: 100, y: 100 }, { x: 200, y: 100 }, { x: 300, y: 100 }, { x: 400, y: 100 }, { x: 500, y: 100 },
    { x: 100, y: 200 }, { x: 200, y: 200 }, { x: 300, y: 200 }, { x: 400, y: 200 }, { x: 500, y: 200 },
    { x: 100, y: 300 }, { x: 200, y: 300 }, { x: 300, y: 300 }, { x: 400, y: 300 }, { x: 500, y: 300 },
    { x: 100, y: 400 }, { x: 200, y: 400 }, { x: 300, y: 400 }, { x: 400, y: 400 }, { x: 500, y: 400 },
  ];

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

  const gameStateRef = useRef({
    playerX: 300,
    playerY: 450,
    playerHeading: 0,
    playerSpeed: 3.75,
    playerStopped: false,
    aiVehicles: [] as Array<{ x: number; y: number; heading: number; speed: number; roadIndex: number }>,
    coins: [] as Array<{ x: number; y: number; collected: boolean }>,
    scenarioIndex: 0,
    scenarioTime: 0,
    trafficLightStates: new Map<number, 'red' | 'green'>(),
    trafficLightTime: 0,
    gameState: 'idle' as 'idle' | 'playing' | 'crashed',
    score: 0,
    time: 0,
  });

  const findClosestRoadPoint = (x: number, y: number) => {
    let closest = { x, y, heading: 0 };
    let minDist = Infinity;

    for (const road of roads) {
      const dx = road.x2 - road.x1;
      const dy = road.y2 - road.y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const t = Math.max(0, Math.min(1, ((x - road.x1) * dx + (y - road.y1) * dy) / (len * len)));
      const px = road.x1 + t * dx;
      const py = road.y1 + t * dy;
      const dist = Math.hypot(x - px, y - py);

      if (dist < minDist) {
        minDist = dist;
        closest = { x: px, y: py, heading: Math.atan2(dy, dx) };
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

    // Clear canvas
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw roads
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 40;
    for (const road of roads) {
      ctx.beginPath();
      ctx.moveTo(road.x1, road.y1);
      ctx.lineTo(road.x2, road.y2);
      ctx.stroke();
    }

    // Draw road center lines
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    for (const road of roads) {
      ctx.beginPath();
      ctx.moveTo(road.x1, road.y1);
      ctx.lineTo(road.x2, road.y2);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw traffic lights at intersections
    for (let i = 0; i < intersections.length; i++) {
      const inter = intersections[i];
      const state = gameStateRef.current.trafficLightStates.get(i) || 'red';

      // Top-left light
      ctx.fillStyle = state === 'green' ? '#00FF00' : '#FF0000';
      ctx.beginPath();
      ctx.arc(inter.x - 25, inter.y - 25, 8, 0, Math.PI * 2);
      ctx.fill();

      // Top-right light
      ctx.fillStyle = state === 'green' ? '#00FF00' : '#FF0000';
      ctx.beginPath();
      ctx.arc(inter.x + 25, inter.y - 25, 8, 0, Math.PI * 2);
      ctx.fill();

      // Bottom-left light
      ctx.fillStyle = state === 'green' ? '#00FF00' : '#FF0000';
      ctx.beginPath();
      ctx.arc(inter.x - 25, inter.y + 25, 8, 0, Math.PI * 2);
      ctx.fill();

      // Bottom-right light
      ctx.fillStyle = state === 'green' ? '#00FF00' : '#FF0000';
      ctx.beginPath();
      ctx.arc(inter.x + 25, inter.y + 25, 8, 0, Math.PI * 2);
      ctx.fill();

      // Stop sign at bottom-right
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.moveTo(inter.x + 35, inter.y + 30);
      ctx.lineTo(inter.x + 45, inter.y + 30);
      ctx.lineTo(inter.x + 45, inter.y + 40);
      ctx.lineTo(inter.x + 35, inter.y + 40);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('S', inter.x + 40, inter.y + 37);
    }

    // Draw coins
    ctx.fillStyle = '#FFD700';
    for (const coin of gameStateRef.current.coins) {
      if (!coin.collected) {
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw AI vehicles
    ctx.fillStyle = '#FF0000';
    for (const vehicle of gameStateRef.current.aiVehicles) {
      ctx.save();
      ctx.translate(vehicle.x, vehicle.y);
      ctx.rotate(vehicle.heading);
      ctx.fillRect(-7, -5, 14, 10);
      ctx.restore();
    }

    // Draw player car
    ctx.fillStyle = '#00FF00';
    ctx.save();
    ctx.translate(gameStateRef.current.playerX, gameStateRef.current.playerY);
    ctx.rotate(gameStateRef.current.playerHeading);
    ctx.fillRect(-7, -5, 14, 10);
    ctx.restore();

    // Draw HUD
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, 600, 50);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${gameStateRef.current.score}`, 10, 20);
    ctx.fillText(`Time: ${gameStateRef.current.time}s`, 150, 20);
    ctx.fillText(`Coins: ${gameStateRef.current.coins}`, 300, 20);

    // Draw scenario
    const scenario = scenarios[gameStateRef.current.scenarioIndex % scenarios.length];
    ctx.fillStyle = '#FFFF00';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`⚠ ${scenario.name}`, 300, 35);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.fillText(scenario.law, 300, 50);

    // Draw idle screen
    if (gameStateRef.current.gameState === 'idle') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(150, 150, 300, 200);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Street Navigation', 300, 180);
      ctx.font = '14px Arial';
      ctx.fillText('Collect coins while driving.', 300, 210);
      ctx.fillText('Avoid AI traffic to survive.', 300, 230);
      ctx.fillText('Click Play Car to start.', 300, 250);
    }

    // Draw crashed screen
    if (gameStateRef.current.gameState === 'crashed') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, 600, 500);
      ctx.fillStyle = '#FF0000';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CRASHED!', 300, 200);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px Arial';
      ctx.fillText(`Final Score: ${gameStateRef.current.score}`, 300, 250);
      ctx.fillText('Click Play Car to retry', 300, 300);
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
      for (let i = 0; i < intersections.length; i++) {
        state.trafficLightStates.set(i, state.trafficLightTime < 15 ? 'red' : 'green');
      }

      // Player movement
      if (!playerStopped) {
        const closest = findClosestRoadPoint(state.playerX, state.playerY);
        state.playerHeading = closest.heading;
        state.playerX += Math.cos(closest.heading) * state.playerSpeed;
        state.playerY += Math.sin(closest.heading) * state.playerSpeed;

        // Wrap around
        if (state.playerX < 0) state.playerX = 600;
        if (state.playerX > 600) state.playerX = 0;
        if (state.playerY < 0) state.playerY = 500;
        if (state.playerY > 500) state.playerY = 0;
      }

      // AI vehicle movement
        if (state.aiVehicles.length === 0) {
        for (let i = 0; i < 5; i++) {
          const roadIndex = Math.floor(Math.random() * roads.length);
          const road = roads[roadIndex];
          const t = Math.random();
          state.aiVehicles.push({
            x: road.x1 + t * (road.x2 - road.x1),
            y: road.y1 + t * (road.y2 - road.y1),
            heading: Math.atan2(road.y2 - road.y1, road.x2 - road.x1),
            speed: 1 + Math.random() * 2,
            roadIndex,
          });
        }
      }

      for (let i = 0; i < state.aiVehicles.length; i++) {
        const vehicle = state.aiVehicles[i];
        vehicle.x += Math.cos(vehicle.heading) * vehicle.speed;
        vehicle.y += Math.sin(vehicle.heading) * vehicle.speed;

        // Wrap around
        if (vehicle.x < 0 || vehicle.x > 600 || vehicle.y < 0 || vehicle.y > 500) {
          const roadIndex = Math.floor(Math.random() * roads.length);
          const road = roads[roadIndex];
          const t = Math.random();
          vehicle.x = road.x1 + t * (road.x2 - road.x1);
          vehicle.y = road.y1 + t * (road.y2 - road.y1);
          vehicle.heading = Math.atan2(road.y2 - road.y1, road.x2 - road.x1);
          vehicle.roadIndex = roadIndex;
        }

        // Collision with player
        if (Math.hypot(state.playerX - vehicle.x, state.playerY - vehicle.y) < 15) {
          state.gameState = 'crashed';
        }
      }

      // Coin collection
      if (state.coins.length === 0) {
        for (let i = 0; i < 10; i++) {
          let x, y;
          do {
            x = Math.random() * 600;
            y = Math.random() * 500;
          } while (!isOnRoad(x, y));
          state.coins.push({ x, y, collected: false });
        }
      }

      for (const coin of state.coins) {
        if (!coin.collected && Math.hypot(state.playerX - coin.x, state.playerY - coin.y) < 15) {
          coin.collected = true;
          state.coins = state.coins.filter(c => !c.collected);
          state.score += 10;
          state.coins.push({ x: Math.random() * 600, y: Math.random() * 500, collected: false });
        }
      }

      setScore(state.score);
      setTime(Math.floor(state.time));
      setCoins(state.coins.filter(c => !c.collected).length);
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
    gameStateRef.current.playerX = 300;
    gameStateRef.current.playerY = 450;
    gameStateRef.current.score = 0;
    gameStateRef.current.time = 0;
    gameStateRef.current.coins = [];
    gameStateRef.current.aiVehicles = [];
    setGameState('playing');
    setScore(0);
    setTime(0);
    setCoins(0);
  };

  const handlePause = () => {
    setPlayerStopped(!playerStopped);
  };

  const handleStop = () => {
    gameStateRef.current.gameState = 'idle';
    gameStateRef.current.playerX = 300;
    gameStateRef.current.playerY = 450;
    gameStateRef.current.score = 0;
    gameStateRef.current.time = 0;
    gameStateRef.current.coins = [];
    gameStateRef.current.aiVehicles = [];
    setGameState('idle');
    setScore(0);
    setTime(0);
    setCoins(0);
    setPlayerStopped(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Traffic Jam: Intersection Simulator</h3>
      <canvas
        ref={canvasRef}
        width={600}
        height={500}
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
          className="px-6 py-2 bg-red-500 text-white rounded font-bold"
        >
          ⏹ Stop Car
        </button>
      </div>
    </div>
  );
};

export default TrafficRunnerGame;
