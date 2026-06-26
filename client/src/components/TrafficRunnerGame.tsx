import React, { useRef, useState, useEffect, useCallback } from 'react';

// ─── Map constants ───────────────────────────────────────────────────────────
const CANVAS_W = 800;
const CANVAS_H = 600;
const MAP_W = 1408;
const MAP_H = 768;
const ZOOM = 3;
const CAR_W = 10;
const CAR_H = 18;
const SPEED = 2.2; // px per frame

// ─── Waypoint graph ───────────────────────────────────────────────────────────
// Each node is an intersection (x, y) on the actual map image.
// Edges list which nodes you can reach from each node.
// Coordinates were measured from the 1408×768 pixel-art city map.
// Columns (vertical roads):  ~96, ~224, ~352, ~480, ~608, ~736, ~864, ~992, ~1120, ~1248
// Rows    (horizontal roads): ~96, ~224, ~352, ~480, ~608

type Node = { id: number; x: number; y: number };
type Edge = { from: number; to: number };

const NODES: Node[] = [
  // Row 0  (y≈96)
  { id:  0, x:  96, y:  96 },
  { id:  1, x: 224, y:  96 },
  { id:  2, x: 352, y:  96 },
  { id:  3, x: 480, y:  96 },
  { id:  4, x: 608, y:  96 },
  { id:  5, x: 736, y:  96 },
  { id:  6, x: 864, y:  96 },
  { id:  7, x: 992, y:  96 },
  { id:  8, x:1120, y:  96 },
  { id:  9, x:1248, y:  96 },
  // Row 1  (y≈224)
  { id: 10, x:  96, y: 224 },
  { id: 11, x: 224, y: 224 },
  { id: 12, x: 352, y: 224 },
  { id: 13, x: 480, y: 224 },
  { id: 14, x: 608, y: 224 },
  { id: 15, x: 736, y: 224 },
  { id: 16, x: 864, y: 224 },
  { id: 17, x: 992, y: 224 },
  { id: 18, x:1120, y: 224 },
  { id: 19, x:1248, y: 224 },
  // Row 2  (y≈352)
  { id: 20, x:  96, y: 352 },
  { id: 21, x: 224, y: 352 },
  { id: 22, x: 352, y: 352 },
  { id: 23, x: 480, y: 352 },
  { id: 24, x: 608, y: 352 },
  { id: 25, x: 736, y: 352 },
  { id: 26, x: 864, y: 352 },
  { id: 27, x: 992, y: 352 },
  { id: 28, x:1120, y: 352 },
  { id: 29, x:1248, y: 352 },
  // Row 3  (y≈480)
  { id: 30, x:  96, y: 480 },
  { id: 31, x: 224, y: 480 },
  { id: 32, x: 352, y: 480 },
  { id: 33, x: 480, y: 480 },
  { id: 34, x: 608, y: 480 },
  { id: 35, x: 736, y: 480 },
  { id: 36, x: 864, y: 480 },
  { id: 37, x: 992, y: 480 },
  { id: 38, x:1120, y: 480 },
  { id: 39, x:1248, y: 480 },
  // Row 4  (y≈608)
  { id: 40, x:  96, y: 608 },
  { id: 41, x: 224, y: 608 },
  { id: 42, x: 352, y: 608 },
  { id: 43, x: 480, y: 608 },
  { id: 44, x: 608, y: 608 },
  { id: 45, x: 736, y: 608 },
  { id: 46, x: 864, y: 608 },
  { id: 47, x: 992, y: 608 },
  { id: 48, x:1120, y: 608 },
  { id: 49, x:1248, y: 608 },
];

// Build adjacency: every node connects to its horizontal and vertical neighbours
function buildAdj(): Map<number, number[]> {
  const adj = new Map<number, number[]>();
  NODES.forEach(n => adj.set(n.id, []));

  // Horizontal edges (same row = same y)
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 9; col++) {
      const a = row * 10 + col;
      const b = row * 10 + col + 1;
      adj.get(a)!.push(b);
      adj.get(b)!.push(a);
    }
  }
  // Vertical edges (same column = same x)
  for (let col = 0; col < 10; col++) {
    for (let row = 0; row < 4; row++) {
      const a = row * 10 + col;
      const b = (row + 1) * 10 + col;
      adj.get(a)!.push(b);
      adj.get(b)!.push(a);
    }
  }
  return adj;
}

const ADJ = buildAdj();

function nodeById(id: number): Node {
  return NODES[id];
}

// Pick a random neighbour, preferring to continue straight (avoid U-turns)
function nextNode(currentId: number, prevId: number | null): number {
  const neighbours = ADJ.get(currentId)!;
  // Filter out the node we just came from (no U-turns)
  const forward = neighbours.filter(id => id !== prevId);
  const pool = forward.length > 0 ? forward : neighbours;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── AI vehicle type ──────────────────────────────────────────────────────────
type AIVehicle = {
  x: number; y: number;
  targetId: number; prevId: number | null;
  speed: number;
  angle: number; // radians, for drawing
};

function spawnAI(): AIVehicle[] {
  const vehicles: AIVehicle[] = [];
  for (let i = 0; i < 5; i++) {
    const startId = Math.floor(Math.random() * NODES.length);
    const n = nodeById(startId);
    vehicles.push({
      x: n.x, y: n.y,
      targetId: nextNode(startId, null),
      prevId: null,
      speed: 1.0 + Math.random() * 1.2,
      angle: 0,
    });
  }
  return vehicles;
}

function spawnCoins(): Array<{ x: number; y: number }> {
  const coins: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 12; i++) {
    const n = NODES[Math.floor(Math.random() * NODES.length)];
    // Offset slightly so coins aren't exactly on nodes
    coins.push({ x: n.x + (Math.random() - 0.5) * 80, y: n.y + (Math.random() - 0.5) * 80 });
  }
  return coins;
}

// ─── Component ────────────────────────────────────────────────────────────────
const TrafficRunnerGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapImgRef = useRef<HTMLImageElement | null>(null);
  const [uiState, setUiState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [score, setScore] = useState(0);
  const [scenarioLabel, setScenarioLabel] = useState('');
  const rafRef = useRef<number | null>(null);

  const scenarios = [
    'Unprotected Left Turn',
    'Right Turn — Pedestrian',
    '4-Way Stop',
    'Emergency Vehicle',
    'T-Intersection',
    'Roundabout Entry',
    'Driveway Exit',
    'Green Light Left Turn',
  ];

  // ── Mutable game state (NOT React state, to avoid re-render jank) ──────────
  const gs = useRef({
    playing: false,
    paused: false,
    // Player
    px: 200, py: 96,          // current position
    targetId: 1,               // waypoint we're heading to
    prevId: 0 as number | null,
    angle: 0,                  // radians
    scoreVal: 0,
    // Scenario
    scenarioIdx: 0,
    scenarioTimer: 0,
    // Entities
    coins: [] as Array<{ x: number; y: number }>,
    ai: [] as AIVehicle[],
    // Grace period (no collision for first 2s)
    graceTimer: 0,
    // Time
    frameCount: 0,
  });

  // ── Load map image once ────────────────────────────────────────────────────
  useEffect(() => {
    const img = new Image();
    img.src = '/manus-storage/city-map_781596a2.png';
    img.onload = () => { mapImgRef.current = img; };
  }, []);

  // ── Move a waypoint-follower one frame ────────────────────────────────────
  function stepWaypoint(
    x: number, y: number,
    targetId: number, prevId: number | null,
    speed: number
  ): { x: number; y: number; targetId: number; prevId: number | null; angle: number; arrived: boolean } {
    const target = nodeById(targetId);
    const dx = target.x - x;
    const dy = target.y - y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dx, -dy); // atan2(east, north) → 0=up

    if (dist <= speed + 0.5) {
      // Snap to node, pick next
      const newPrev = targetId;
      const newTarget = nextNode(targetId, prevId);
      return { x: target.x, y: target.y, targetId: newTarget, prevId: newPrev, angle, arrived: true };
    }

    const nx = x + (dx / dist) * speed;
    const ny = y + (dy / dist) * speed;
    return { x: nx, y: ny, targetId, prevId, angle, arrived: false };
  }

  // ── Draw one frame ─────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = gs.current;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Camera: player is centred on screen
    const camX = s.px - CANVAS_W / (2 * ZOOM);
    const camY = s.py - CANVAS_H / (2 * ZOOM);

    // Map
    if (mapImgRef.current) {
      ctx.save();
      ctx.scale(ZOOM, ZOOM);
      ctx.drawImage(mapImgRef.current, -camX, -camY);
      ctx.restore();
    }

    // Helper: world → screen
    const wx = (wx: number) => (wx - camX) * ZOOM;
    const wy = (wy: number) => (wy - camY) * ZOOM;

    // Coins
    for (const c of s.coins) {
      const sx = wx(c.x), sy = wy(c.y);
      if (sx < -10 || sx > CANVAS_W + 10 || sy < -10 || sy > CANVAS_H + 10) continue;
      ctx.save();
      ctx.beginPath();
      ctx.arc(sx, sy, 5 * ZOOM / 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.restore();
    }

    // AI vehicles
    for (const v of s.ai) {
      const sx = wx(v.x), sy = wy(v.y);
      if (sx < -30 || sx > CANVAS_W + 30 || sy < -30 || sy > CANVAS_H + 30) continue;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(v.angle);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(-CAR_W / 2 * ZOOM / 3, -CAR_H / 2 * ZOOM / 3, CAR_W * ZOOM / 3, CAR_H * ZOOM / 3);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(-CAR_W / 2 * ZOOM / 3, -CAR_H / 2 * ZOOM / 3, CAR_W * ZOOM / 3, CAR_H * ZOOM / 3);
      ctx.restore();
    }

    // Player car (always screen centre)
    ctx.save();
    ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
    ctx.rotate(s.angle);
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(-CAR_W / 2 * ZOOM / 3, -CAR_H / 2 * ZOOM / 3, CAR_W * ZOOM / 3, CAR_H * ZOOM / 3);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(-CAR_W / 2 * ZOOM / 3, -CAR_H / 2 * ZOOM / 3, CAR_W * ZOOM / 3, CAR_H * ZOOM / 3);
    ctx.restore();

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, 280, 68);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`Score: ${s.scoreVal}`, 10, 20);
    ctx.fillText(`Time:  ${(s.frameCount / 60).toFixed(1)}s`, 10, 38);
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`Scenario: ${scenarios[s.scenarioIdx]}`, 10, 56);

    // Idle overlay
    if (!s.playing) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('▶ Click Play Car to start', CANVAS_W / 2, CANVAS_H / 2);
      ctx.textAlign = 'left';
    }

    // Paused overlay
    if (s.playing && s.paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⏸ PAUSED', CANVAS_W / 2, CANVAS_H / 2);
      ctx.textAlign = 'left';
    }
  }, []);

  // ── Game loop ──────────────────────────────────────────────────────────────
  const loop = useCallback(() => {
    const s = gs.current;

    if (s.playing && !s.paused) {
      s.frameCount++;
      s.graceTimer += 1 / 60;
      s.scenarioTimer += 1 / 60;

      // Rotate scenario every 15 s
      if (s.scenarioTimer >= 15) {
        s.scenarioIdx = (s.scenarioIdx + 1) % scenarios.length;
        s.scenarioTimer = 0;
        setScenarioLabel(scenarios[s.scenarioIdx]);
      }

      // ── Move player ──────────────────────────────────────────────────────
      const pr = stepWaypoint(s.px, s.py, s.targetId, s.prevId, SPEED);
      s.px = pr.x;
      s.py = pr.y;
      s.angle = pr.angle;
      s.targetId = pr.targetId;
      s.prevId = pr.prevId;

      // ── Move AI ──────────────────────────────────────────────────────────
      for (const v of s.ai) {
        const r = stepWaypoint(v.x, v.y, v.targetId, v.prevId, v.speed);
        v.x = r.x; v.y = r.y;
        v.angle = r.angle;
        v.targetId = r.targetId;
        v.prevId = r.prevId;
      }

      // ── Coin collection ───────────────────────────────────────────────────
      s.coins = s.coins.filter(c => {
        if (Math.hypot(c.x - s.px, c.y - s.py) < 22) {
          s.scoreVal += 10;
          setScore(s.scoreVal);
          return false;
        }
        return true;
      });
      // Respawn coins if all collected
      if (s.coins.length === 0) s.coins = spawnCoins();
    }

    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw]);

  // Start/stop RAF
  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [loop]);

  // ── Controls ───────────────────────────────────────────────────────────────
  const handlePlay = () => {
    const s = gs.current;
    // Start from node 3 (480, 96) heading right toward node 4
    s.px = 480; s.py = 96;
    s.targetId = 4; s.prevId = 3;
    s.angle = 0;
    s.scoreVal = 0; s.frameCount = 0;
    s.scenarioIdx = 0; s.scenarioTimer = 0;
    s.graceTimer = 0;
    s.coins = spawnCoins();
    s.ai = spawnAI();
    s.playing = true; s.paused = false;
    setScore(0);
    setScenarioLabel(scenarios[0]);
    setUiState('playing');
  };

  const handlePause = () => {
    const s = gs.current;
    s.paused = !s.paused;
    setUiState(s.paused ? 'paused' : 'playing');
  };

  const handleStop = () => {
    const s = gs.current;
    s.playing = false; s.paused = false;
    setUiState('idle');
  };

  return (
    <div className="w-full bg-gray-900 rounded-lg overflow-hidden">
      <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full h-full"
        />
      </div>
      <div className="flex gap-2 p-3 bg-gray-800 justify-center">
        <button
          onClick={handlePlay}
          disabled={uiState === 'playing'}
          className="px-4 py-2 bg-green-500 text-white rounded font-bold hover:bg-green-600 disabled:opacity-40 transition-all active:scale-95"
        >
          ▶ Play Car
        </button>
        <button
          onClick={handlePause}
          disabled={uiState === 'idle'}
          className="px-4 py-2 bg-yellow-500 text-white rounded font-bold hover:bg-yellow-600 disabled:opacity-40 transition-all active:scale-95"
        >
          {uiState === 'paused' ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button
          onClick={handleStop}
          disabled={uiState === 'idle'}
          className="px-4 py-2 bg-red-500 text-white rounded font-bold hover:bg-red-600 disabled:opacity-40 transition-all active:scale-95"
        >
          ⏹ Stop Car
        </button>
      </div>
    </div>
  );
};

export default TrafficRunnerGame;
