import React, { useRef, useState, useCallback, useEffect } from 'react';

// ─── Constants ─────────────────────────────────────────────
const CANVAS_W = 560;
const CANVAS_H = 500;
const PLAYER_SPEED = 3.75; // Increased from 2.5 (50% faster)
const AI_SPEED = 2.5;
const CAR_W = 14;
const CAR_H = 10;
const INTERSECTION_RADIUS = 50;

type Road = 
  | { type: 'vertical'; x: number; lanes: number }
  | { type: 'horizontal'; y: number; lanes: number };

// ─── Realistic street map with more roads ─────────────────
const ROADS: Road[] = [
  // Vertical roads (north-south)
  { type: 'vertical', x: 100, lanes: 2 },
  { type: 'vertical', x: 200, lanes: 2 },
  { type: 'vertical', x: 300, lanes: 2 },
  { type: 'vertical', x: 400, lanes: 2 },
  { type: 'vertical', x: 500, lanes: 2 },
  
  // Horizontal roads (east-west)
  { type: 'horizontal', y: 100, lanes: 2 },
  { type: 'horizontal', y: 200, lanes: 2 },
  { type: 'horizontal', y: 300, lanes: 2 },
  { type: 'horizontal', y: 400, lanes: 2 },
];

// ─── Intersections with realistic traffic control placement ─
const INTERSECTIONS = [
  // Row 1
  { x: 100, y: 100, hasLight: true, hasStop: false },
  { x: 200, y: 100, hasLight: false, hasStop: true },
  { x: 300, y: 100, hasLight: true, hasStop: false },
  { x: 400, y: 100, hasLight: false, hasStop: true },
  { x: 500, y: 100, hasLight: true, hasStop: false },
  
  // Row 2
  { x: 100, y: 200, hasLight: false, hasStop: true },
  { x: 200, y: 200, hasLight: true, hasStop: false },
  { x: 300, y: 200, hasLight: false, hasStop: true },
  { x: 400, y: 200, hasLight: true, hasStop: false },
  { x: 500, y: 200, hasLight: false, hasStop: true },
  
  // Row 3
  { x: 100, y: 300, hasLight: true, hasStop: false },
  { x: 200, y: 300, hasLight: false, hasStop: true },
  { x: 300, y: 300, hasLight: true, hasStop: false },
  { x: 400, y: 300, hasLight: false, hasStop: true },
  { x: 500, y: 300, hasLight: true, hasStop: false },
  
  // Row 4
  { x: 100, y: 400, hasLight: false, hasStop: true },
  { x: 200, y: 400, hasLight: true, hasStop: false },
  { x: 300, y: 400, hasLight: false, hasStop: true },
  { x: 400, y: 400, hasLight: true, hasStop: false },
  { x: 500, y: 400, hasLight: false, hasStop: true },
];

const SCENARIOS = [
  'Unprotected Left Turn',
  'Right Turn—Pedestrian',
  '4-Way Stop',
  'Emergency Vehicle',
  'T-Intersection',
  'Roundabout Entry',
  'Driveway Exit',
  'Green Light Left Turn',
];

interface Coin {
  x: number;
  y: number;
  collected: boolean;
}

interface AIVehicle {
  x: number;
  y: number;
  heading: number;
  speed: number;
}

// ─── Helper: Check if point is on a road ───────────────────
function isOnRoad(x: number, y: number): boolean {
  const ROAD_WIDTH = 42;
  for (const road of ROADS) {
    if (road.type === 'vertical' && 'x' in road) {
      if (Math.abs(x - road.x) < ROAD_WIDTH / 2) return true;
    } else if (road.type === 'horizontal' && 'y' in road) {
      if (Math.abs(y - road.y) < ROAD_WIDTH / 2) return true;
    }
  }
  return false;
}

// ─── Helper: Find closest road point ───────────────────────
function findClosestRoadPoint(x: number, y: number) {
  let closest = { x, y, heading: 0 };
  let minDist = Infinity;

  for (const road of ROADS) {
    let px, py, heading;
    if (road.type === 'vertical' && 'x' in road) {
      px = road.x;
      py = y;
      heading = 0;
    } else if (road.type === 'horizontal' && 'y' in road) {
      px = x;
      py = road.y;
      heading = Math.PI / 2;
    } else {
      continue;
    }
    const dist = Math.hypot(px - x, py - y);
    if (dist < minDist) {
      minDist = dist;
      closest = { x: px, y: py, heading };
    }
  }
  return closest;
}

// ─── Helper: Wrap to road on edge ─────────────────────────
function wrapToRoad(x: number, y: number) {
  const WORLD_W = 600;
  const WORLD_H = 500;
  let wx = x;
  let wy = y;

  if (wx < 0) wx += WORLD_W;
  if (wx > WORLD_W) wx -= WORLD_W;
  if (wy < 0) wy += WORLD_H;
  if (wy > WORLD_H) wy -= WORLD_H;

  return findClosestRoadPoint(wx, wy);
}

// ─── Spawn coins on roads ─────────────────────────────────
function spawnCoins(): Coin[] {
  const coins: Coin[] = [];
  for (let i = 0; i < 8; i++) {
    const road = ROADS[Math.floor(Math.random() * ROADS.length)];
    let x, y;
    if (road.type === 'vertical') {
      x = road.x + (Math.random() - 0.5) * 20;
      y = Math.random() * 500;
    } else {
      x = Math.random() * 600;
      y = road.y + (Math.random() - 0.5) * 20;
    }
    coins.push({ x, y, collected: false });
  }
  return coins;
}

// ─── Spawn AI vehicles on roads ────────────────────────────
function spawnAI(): AIVehicle[] {
  const ai: AIVehicle[] = [];
  for (let i = 0; i < 5; i++) {
    const road = ROADS[Math.floor(Math.random() * ROADS.length)];
    let x, y, heading;
    if (road.type === 'vertical') {
      x = road.x;
      y = Math.random() * 500;
      heading = Math.random() < 0.5 ? -Math.PI / 2 : Math.PI / 2;
    } else {
      x = Math.random() * 600;
      y = road.y;
      heading = Math.random() < 0.5 ? 0 : Math.PI;
    }
    ai.push({ x, y, heading, speed: AI_SPEED });
  }
  return ai;
}

// ─── Component ────────────────────────────────────────────
export default function TrafficRunnerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  const gs = useRef({
    phase: 'idle' as 'idle' | 'playing' | 'crashed',
    px: 100, py: 400,
    heading: -Math.PI / 2,
    score: 0,
    time: 0,
    coinsCollected: 0,
    scenarioIdx: 0,
    lightTime: 0,
    coins: [] as Coin[],
    ai: [] as AIVehicle[],
    nextTurnIn: 3 + Math.random() * 2,
    turnTimer: 0,
  });

  const [phase, setPhase] = useState<'idle' | 'playing' | 'crashed'>('idle');
  const [playerStopped, setPlayerStopped] = useState(false);

  // ─── Draw function ────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const g = gs.current;

    // Clear
    ctx.fillStyle = '#e8f5e9';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw roads (camera-relative)
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 42;
    ctx.lineCap = 'round';
    for (const road of ROADS) {
      if (road.type === 'vertical') {
        ctx.beginPath();
        ctx.moveTo(CANVAS_W / 2 + (road.x - g.px), 0);
        ctx.lineTo(CANVAS_W / 2 + (road.x - g.px), CANVAS_H);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, CANVAS_H / 2 + (road.y - g.py));
        ctx.lineTo(CANVAS_W, CANVAS_H / 2 + (road.y - g.py));
        ctx.stroke();
      }
    }

    // Draw road center lines
    ctx.strokeStyle = '#ffeb3b';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    for (const road of ROADS) {
      if (road.type === 'vertical') {
        ctx.beginPath();
        ctx.moveTo(CANVAS_W / 2 + (road.x - g.px), 0);
        ctx.lineTo(CANVAS_W / 2 + (road.x - g.px), CANVAS_H);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, CANVAS_H / 2 + (road.y - g.py));
        ctx.lineTo(CANVAS_W, CANVAS_H / 2 + (road.y - g.py));
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);

    // Draw intersections with traffic control
    for (const inter of INTERSECTIONS) {
      const sx = CANVAS_W / 2 + (inter.x - g.px);
      const sy = CANVAS_H / 2 + (inter.y - g.py);

      // Draw intersection square
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(sx - 25, sy - 25, 50, 50);

      // Draw traffic lights at all 4 corners
      if (inter.hasLight) {
        const isGreen = (g.lightTime % 30) < 15;
        const corners = [
          { x: sx - 25, y: sy - 25 }, // top-left
          { x: sx + 25, y: sy - 25 }, // top-right
          { x: sx - 25, y: sy + 25 }, // bottom-left
          { x: sx + 25, y: sy + 25 }, // bottom-right
        ];
        for (const corner of corners) {
          ctx.fillStyle = '#333';
          ctx.fillRect(corner.x - 6, corner.y - 6, 12, 12);
          ctx.fillStyle = isGreen ? '#22c55e' : '#ef4444';
          ctx.beginPath();
          ctx.arc(corner.x, corner.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw stop sign at bottom-right corner
      if (inter.hasStop) {
        const sx_br = sx + 25;
        const sy_br = sy + 25;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const x = sx_br + Math.cos(angle) * 8;
          const y = sy_br + Math.sin(angle) * 8;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 6px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('S', sx_br, sy_br);
      }
    }

    // Draw coins
    for (const coin of g.coins) {
      if (!coin.collected) {
        const cx = CANVAS_W / 2 + (coin.x - g.px);
        const cy = CANVAS_H / 2 + (coin.y - g.py);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw AI vehicles
    for (const v of g.ai) {
      const vx = CANVAS_W / 2 + (v.x - g.px);
      const vy = CANVAS_H / 2 + (v.y - g.py);
      ctx.save();
      ctx.translate(vx, vy);
      ctx.rotate(v.heading + Math.PI / 2);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(-CAR_W / 2, -CAR_H / 2, CAR_W, CAR_H, 3);
      ctx.fill();
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(-CAR_W / 2 + 2, -CAR_H / 2 + 2, CAR_W - 4, 4);
      ctx.restore();
    }

    // Player car (always center)
    ctx.save();
    ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
    ctx.rotate(g.heading + Math.PI / 2);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.roundRect(-CAR_W / 2, -CAR_H / 2, CAR_W, CAR_H, 3);
    ctx.fill();
    ctx.fillStyle = '#86efac';
    ctx.fillRect(-CAR_W / 2 + 2, -CAR_H / 2 + 2, CAR_W - 4, 4);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-CAR_W / 2 + 1, -CAR_H / 2 - 2, 3, 3);
    ctx.fillRect(CAR_W / 2 - 4, -CAR_H / 2 - 2, 3, 3);
    ctx.restore();

    // HUD
    ctx.fillStyle = 'rgba(31,41,55,0.85)';
    ctx.fillRect(0, 0, CANVAS_W, 44);
    ctx.fillStyle = '#f9fafb';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${g.score}`, 8, 14);
    ctx.fillText(`Time: ${g.time.toFixed(0)}s`, 8, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`Coins: ${g.coinsCollected}`, CANVAS_W - 8, 14);
    const scenario = SCENARIOS[g.scenarioIdx % SCENARIOS.length];
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`⚠ ${scenario}`, CANVAS_W / 2, 30);

    // Idle overlay
    if (g.phase === 'idle') {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#d1fae5';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Street Navigation', CANVAS_W / 2, CANVAS_H / 2 - 20);
      ctx.font = '12px Arial';
      ctx.fillStyle = '#d1fae5';
      ctx.fillText('Collect coins • Avoid AI traffic', CANVAS_W / 2, CANVAS_H / 2 + 8);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 10px Arial';
      ctx.fillText('Press Play Car to start', CANVAS_W / 2, CANVAS_H / 2 + 28);
    }

    // Crashed overlay
    if (g.phase === 'crashed') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CRASHED!', CANVAS_W / 2, CANVAS_H / 2 - 16);
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.fillText(`Final Score: ${g.score}`, CANVAS_W / 2, CANVAS_H / 2 + 14);
      ctx.fillStyle = '#d1fae5';
      ctx.font = '11px Arial';
      ctx.fillText('Press Stop Car then Play Car to retry', CANVAS_W / 2, CANVAS_H / 2 + 36);
    }
  }, []);

  // ─── Game loop ─────────────────────────────────────────────
  const loop = useCallback(() => {
    const g = gs.current;

    if (g.phase === 'playing') {
      const dt = 0.016;
      g.time += dt;
      g.lightTime += dt;
      g.scenarioIdx = Math.floor(g.time / 15);

      // Random turn timer (only if player not stopped)
      if (!playerStopped) {
        g.turnTimer += dt;
        if (g.turnTimer >= g.nextTurnIn) {
          g.turnTimer = 0;
          g.nextTurnIn = 3 + Math.random() * 2;
          const nearInter = INTERSECTIONS.find(
            (inter) => Math.hypot(g.px - inter.x, g.py - inter.y) < INTERSECTION_RADIUS
          );
          if (nearInter) {
            const turn = Math.random() < 0.5 ? -Math.PI / 2 : Math.PI / 2;
            g.heading += turn;
          }
        }
      }

      // Move forward (only if player not stopped)
      if (!playerStopped) {
        const nx = g.px + Math.cos(g.heading) * PLAYER_SPEED;
        const ny = g.py + Math.sin(g.heading) * PLAYER_SPEED;

        if (isOnRoad(nx, ny)) {
          g.px = nx;
          g.py = ny;
        } else {
          const snap = wrapToRoad(g.px, g.py);
          g.px = snap.x;
          g.py = snap.y;
          g.heading = snap.heading;
        }
      }

      // Coin collection
      for (const coin of g.coins) {
        if (!coin.collected && Math.hypot(g.px - coin.x, g.py - coin.y) < 12) {
          coin.collected = true;
          g.coinsCollected++;
          g.score += 10;
        }
      }

      // AI movement
      for (const ai of g.ai) {
        ai.x += Math.cos(ai.heading) * ai.speed;
        ai.y += Math.sin(ai.heading) * ai.speed;

        // Wrap AI
        if (ai.x < 0) ai.x += 600;
        if (ai.x > 600) ai.x -= 600;
        if (ai.y < 0) ai.y += 500;
        if (ai.y > 500) ai.y -= 500;

        // Random turns at intersections
        const nearInter = INTERSECTIONS.find(
          (inter) => Math.hypot(ai.x - inter.x, ai.y - inter.y) < 30
        );
        if (nearInter && Math.random() < 0.1) {
          const turn = Math.random() < 0.5 ? -Math.PI / 2 : Math.PI / 2;
          ai.heading += turn;
        }
      }

      // Collision detection
      for (const ai of g.ai) {
        if (Math.hypot(g.px - ai.x, g.py - ai.y) < 20) {
          g.phase = 'crashed';
          setPhase('crashed');
        }
      }

      // Bonus for survival
      g.score += 1;
    }

    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw, playerStopped]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [loop, playerStopped]);

  // ─── Button handlers ───────────────────────────────────────
  const handlePlay = useCallback(() => {
    const g = gs.current;
    g.phase = 'playing';
    g.px = 100; g.py = 400;
    g.heading = -Math.PI / 2;
    g.score = 0; g.time = 0;
    g.coinsCollected = 0; g.scenarioIdx = 0;
    g.lightTime = 0;
    g.coins = spawnCoins();
    g.ai = spawnAI();
    g.turnTimer = 0;
    g.nextTurnIn = 3 + Math.random() * 2;
    setPhase('playing');
    setPlayerStopped(false);
  }, [spawnCoins, spawnAI]);

  const handleStop = useCallback(() => {
    const g = gs.current;
    g.phase = 'idle';
    g.px = 100; g.py = 400;
    g.heading = -Math.PI / 2;
    g.score = 0; g.time = 0;
    g.coinsCollected = 0; g.scenarioIdx = 0;
    g.lightTime = 0;
    g.coins = [];
    g.ai = [];
    g.turnTimer = 0;
    g.nextTurnIn = 3 + Math.random() * 2;
    setPhase('idle');
    setPlayerStopped(false);
  }, []);

  const handlePause = useCallback(() => {
    if (gs.current.phase === 'playing') {
      setPlayerStopped(prev => !prev);
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="border-4 border-dashed border-yellow-400 bg-green-100 rounded"
      />
      <div className="flex gap-2">
        <button
          onClick={handlePlay}
          disabled={phase === 'playing'}
          className="px-4 py-2 bg-green-500 text-white rounded font-bold hover:bg-green-600 disabled:bg-gray-400"
        >
          ▶ Play Car
        </button>
        <button
          onClick={handlePause}
          disabled={phase !== 'playing'}
          className="px-4 py-2 bg-yellow-500 text-white rounded font-bold hover:bg-yellow-600 disabled:bg-gray-400"
        >
          ⏸ Pause
        </button>
        <button
          onClick={handleStop}
          className="px-4 py-2 bg-red-500 text-white rounded font-bold hover:bg-red-600"
        >
          ⏹ Stop Car
        </button>
      </div>
    </div>
  );
}
