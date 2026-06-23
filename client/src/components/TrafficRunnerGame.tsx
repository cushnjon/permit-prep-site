import { useEffect, useRef, useState, useCallback } from 'react';

const CANVAS_W = 320;
const CANVAS_H = 420;
const CAR_W = 12;
const CAR_H = 20;
const ROAD_WIDTH = 44;
const INTERSECTION_RADIUS = 48;
const PLAYER_SPEED = 1.4;

// ─── Road network (world coords) ──────────────────────────────
// Each road: array of [x,y] waypoints
const ROADS: { name: string; pts: [number, number][] }[] = [
  { name: 'N Lind Ave',      pts: [[100, -300], [100, 700]] },
  { name: 'N Rogers Ave',    pts: [[160, -300], [160, 700]] },
  { name: 'W Foster Ave',    pts: [[220, -300], [220, 700]] },
  { name: 'N Lockwood Ave',  pts: [[40,  -300], [40,  700]] },
  { name: 'N Liano Ave',     pts: [[280, -300], [280, 700]] },
  { name: 'W Winona St',     pts: [[-300, 80],  [700, 80]]  },
  { name: 'W Foster St',     pts: [[-300, 150], [700, 150]] },
  { name: 'W Lovejoy Ave',   pts: [[-300, 220], [700, 220]] },
  { name: 'W Liano Ave',     pts: [[-300, 290], [700, 290]] },
  { name: 'W Carmen Ave',    pts: [[-300, 360], [700, 360]] },
  { name: 'Diagonal NW-SE',  pts: [[-100, -100],[400, 400]] },
];

// ─── Intersections ────────────────────────────────────────────
const INTERSECTIONS: { x: number; y: number; type: 'light' | 'sign' }[] = [
  { x: 100, y: 80,  type: 'light' },
  { x: 160, y: 80,  type: 'sign'  },
  { x: 220, y: 80,  type: 'light' },
  { x: 40,  y: 150, type: 'sign'  },
  { x: 100, y: 150, type: 'light' },
  { x: 160, y: 150, type: 'sign'  },
  { x: 220, y: 220, type: 'light' },
  { x: 100, y: 220, type: 'sign'  },
  { x: 160, y: 290, type: 'light' },
  { x: 220, y: 290, type: 'sign'  },
  { x: 100, y: 360, type: 'light' },
  { x: 160, y: 360, type: 'sign'  },
];

const SCENARIOS = [
  { name: 'Unprotected Left Turn',  law: 'Yield to ALL oncoming traffic before turning left' },
  { name: 'Right Turn—Pedestrian',  law: 'Yield to pedestrians crossing the street' },
  { name: '4-Way Stop',             law: 'First to stop has right-of-way; yield if equal' },
  { name: 'Emergency Vehicle',      law: 'Pull over immediately for sirens/lights' },
  { name: 'T-Intersection',         law: 'Vehicle on main road has right-of-way' },
  { name: 'Roundabout Entry',       law: 'Yield to traffic already in the roundabout' },
  { name: 'Driveway Exit',          law: 'Yield to all traffic on the main road' },
  { name: 'Green Light Left Turn',  law: 'Yield to oncoming traffic even with green light' },
];

// ─── Helpers ──────────────────────────────────────────────────
function ptOnSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return { dist: Math.hypot(px - ax, py - ay), cx: ax, cy: ay };
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  const cx = ax + t * dx, cy = ay + t * dy;
  return { dist: Math.hypot(px - cx, py - cy), cx, cy };
}

function closestRoad(wx: number, wy: number) {
  let best = { dist: Infinity, cx: wx, cy: wy, heading: 0 };
  for (const road of ROADS) {
    for (let i = 0; i < road.pts.length - 1; i++) {
      const [ax, ay] = road.pts[i], [bx, by] = road.pts[i + 1];
      const r = ptOnSegment(wx, wy, ax, ay, bx, by);
      if (r.dist < best.dist) {
        best = { dist: r.dist, cx: r.cx, cy: r.cy, heading: Math.atan2(by - ay, bx - ax) };
      }
    }
  }
  return best;
}

function isOnRoad(wx: number, wy: number) {
  return closestRoad(wx, wy).dist < ROAD_WIDTH / 2;
}

function wrapToRoad(wx: number, wy: number) {
  const r = closestRoad(wx, wy);
  return { x: r.cx, y: r.cy, heading: r.heading };
}

// ─── Types ────────────────────────────────────────────────────
interface Coin { x: number; y: number; collected: boolean }
interface AIVehicle { x: number; y: number; heading: number; speed: number; roadIdx: number; t: number }

function spawnCoins(): Coin[] {
  const coins: Coin[] = [];
  for (let i = 0; i < 10; i++) {
    const road = ROADS[Math.floor(Math.random() * ROADS.length)];
    const t = 0.1 + Math.random() * 0.8;
    const [ax, ay] = road.pts[0], [bx, by] = road.pts[road.pts.length - 1];
    coins.push({ x: ax + (bx - ax) * t, y: ay + (by - ay) * t, collected: false });
  }
  return coins;
}

function spawnAI(): AIVehicle[] {
  const vehicles: AIVehicle[] = [];
  for (let i = 0; i < 6; i++) {
    const roadIdx = Math.floor(Math.random() * ROADS.length);
    const road = ROADS[roadIdx];
    const t = Math.random();
    const [ax, ay] = road.pts[0], [bx, by] = road.pts[road.pts.length - 1];
    vehicles.push({
      x: ax + (bx - ax) * t,
      y: ay + (by - ay) * t,
      heading: Math.atan2(by - ay, bx - ax),
      speed: 0.8 + Math.random() * 0.8,
      roadIdx,
      t,
    });
  }
  return vehicles;
}

// ─── Component ────────────────────────────────────────────────
export default function TrafficRunnerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  // All mutable game state lives in a ref so the RAF loop reads fresh values
  const gs = useRef({
    phase: 'idle' as 'idle' | 'playing' | 'crashed',
    px: 100, py: 400,          // player world position
    heading: -Math.PI / 2,     // pointing up (north)
    score: 0,
    time: 0,
    coinsCollected: 0,
    scenarioIdx: 0,
    lightTime: 0,
    coins: [] as Coin[],
    ai: [] as AIVehicle[],
    // random turn timer
    nextTurnIn: 3 + Math.random() * 2,
    turnTimer: 0,
  });

  // React state only used to force button re-render
  const [phase, setPhase] = useState<'idle' | 'playing' | 'crashed'>('idle');
  const [playerStopped, setPlayerStopped] = useState(false);

  // ─── Draw helpers ──────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const g = gs.current;

    const ox = CANVAS_W / 2 - g.px;
    const oy = CANVAS_H / 2 - g.py;

    // Background
    ctx.fillStyle = '#e8f5e9';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Roads (filled wide)
    ctx.strokeStyle = '#c8c8c8';
    ctx.lineWidth = ROAD_WIDTH;
    ctx.lineCap = 'round';
    for (const road of ROADS) {
      ctx.beginPath();
      ctx.moveTo(road.pts[0][0] + ox, road.pts[0][1] + oy);
      for (let i = 1; i < road.pts.length; i++) {
        ctx.lineTo(road.pts[i][0] + ox, road.pts[i][1] + oy);
      }
      ctx.stroke();
    }

    // Road center dashes
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    for (const road of ROADS) {
      ctx.beginPath();
      ctx.moveTo(road.pts[0][0] + ox, road.pts[0][1] + oy);
      for (let i = 1; i < road.pts.length; i++) {
        ctx.lineTo(road.pts[i][0] + ox, road.pts[i][1] + oy);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Intersections
    const isGreen = (g.lightTime % 30) >= 15;
    for (const inter of INTERSECTIONS) {
      const sx = inter.x + ox, sy = inter.y + oy;
      if (sx < -20 || sx > CANVAS_W + 20 || sy < -20 || sy > CANVAS_H + 20) continue;
      if (inter.type === 'light') {
        // traffic light pole
        ctx.fillStyle = '#333';
        ctx.fillRect(sx - 2, sy - 14, 4, 14);
        // light housing
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.roundRect(sx - 7, sy - 26, 14, 14, 3);
        ctx.fill();
        // light color
        ctx.fillStyle = isGreen ? '#22c55e' : '#ef4444';
        ctx.beginPath();
        ctx.arc(sx, sy - 19, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // stop sign
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        const r = 7, sides = 8;
        for (let i = 0; i < sides; i++) {
          const a = (i / sides) * Math.PI * 2 - Math.PI / 8;
          i === 0 ? ctx.moveTo(sx + r * Math.cos(a), sy - 14 + r * Math.sin(a))
                  : ctx.lineTo(sx + r * Math.cos(a), sy - 14 + r * Math.sin(a));
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 5px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('STOP', sx, sy - 11);
      }
    }

    // Coins
    for (const coin of g.coins) {
      if (coin.collected) continue;
      const sx = coin.x + ox, sy = coin.y + oy;
      if (sx < -10 || sx > CANVAS_W + 10 || sy < -10 || sy > CANVAS_H + 10) continue;
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 5px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('$', sx, sy + 2);
    }

    // AI vehicles
    for (const v of g.ai) {
      const sx = v.x + ox, sy = v.y + oy;
      if (sx < -20 || sx > CANVAS_W + 20 || sy < -20 || sy > CANVAS_H + 20) continue;
      ctx.save();
      ctx.translate(sx, sy);
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
    // headlights
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
    ctx.fillText(scenario.name, CANVAS_W / 2, 14);
    ctx.fillStyle = '#d1d5db';
    ctx.font = '8px Arial';
    ctx.fillText(scenario.law, CANVAS_W / 2, 28);

    // Idle overlay
    if (g.phase === 'idle') {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#fff';
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
          // 50/50 left or right — only at intersections
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
          // Snap back to nearest road and align heading
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
      // Respawn coins if all collected
      if (g.coins.every((c) => c.collected)) {
        g.coins = spawnCoins();
      }

      // Move AI vehicles
      for (const v of g.ai) {
        const road = ROADS[v.roadIdx];
        v.t += v.speed * dt * 0.08;
        if (v.t > 1) {
          v.t = 0;
          v.roadIdx = Math.floor(Math.random() * ROADS.length);
        }
        const [ax, ay] = road.pts[0];
        const [bx, by] = road.pts[road.pts.length - 1];
        v.x = ax + (bx - ax) * v.t;
        v.y = ay + (by - ay) * v.t;
        v.heading = Math.atan2(by - ay, bx - ax);

        // Collision
        if (Math.hypot(g.px - v.x, g.py - v.y) < CAR_W + 4) {
          g.phase = 'crashed';
          setPhase('crashed');
        }
      }

      // Score for surviving
      if (Math.floor(g.time) % 5 === 0 && g.time % 1 < dt * 2) {
        g.score += 1;
      }
    }

    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw]);

  // ─── Start / stop RAF ──────────────────────────────────────
  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [loop]);

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
  }, []);

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
      setPlayerStopped(!playerStopped);
    }
  }, [playerStopped]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="rounded-lg border border-gray-300 shadow-md block"
      />
      <div className="flex gap-3">
        <button
          onClick={handlePlay}
          disabled={phase === 'playing'}
          className="px-5 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white rounded-lg font-bold text-sm transition-colors"
        >
          ▶ Play Car
        </button>
        <button
          onClick={handlePause}
          disabled={phase !== 'playing'}
          className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-40 text-white rounded-lg font-bold text-sm transition-colors"
        >
          {playerStopped ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button
          onClick={handleStop}
          disabled={phase === 'idle'}
          className="px-5 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white rounded-lg font-bold text-sm transition-colors"
        >
          ⏹ Stop Car
        </button>
      </div>
    </div>
  );
}
