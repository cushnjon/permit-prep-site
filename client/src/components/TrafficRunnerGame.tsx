import React, { useRef, useEffect, useState, useCallback } from 'react';

const CANVAS_W = 280;
const CANVAS_H = 400;
const CAR_SIZE = 14;
const ROAD_WIDTH = 42;
const INTERSECTION_SIZE = 50;
const LIGHT_CYCLE = 30;

// ─── Road Network Definition ────────────────────────────────
const ROADS = [
  { name: 'N Lind Ave', points: [[100, -200], [100, 600]] },
  { name: 'N Rogers Ave', points: [[150, -200], [150, 600]] },
  { name: 'Foster Ave', points: [[200, -200], [200, 600]] },
  { name: 'N Lockwood Ave', points: [[50, -200], [50, 600]] },
  { name: 'N Liano Ave', points: [[250, -200], [250, 600]] },
  { name: 'W Winona St', points: [[-200, 100], [600, 100]] },
  { name: 'W Foster Ave', points: [[-200, 150], [600, 150]] },
  { name: 'W Lovejoy Ave', points: [[-200, 200], [600, 200]] },
  { name: 'W Liano Ave', points: [[-200, 250], [600, 250]] },
  { name: 'W Carmen Ave', points: [[-200, 300], [600, 300]] },
  { name: 'Diagonal 1', points: [[-100, -100], [400, 400]] },
  { name: 'Diagonal 2', points: [[400, -100], [-100, 400]] },
];

// ─── Intersections ────────────────────────────────
const INTERSECTIONS = [
  { x: 100, y: 100, control: 'light' },
  { x: 100, y: 150, control: 'sign' },
  { x: 150, y: 100, control: 'light' },
  { x: 150, y: 200, control: 'sign' },
  { x: 200, y: 150, control: 'light' },
  { x: 50, y: 100, control: 'sign' },
  { x: 250, y: 200, control: 'light' },
  { x: 100, y: 250, control: 'sign' },
  { x: 150, y: 300, control: 'light' },
  { x: 200, y: 250, control: 'sign' },
];

// ─── DMV Scenarios ────────────────────────────────
const SCENARIOS = [
  { name: 'Unprotected Left Turn', law: 'Yield to ALL oncoming traffic before turning left' },
  { name: 'Right Turn—Pedestrian', law: 'Yield to pedestrians crossing the street' },
  { name: '4-Way Stop', law: 'First to stop has right-of-way; yield if equal' },
  { name: 'Emergency Vehicle', law: 'Pull over immediately for sirens/lights' },
  { name: 'T-Intersection', law: 'Vehicle on main road has right-of-way' },
  { name: 'Roundabout Entry', law: 'Yield to traffic already in the roundabout' },
  { name: 'Driveway Exit', law: 'Yield to all traffic on the main road' },
  { name: 'Green Light Left Turn', law: 'Yield to oncoming traffic even with green light' },
];

// ─── Helper: Find closest point on road ────────────────────────────────
function findClosestRoadPoint(x: number, y: number): { dist: number; x: number; y: number; roadName: string } {
  let closest: { dist: number; x: number; y: number; roadName: string } = { dist: Infinity, x, y, roadName: 'Unknown' };

  ROADS.forEach((road) => {
    for (let i = 0; i < road.points.length - 1; i++) {
      const [x1, y1] = road.points[i];
      const [x2, y2] = road.points[i + 1];

      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;

      let t = ((x - x1) * dx + (y - y1) * dy) / (len * len);
      t = Math.max(0, Math.min(1, t));

      const closestX = x1 + t * dx;
      const closestY = y1 + t * dy;
      const dist = Math.hypot(x - closestX, y - closestY);

      if (dist < closest.dist && dist < ROAD_WIDTH / 2 + 10) {
        closest = { dist, x: closestX, y: closestY, roadName: road.name };
      }
    }
  });

  return closest;
}

// ─── Helper: Check if point is on a road ────────────────────────────────
function isOnRoad(x: number, y: number): boolean {
  const closest = findClosestRoadPoint(x, y);
  return closest.dist < ROAD_WIDTH / 2;
}

// ─── Helper: Find nearest intersection ────────────────────────────────
function findNearestIntersection(x: number, y: number): (typeof INTERSECTIONS)[0] | null {
  let nearest: (typeof INTERSECTIONS)[0] | null = null;
  let minDist = INTERSECTION_SIZE;

  INTERSECTIONS.forEach((inter) => {
    const dist = Math.hypot(x - inter.x, y - inter.y);
    if (dist < minDist) {
      minDist = dist;
      nearest = inter;
    }
  });

  return nearest;
}

// ─── Helper: Check if light is green ────────────────────────────────
function isLightGreen(time: number): boolean {
  const cycleTime = time % LIGHT_CYCLE;
  return cycleTime >= LIGHT_CYCLE / 2; // Green for second half of cycle
}

// ─── AI Traffic Vehicle ────────────────────────────────
interface AIVehicle {
  x: number;
  y: number;
  heading: number;
  speed: number;
  roadIndex: number;
  progress: number;
}

// ─── Game State ────────────────────────────────
interface GameState {
  phase: 'idle' | 'playing' | 'crashed' | 'timeout';
  playerX: number;
  playerY: number;
  playerHeading: number;
  score: number;
  time: number;
  coins: number;
  coinsCollected: number;
  scenarioIndex: number;
  aiVehicles: AIVehicle[];
}

function TrafficRunnerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>({
    phase: 'idle',
    playerX: 100,
    playerY: 400,
    playerHeading: 0,
    score: 0,
    time: 0,
    coins: 0,
    coinsCollected: 0,
    scenarioIndex: 0,
    aiVehicles: [],
  });
  const [isPaused, setIsPaused] = useState(false);
  const rafRef = useRef<number | null>(null);

  // ─── Initialize AI vehicles ────────────────────────────────
  const initializeAIVehicles = useCallback(() => {
    const vehicles: AIVehicle[] = [];
    for (let i = 0; i < 5; i++) {
      const roadIndex = Math.floor(Math.random() * ROADS.length);
      const road = ROADS[roadIndex];
      const progress = Math.random();
      const [x1, y1] = road.points[0];
      const [x2, y2] = road.points[1];
      const x = x1 + (x2 - x1) * progress;
      const y = y1 + (y2 - y1) * progress;
      const heading = Math.atan2(y2 - y1, x2 - x1) / (Math.PI / 2);

      vehicles.push({
        x,
        y,
        heading,
        speed: 1 + Math.random() * 0.5,
        roadIndex,
        progress,
      });
    }
    return vehicles;
  }, []);

  // ─── Spawn coins ────────────────────────────────
  const spawnCoins = useCallback(() => {
    const coins = [];
    for (let i = 0; i < 8; i++) {
      const roadIndex = Math.floor(Math.random() * ROADS.length);
      const road = ROADS[roadIndex];
      const progress = Math.random();
      const [x1, y1] = road.points[0];
      const [x2, y2] = road.points[1];
      const x = x1 + (x2 - x1) * progress;
      const y = y1 + (y2 - y1) * progress;
      coins.push({ x, y, collected: false });
    }
    return coins;
  }, []);

  // ─── Start game ────────────────────────────────
  const startGame = useCallback(() => {
    stateRef.current = {
      phase: 'playing',
      playerX: 100,
      playerY: 400,
      playerHeading: 0,
      score: 0,
      time: 0,
      coins: 0,
      coinsCollected: 0,
      scenarioIndex: 0,
      aiVehicles: initializeAIVehicles(),
    };
    setIsPaused(false);
  }, [initializeAIVehicles]);

  // ─── Canvas drawing functions ────────────────────────────────
  const drawMap = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.strokeStyle = '#999';
    ctx.lineWidth = 3;
    ROADS.forEach((road) => {
      const screenPoints = road.points.map(([x, y]) => [
        CANVAS_W / 2 + x - stateRef.current.playerX,
        CANVAS_H / 2 + y - stateRef.current.playerY,
      ]);
      ctx.beginPath();
      ctx.moveTo(screenPoints[0][0], screenPoints[0][1]);
      for (let i = 1; i < screenPoints.length; i++) {
        ctx.lineTo(screenPoints[i][0], screenPoints[i][1]);
      }
      ctx.stroke();
    });

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ROADS.forEach((road) => {
      const screenPoints = road.points.map(([x, y]) => [
        CANVAS_W / 2 + x - stateRef.current.playerX,
        CANVAS_H / 2 + y - stateRef.current.playerY,
      ]);
      ctx.beginPath();
      ctx.moveTo(screenPoints[0][0], screenPoints[0][1]);
      for (let i = 1; i < screenPoints.length; i++) {
        ctx.lineTo(screenPoints[i][0], screenPoints[i][1]);
      }
      ctx.stroke();
    });
    ctx.setLineDash([]);
  }, []);

  const drawCar = useCallback((ctx: CanvasRenderingContext2D) => {
    const carScreenX = CANVAS_W / 2;
    const carScreenY = CANVAS_H / 2;

    ctx.save();
    ctx.translate(carScreenX, carScreenY);
    ctx.rotate((stateRef.current.playerHeading * Math.PI) / 2);

    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-CAR_SIZE / 2, -CAR_SIZE / 2, CAR_SIZE, CAR_SIZE);

    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-CAR_SIZE / 2 + 2, -CAR_SIZE / 2, CAR_SIZE - 4, 4);

    ctx.restore();
  }, []);

  const drawAIVehicles = useCallback((ctx: CanvasRenderingContext2D) => {
    stateRef.current.aiVehicles.forEach((vehicle) => {
      const screenX = CANVAS_W / 2 + vehicle.x - stateRef.current.playerX;
      const screenY = CANVAS_H / 2 + vehicle.y - stateRef.current.playerY;

      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate((vehicle.heading * Math.PI) / 2);

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-CAR_SIZE / 2, -CAR_SIZE / 2, CAR_SIZE, CAR_SIZE);

      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(-CAR_SIZE / 2 + 2, -CAR_SIZE / 2, CAR_SIZE - 4, 4);

      ctx.restore();
    });
  }, []);

  const drawCoins = useCallback((ctx: CanvasRenderingContext2D) => {
    const coins: any[] = [];
    coins.forEach((coin) => {
      if (coin.collected) return;
      const screenX = CANVAS_W / 2 + coin.x - stateRef.current.playerX;
      const screenY = CANVAS_H / 2 + coin.y - stateRef.current.playerY;

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }, []);

  const drawHUD = useCallback((ctx: CanvasRenderingContext2D, s: GameState) => {
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${s.score}`, 8, 12);
    ctx.fillText(`Time: ${s.time.toFixed(1)}s`, 8, 25);
    ctx.fillText(`Coins: ${s.coinsCollected}`, 8, 38);

    const scenario = SCENARIOS[s.scenarioIndex % SCENARIOS.length];
    ctx.fillStyle = '#d97706';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(scenario.name, CANVAS_W / 2, CANVAS_H - 8);
  }, []);

  // ─── Game loop ────────────────────────────────
  const gameLoop = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'playing' || isPaused) {
      rafRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // Update time
    s.time += 0.016;
    if (s.time > 120) {
      s.phase = 'timeout';
      return;
    }

    // Update scenario every 15 seconds
    s.scenarioIndex = Math.floor(s.time / 15);

    // Move player forward automatically
    const moveDistance = 1.5;
    const newX = s.playerX + Math.cos((s.playerHeading * Math.PI) / 2) * moveDistance;
    const newY = s.playerY + Math.sin((s.playerHeading * Math.PI) / 2) * moveDistance;

    if (isOnRoad(newX, newY)) {
      s.playerX = newX;
      s.playerY = newY;
    } else {
      // Wrap around to opposite side
      const closest = findClosestRoadPoint(newX, newY);
      s.playerX = closest.x;
      s.playerY = closest.y;
    }

    // Update AI vehicles
    s.aiVehicles.forEach((vehicle) => {
      const road = ROADS[vehicle.roadIndex];
      vehicle.progress += vehicle.speed / 1000;

      if (vehicle.progress > 1) {
        vehicle.progress = 0;
        vehicle.roadIndex = Math.floor(Math.random() * ROADS.length);
      }

      const [x1, y1] = road.points[0];
      const [x2, y2] = road.points[1];
      vehicle.x = x1 + (x2 - x1) * vehicle.progress;
      vehicle.y = y1 + (y2 - y1) * vehicle.progress;
      vehicle.heading = Math.atan2(y2 - y1, x2 - x1) / (Math.PI / 2);

      // Collision detection
      const dist = Math.hypot(s.playerX - vehicle.x, s.playerY - vehicle.y);
      if (dist < CAR_SIZE) {
        s.phase = 'crashed';
      }
    });

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [isPaused]);

  // ─── Render effect ────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const s = stateRef.current;

    if (s.phase === 'idle') {
      drawMap(ctx);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(0, CANVAS_H / 2 - 70, CANVAS_W, 120);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, CANVAS_H / 2 - 70, CANVAS_W, 120);
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Street Navigation', CANVAS_W / 2, CANVAS_H / 2 - 35);
      ctx.fillStyle = '#666';
      ctx.font = '11px Arial';
      ctx.fillText('Follow the roads and collect coins', CANVAS_W / 2, CANVAS_H / 2 - 10);
      ctx.fillText('Avoid AI traffic to survive', CANVAS_W / 2, CANVAS_H / 2 + 8);
      ctx.fillStyle = '#d97706';
      ctx.font = 'bold 10px Arial';
      ctx.fillText('8 DMV Right-of-Way Scenarios', CANVAS_W / 2, CANVAS_H / 2 + 28);
      drawCar(ctx);
      return;
    }

    drawMap(ctx);
    drawAIVehicles(ctx);
    drawCar(ctx);
    drawHUD(ctx, s);

    if (s.phase === 'crashed') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 30px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CRASHED!', CANVAS_W / 2, CANVAS_H / 2 - 14);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '13px Arial';
      ctx.fillText(`${s.score} pts`, CANVAS_W / 2, CANVAS_H / 2 + 12);
    }

    if (s.phase === 'timeout') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 30px Arial';
      ctx.textAlign = 'center';
      ctx.fillText("TIME'S UP!", CANVAS_W / 2, CANVAS_H / 2 - 14);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '13px Arial';
      ctx.fillText(`${s.score} pts`, CANVAS_W / 2, CANVAS_H / 2 + 12);
    }
  }, [drawMap, drawCar, drawAIVehicles, drawHUD]);

  // ─── Start game loop ────────────────────────────────
  useEffect(() => {
    rafRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [gameLoop]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="border-2 border-dashed border-red-500 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="block"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            if (stateRef.current.phase === 'idle') {
              startGame();
            }
          }}
          disabled={stateRef.current.phase !== 'idle'}
          className="px-4 py-2 bg-green-500 text-white rounded font-bold disabled:opacity-50"
        >
          Play Car
        </button>
        <button
          onClick={() => {
            stateRef.current.phase = 'idle';
            setIsPaused(false);
          }}
          disabled={stateRef.current.phase === 'idle'}
          className="px-4 py-2 bg-red-500 text-white rounded font-bold disabled:opacity-50"
        >
          Stop Car
        </button>
      </div>
    </div>
  );
}

export default TrafficRunnerGame;
