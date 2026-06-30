import React, { useRef, useState, useEffect, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const CANVAS_W = 800;
const CANVAS_H = 600;
const MAP_W = 1408;
const MAP_H = 768;
const ZOOM = 2.1;          // 30% less than old 3.0
const SPEED = 2.2;
const LANE_OFFSET = 14;    // pixels — right-side lane offset from node centre

// ─── Waypoint graph ───────────────────────────────────────────────────────────
// 50 nodes: 5 rows × 10 columns matching the city map intersections
// Row y-values: 96, 224, 352, 480, 608
// Col x-values: 96, 224, 352, 480, 608, 736, 864, 992, 1120, 1248
type Node = { id: number; x: number; y: number };

const ROWS = [96, 224, 352, 480, 608];
const COLS = [96, 224, 352, 480, 608, 736, 864, 992, 1120, 1248];

const NODES: Node[] = [];
for (let r = 0; r < 5; r++) {
  for (let c = 0; c < 10; c++) {
    NODES.push({ id: r * 10 + c, x: COLS[c], y: ROWS[r] });
  }
}

function buildAdj(): Map<number, number[]> {
  const adj = new Map<number, number[]>();
  NODES.forEach(n => adj.set(n.id, []));
  // Horizontal
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 9; c++) {
      const a = r * 10 + c, b = r * 10 + c + 1;
      adj.get(a)!.push(b); adj.get(b)!.push(a);
    }
  }
  // Vertical
  for (let c = 0; c < 10; c++) {
    for (let r = 0; r < 4; r++) {
      const a = r * 10 + c, b = (r + 1) * 10 + c;
      adj.get(a)!.push(b); adj.get(b)!.push(a);
    }
  }
  return adj;
}
const ADJ = buildAdj();

function nodeById(id: number): Node { return NODES[id]; }

function nextNode(currentId: number, prevId: number | null): number {
  const neighbours = ADJ.get(currentId)!;
  const forward = neighbours.filter(id => id !== prevId);
  const pool = forward.length > 0 ? forward : neighbours;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Lane offset helper ───────────────────────────────────────────────────────
// Given the direction of travel (angle in radians, 0=up), offset the car to
// the right-side lane so it drives on the correct side of the road.
function laneOffset(angle: number): { dx: number; dy: number } {
  // Perpendicular-right of travel direction
  return {
    dx:  Math.cos(angle) * LANE_OFFSET,
    dy: -Math.sin(angle) * LANE_OFFSET,
  };
}

// ─── Realistic car drawing ────────────────────────────────────────────────────
function drawCar(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number,
  angle: number,
  color: string,
  scale: number = 1
) {
  const W = 10 * scale;
  const H = 18 * scale;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(angle);

  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-W / 2, -H / 2, W, H, 2 * scale);
  ctx.fill();

  // Roof / cabin (darker)
  ctx.fillStyle = shadeColor(color, -30);
  ctx.beginPath();
  ctx.roundRect(-W * 0.35, -H * 0.25, W * 0.7, H * 0.38, 1.5 * scale);
  ctx.fill();

  // Windshield (front)
  ctx.fillStyle = 'rgba(180,220,255,0.75)';
  ctx.beginPath();
  ctx.roundRect(-W * 0.3, -H * 0.45, W * 0.6, H * 0.16, 1 * scale);
  ctx.fill();

  // Rear window
  ctx.fillStyle = 'rgba(180,220,255,0.55)';
  ctx.beginPath();
  ctx.roundRect(-W * 0.28, H * 0.12, W * 0.56, H * 0.12, 1 * scale);
  ctx.fill();

  // Headlights (front)
  ctx.fillStyle = '#fffde7';
  ctx.beginPath(); ctx.ellipse(-W * 0.28, -H * 0.46, W * 0.1, H * 0.045, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( W * 0.28, -H * 0.46, W * 0.1, H * 0.045, 0, 0, Math.PI * 2); ctx.fill();

  // Tail lights (rear)
  ctx.fillStyle = '#e53935';
  ctx.beginPath(); ctx.ellipse(-W * 0.28, H * 0.46, W * 0.1, H * 0.04, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( W * 0.28, H * 0.46, W * 0.1, H * 0.04, 0, 0, Math.PI * 2); ctx.fill();

  // Wheels (4 corners)
  ctx.fillStyle = '#222';
  const wx = W * 0.42, wy = H * 0.32;
  const ww = W * 0.22, wh = H * 0.13;
  [[-wx, -wy], [wx, -wy], [-wx, wy], [wx, wy]].forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.roundRect(cx - ww / 2, cy - wh / 2, ww, wh, 1);
    ctx.fill();
  });

  // Outline
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 0.8 * scale;
  ctx.beginPath();
  ctx.roundRect(-W / 2, -H / 2, W, H, 2 * scale);
  ctx.stroke();

  ctx.restore();
}

function shadeColor(hex: string, pct: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) + pct));
  const g = Math.max(0, Math.min(255, ((n >> 8)  & 0xff) + pct));
  const b = Math.max(0, Math.min(255, ( n        & 0xff) + pct));
  return `rgb(${r},${g},${b})`;
}

// ─── AI vehicle type ──────────────────────────────────────────────────────────
type AIVehicle = {
  x: number; y: number;
  targetId: number; prevId: number | null;
  speed: number;
  angle: number;
  color: string;
};

const AI_COLORS = ['#e74c3c','#3498db','#f39c12','#9b59b6','#1abc9c'];

function spawnAI(): AIVehicle[] {
  return Array.from({ length: 5 }, (_, i) => {
    const startId = Math.floor(Math.random() * NODES.length);
    const n = nodeById(startId);
    const tgt = nextNode(startId, null);
    const tn = nodeById(tgt);
    const ang = Math.atan2(tn.x - n.x, -(tn.y - n.y));
    const lo = laneOffset(ang);
    return {
      x: n.x + lo.dx, y: n.y + lo.dy,
      targetId: tgt, prevId: startId,
      speed: 1.0 + Math.random() * 1.2,
      angle: ang,
      color: AI_COLORS[i % AI_COLORS.length],
    };
  });
}

function spawnCoins(): Array<{ x: number; y: number }> {
  return Array.from({ length: 12 }, () => {
    const n = NODES[Math.floor(Math.random() * NODES.length)];
    return { x: n.x + (Math.random() - 0.5) * 80, y: n.y + (Math.random() - 0.5) * 80 };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
const TrafficRunnerGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapImgRef = useRef<HTMLImageElement | null>(null);
  const [uiState, setUiState] = useState<'idle' | 'playing' | 'paused'>('idle');
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

  const gs = useRef({
    playing: false,
    paused: false,
    // Player world position (lane-offset applied)
    px: 0, py: 0,
    // Waypoint state
    targetId: 4, prevId: 3 as number | null,
    angle: 0,
    // Score / time
    scoreVal: 0, frameCount: 0,
    scenarioIdx: 0, scenarioTimer: 0,
    coins: [] as Array<{ x: number; y: number }>,
    ai: [] as AIVehicle[],
  });

  useEffect(() => {
    const img = new Image();
    img.src = '/manus-storage/city-map_781596a2.png';
    img.onload = () => { mapImgRef.current = img; };
  }, []);

  // ── Waypoint step ──────────────────────────────────────────────────────────
  function stepWaypoint(
    x: number, y: number,
    targetId: number, prevId: number | null,
    speed: number,
    applyLaneOffset: boolean
  ): { x: number; y: number; targetId: number; prevId: number | null; angle: number } {
    const target = nodeById(targetId);
    // Target position: node centre + lane offset
    let tx = target.x, ty = target.y;
    // Compute direction to raw node to get angle
    const rawDx = target.x - (applyLaneOffset ? x - laneOffset(gs.current.angle).dx : x);
    const rawDy = target.y - (applyLaneOffset ? y - laneOffset(gs.current.angle).dy : y);
    const angle = Math.atan2(target.x - x, -(target.y - y));

    if (applyLaneOffset) {
      const lo = laneOffset(angle);
      tx = target.x + lo.dx;
      ty = target.y + lo.dy;
    }

    const dx = tx - x, dy = ty - y;
    const dist = Math.hypot(dx, dy);

    if (dist <= speed + 1) {
      const newPrev = targetId;
      const newTarget = nextNode(targetId, prevId);
      const nt = nodeById(newTarget);
      const newAngle = Math.atan2(nt.x - target.x, -(nt.y - target.y));
      const lo2 = applyLaneOffset ? laneOffset(newAngle) : { dx: 0, dy: 0 };
      return {
        x: target.x + lo2.dx, y: target.y + lo2.dy,
        targetId: newTarget, prevId: newPrev, angle: newAngle,
      };
    }

    return {
      x: x + (dx / dist) * speed,
      y: y + (dy / dist) * speed,
      targetId, prevId, angle,
    };
  }

  // ── Draw ───────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = gs.current;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const camX = s.px - CANVAS_W / (2 * ZOOM);
    const camY = s.py - CANVAS_H / (2 * ZOOM);

    if (mapImgRef.current) {
      ctx.save();
      ctx.scale(ZOOM, ZOOM);
      ctx.drawImage(mapImgRef.current, -camX, -camY);
      ctx.restore();
    }

    const wx = (v: number) => (v - camX) * ZOOM;
    const wy = (v: number) => (v - camY) * ZOOM;

    // Coins
    for (const c of s.coins) {
      const sx = wx(c.x), sy = wy(c.y);
      if (sx < -10 || sx > CANVAS_W + 10 || sy < -10 || sy > CANVAS_H + 10) continue;
      ctx.save();
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    }

    // AI vehicles
    for (const v of s.ai) {
      const sx = wx(v.x), sy = wy(v.y);
      if (sx < -40 || sx > CANVAS_W + 40 || sy < -40 || sy > CANVAS_H + 40) continue;
      drawCar(ctx, sx, sy, v.angle, v.color, ZOOM / 3);
    }

    // Player car (always screen centre)
    drawCar(ctx, CANVAS_W / 2, CANVAS_H / 2, s.angle, '#2ecc71', ZOOM / 3);

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, 290, 62);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`Score: ${s.scoreVal}`, 10, 20);
    ctx.fillText(`Time:  ${(s.frameCount / 60).toFixed(1)}s`, 10, 38);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`Scenario: ${scenarios[s.scenarioIdx]}`, 10, 56);

    if (!s.playing) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('▶ Click Play Car to start', CANVAS_W / 2, CANVAS_H / 2);
      ctx.textAlign = 'left';
    }

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
      s.scenarioTimer += 1 / 60;
      if (s.scenarioTimer >= 15) {
        s.scenarioIdx = (s.scenarioIdx + 1) % scenarios.length;
        s.scenarioTimer = 0;
      }

      // Move player
      const pr = stepWaypoint(s.px, s.py, s.targetId, s.prevId, SPEED, true);
      s.px = pr.x; s.py = pr.y;
      s.angle = pr.angle;
      s.targetId = pr.targetId; s.prevId = pr.prevId;

      // Move AI
      for (const v of s.ai) {
        const r = stepWaypoint(v.x, v.y, v.targetId, v.prevId, v.speed, true);
        v.x = r.x; v.y = r.y; v.angle = r.angle;
        v.targetId = r.targetId; v.prevId = r.prevId;
      }

      // Coins
      s.coins = s.coins.filter(c => {
        if (Math.hypot(c.x - s.px, c.y - s.py) < 22) {
          s.scoreVal += 10;
          return false;
        }
        return true;
      });
      if (s.coins.length === 0) s.coins = spawnCoins();
    }

    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [loop]);

  // ── Controls ───────────────────────────────────────────────────────────────
  const handlePlay = () => {
    const s = gs.current;
    // Start at node 3 (480,96), heading right toward node 4 (608,96)
    const startNode = nodeById(3);
    const tgtNode = nodeById(4);
    const ang = Math.atan2(tgtNode.x - startNode.x, -(tgtNode.y - startNode.y));
    const lo = laneOffset(ang);
    s.px = startNode.x + lo.dx;
    s.py = startNode.y + lo.dy;
    s.targetId = 4; s.prevId = 3;
    s.angle = ang;
    s.scoreVal = 0; s.frameCount = 0;
    s.scenarioIdx = 0; s.scenarioTimer = 0;
    s.coins = spawnCoins();
    s.ai = spawnAI();
    s.playing = true; s.paused = false;
    setUiState('playing');
  };

  const handlePause = () => {
    const s = gs.current;
    s.paused = !s.paused;
    setUiState(s.paused ? 'paused' : 'playing');
  };

  // Stop immediately — no popup, no confirmation
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
