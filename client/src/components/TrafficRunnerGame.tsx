import React, { useRef, useState, useEffect, useCallback } from 'react';

// ─── Canvas / world dimensions ────────────────────────────────────────────────
const CW = 800;
const CH = 500;
const ZOOM = 2.8;

// ─── Road layout (world coords) ───────────────────────────────────────────────
// The road network is a clean grid drawn programmatically.
// Roads are 36px wide (two 18px lanes).
// LANE_RIGHT = +9 from road centre (right lane)
// LANE_LEFT  = -9 from road centre (left lane)
const ROAD_W = 36;
const HALF = ROAD_W / 2;
const LANE = 9; // offset from centre to lane mid

// Horizontal road y-centres (world px)
const H_ROADS = [100, 220, 340, 460, 580];
// Vertical road x-centres (world px)
const V_ROADS = [100, 240, 380, 520, 660, 800, 940, 1080, 1220, 1360];

const WORLD_W = 1460;
const WORLD_H = 680;

// ─── Segment / path types ─────────────────────────────────────────────────────
type Dir = 'E' | 'W' | 'N' | 'S';

interface Segment {
  x1: number; y1: number;
  x2: number; y2: number;
  dir: Dir;
}

// Build a looping route: go east along row, turn south at last col, go west, turn north, repeat
function buildRoute(): Segment[] {
  const segs: Segment[] = [];
  // Outer loop: row 0 east → col 9 south → row 4 west → col 0 north
  const row0 = H_ROADS[0] + LANE;   // right lane going east
  const row4 = H_ROADS[4] - LANE;   // right lane going west
  const col0 = V_ROADS[0] - LANE;   // right lane going north
  const col9 = V_ROADS[9] + LANE;   // right lane going south

  // East along row 0
  segs.push({ x1: V_ROADS[0], y1: row0, x2: V_ROADS[9], y2: row0, dir: 'E' });
  // South along col 9
  segs.push({ x1: col9, y1: H_ROADS[0], x2: col9, y2: H_ROADS[4], dir: 'S' });
  // West along row 4
  segs.push({ x1: V_ROADS[9], y1: row4, x2: V_ROADS[0], y2: row4, dir: 'W' });
  // North along col 0
  segs.push({ x1: col0, y1: H_ROADS[4], x2: col0, y2: H_ROADS[0], dir: 'N' });

  return segs;
}

const ROUTE = buildRoute();
const ROUTE_LEN = ROUTE.length;

// Total path length
function segLen(s: Segment) {
  return Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
}
const SEG_LENGTHS = ROUTE.map(segLen);
const TOTAL_LEN = SEG_LENGTHS.reduce((a, b) => a + b, 0);

// Get world position at distance d along the route
function posAtDist(d: number): { x: number; y: number; dir: Dir } {
  let rem = ((d % TOTAL_LEN) + TOTAL_LEN) % TOTAL_LEN;
  for (let i = 0; i < ROUTE_LEN; i++) {
    const len = SEG_LENGTHS[i];
    if (rem <= len) {
      const t = rem / len;
      const s = ROUTE[i];
      return {
        x: s.x1 + (s.x2 - s.x1) * t,
        y: s.y1 + (s.y2 - s.y1) * t,
        dir: s.dir,
      };
    }
    rem -= len;
  }
  const s = ROUTE[0];
  return { x: s.x1, y: s.y1, dir: s.dir };
}

// Direction → angle in radians (0 = up/north)
function dirToAngle(dir: Dir): number {
  return { N: 0, E: Math.PI / 2, S: Math.PI, W: -Math.PI / 2 }[dir];
}

// ─── AI vehicles ──────────────────────────────────────────────────────────────
interface AIVehicle {
  dist: number;   // distance along route
  speed: number;
  color: string;
  lane: number;   // 0 = same route, 1 = inner lane (opposite direction, decorative)
}

const AI_COLORS = ['#e74c3c', '#3498db', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'];

function makeAI(): AIVehicle[] {
  return Array.from({ length: 6 }, (_, i) => ({
    dist: (TOTAL_LEN / 6) * i + Math.random() * 60,
    speed: 1.4 + Math.random() * 1.0,
    color: AI_COLORS[i % AI_COLORS.length],
    lane: 0,
  }));
}

// ─── Coin type ────────────────────────────────────────────────────────────────
interface Coin {
  dist: number;
  collected: boolean;
}

function makeCoins(): Coin[] {
  return Array.from({ length: 10 }, (_, i) => ({
    dist: (TOTAL_LEN / 10) * i + 40,
    collected: false,
  }));
}

// ─── Draw helpers ─────────────────────────────────────────────────────────────
function drawRoads(ctx: CanvasRenderingContext2D) {
  // Asphalt background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  // Grass / block fill
  ctx.fillStyle = '#2d5a27';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  // Road surfaces (horizontal)
  ctx.fillStyle = '#3a3a3a';
  for (const y of H_ROADS) {
    ctx.fillRect(0, y - HALF, WORLD_W, ROAD_W);
  }
  // Road surfaces (vertical)
  for (const x of V_ROADS) {
    ctx.fillRect(x - HALF, 0, ROAD_W, WORLD_H);
  }

  // Intersection squares (slightly lighter)
  ctx.fillStyle = '#444';
  for (const y of H_ROADS) {
    for (const x of V_ROADS) {
      ctx.fillRect(x - HALF, y - HALF, ROAD_W, ROAD_W);
    }
  }

  // Kerb lines (edge of road)
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1.5;
  for (const y of H_ROADS) {
    ctx.beginPath(); ctx.moveTo(0, y - HALF); ctx.lineTo(WORLD_W, y - HALF); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, y + HALF); ctx.lineTo(WORLD_W, y + HALF); ctx.stroke();
  }
  for (const x of V_ROADS) {
    ctx.beginPath(); ctx.moveTo(x - HALF, 0); ctx.lineTo(x - HALF, WORLD_H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + HALF, 0); ctx.lineTo(x + HALF, WORLD_H); ctx.stroke();
  }

  // Centre dashes (white, between lanes)
  ctx.setLineDash([12, 10]);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  for (const y of H_ROADS) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_W, y); ctx.stroke();
  }
  for (const x of V_ROADS) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_H); ctx.stroke();
  }
  ctx.setLineDash([]);

  // Crosswalk stripes at each intersection
  ctx.fillStyle = '#fff';
  const stripeW = 5, stripeGap = 8, stripeLen = HALF - 2;
  for (const y of H_ROADS) {
    for (const x of V_ROADS) {
      // Horizontal crosswalks (top & bottom of intersection)
      for (let sx = x - HALF + 2; sx < x + HALF - 2; sx += stripeW + stripeGap) {
        ctx.fillRect(sx, y - HALF - stripeLen, stripeW, stripeLen);
        ctx.fillRect(sx, y + HALF, stripeW, stripeLen);
      }
      // Vertical crosswalks (left & right of intersection)
      for (let sy = y - HALF + 2; sy < y + HALF - 2; sy += stripeW + stripeGap) {
        ctx.fillRect(x - HALF - stripeLen, sy, stripeLen, stripeW);
        ctx.fillRect(x + HALF, sy, stripeLen, stripeW);
      }
    }
  }

  // Decorative buildings (coloured blocks in each city block)
  const buildingColors = ['#5d4037','#37474f','#4a148c','#1b5e20','#bf360c','#0d47a1'];
  let bi = 0;
  for (let ri = 0; ri < H_ROADS.length - 1; ri++) {
    for (let ci = 0; ci < V_ROADS.length - 1; ci++) {
      const bx = V_ROADS[ci] + HALF + 6;
      const by = H_ROADS[ri] + HALF + 6;
      const bw = V_ROADS[ci + 1] - HALF - 6 - bx;
      const bh = H_ROADS[ri + 1] - HALF - 6 - by;
      if (bw > 10 && bh > 10) {
        ctx.fillStyle = buildingColors[bi % buildingColors.length];
        ctx.fillRect(bx, by, bw, bh);
        // Window grid
        ctx.fillStyle = 'rgba(255,255,200,0.25)';
        const cols = Math.floor(bw / 14), rows = Math.floor(bh / 14);
        for (let wc = 0; wc < cols; wc++) {
          for (let wr = 0; wr < rows; wr++) {
            ctx.fillRect(bx + 5 + wc * 14, by + 5 + wr * 14, 7, 7);
          }
        }
      }
      bi++;
    }
  }
}

function drawCar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  angle: number,
  color: string,
  w = 10, h = 18
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(2, 2, w * 0.6, h * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 2.5);
  ctx.fill();

  // Roof
  ctx.fillStyle = shadeColor(color, -40);
  ctx.beginPath();
  ctx.roundRect(-w * 0.35, -h * 0.22, w * 0.7, h * 0.36, 2);
  ctx.fill();

  // Windshield
  ctx.fillStyle = 'rgba(160,210,255,0.8)';
  ctx.beginPath();
  ctx.roundRect(-w * 0.28, -h * 0.42, w * 0.56, h * 0.17, 1);
  ctx.fill();

  // Rear window
  ctx.fillStyle = 'rgba(160,210,255,0.6)';
  ctx.beginPath();
  ctx.roundRect(-w * 0.26, h * 0.11, w * 0.52, h * 0.12, 1);
  ctx.fill();

  // Headlights
  ctx.fillStyle = '#fffde7';
  ctx.shadowColor = '#fff9c4'; ctx.shadowBlur = 4;
  ctx.beginPath(); ctx.ellipse(-w * 0.27, -h * 0.44, w * 0.1, h * 0.04, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( w * 0.27, -h * 0.44, w * 0.1, h * 0.04, 0, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  // Tail lights
  ctx.fillStyle = '#e53935';
  ctx.beginPath(); ctx.ellipse(-w * 0.27, h * 0.44, w * 0.1, h * 0.04, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( w * 0.27, h * 0.44, w * 0.1, h * 0.04, 0, 0, Math.PI * 2); ctx.fill();

  // Wheels
  ctx.fillStyle = '#111';
  const wy = h * 0.3, wx2 = w * 0.42, ww = w * 0.22, wh2 = h * 0.12;
  [[-wx2, -wy], [wx2, -wy], [-wx2, wy], [wx2, wy]].forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.roundRect(cx - ww / 2, cy - wh2 / 2, ww, wh2, 1.5);
    ctx.fill();
    // Hubcap
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(cx, cy, ww * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
  });

  // Outline
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 2.5);
  ctx.stroke();

  ctx.restore();
}

function shadeColor(hex: string, amt: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amt));
  return `rgb(${r},${g},${b})`;
}

// ─── Component ────────────────────────────────────────────────────────────────
const TrafficRunnerGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const brakeRef = useRef<HTMLDivElement>(null);
  const roadCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [uiState, setUiState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [brakeVal, setBrakeVal] = useState(0); // 0–1

  const scenarios = [
    'Unprotected Left Turn', 'Right Turn — Pedestrian',
    '4-Way Stop', 'Emergency Vehicle',
    'T-Intersection', 'Roundabout Entry',
    'Driveway Exit', 'Green Light Left Turn',
  ];

  const gs = useRef({
    playing: false,
    paused: false,
    dist: 0,           // distance along route
    speed: 0,          // current speed px/frame
    maxSpeed: 3.2,
    brakeForce: 0,     // 0–1 from slider
    score: 0,
    frame: 0,
    scenarioIdx: 0,
    scenarioTimer: 0,
    coins: [] as Coin[],
    ai: [] as AIVehicle[],
  });

  // Pre-render road to offscreen canvas once
  useEffect(() => {
    const oc = document.createElement('canvas');
    oc.width = WORLD_W; oc.height = WORLD_H;
    const octx = oc.getContext('2d')!;
    drawRoads(octx);
    roadCanvasRef.current = oc;
  }, []);

  // ── Draw frame ─────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = gs.current;

    const { x: px, y: py, dir } = posAtDist(s.dist);
    const playerAngle = dirToAngle(dir);

    // Camera centred on player
    const camX = px - CW / (2 * ZOOM);
    const camY = py - CH / (2 * ZOOM);

    ctx.clearRect(0, 0, CW, CH);
    ctx.save();
    ctx.scale(ZOOM, ZOOM);

    // Draw pre-rendered road
    if (roadCanvasRef.current) {
      ctx.drawImage(roadCanvasRef.current, -camX, -camY);
    }

    // Coins
    for (const c of s.coins) {
      if (c.collected) continue;
      const { x: cx, y: cy } = posAtDist(c.dist);
      const sx = cx - camX, sy = cy - camY;
      ctx.save();
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    }

    // AI vehicles
    for (const v of s.ai) {
      const { x: vx, y: vy, dir: vd } = posAtDist(v.dist);
      drawCar(ctx, vx - camX, vy - camY, dirToAngle(vd), v.color, 10, 18);
    }

    // Player car
    drawCar(ctx, px - camX, py - camY, playerAngle, '#2ecc71', 11, 20);

    ctx.restore();

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, 300, 68);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`Score: ${s.score}`, 10, 20);
    ctx.fillText(`Speed: ${(s.speed * 10).toFixed(0)} km/h`, 10, 38);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`Scenario: ${scenarios[s.scenarioIdx]}`, 10, 56);

    if (!s.playing) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, CW, CH);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('▶ Click Play to start', CW / 2, CH / 2);
      ctx.textAlign = 'left';
    }
    if (s.playing && s.paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, CW, CH);
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⏸ PAUSED', CW / 2, CH / 2);
      ctx.textAlign = 'left';
    }
  }, []);

  // ── Game loop ──────────────────────────────────────────────────────────────
  const loop = useCallback(() => {
    const s = gs.current;

    if (s.playing && !s.paused) {
      s.frame++;
      s.scenarioTimer += 1 / 60;
      if (s.scenarioTimer >= 15) {
        s.scenarioIdx = (s.scenarioIdx + 1) % scenarios.length;
        s.scenarioTimer = 0;
      }

      // While brake is held, ramp up to 100% over 2 seconds even without drag
      if (brakeActive.current && brakeHoldStart.current !== null) {
        const elapsed = (performance.now() - brakeHoldStart.current) / 2000;
        const timeRamp = Math.min(1, elapsed);
        const newVal = Math.min(1, 0.5 + timeRamp * 0.5);
        if (newVal > s.brakeForce) {
          s.brakeForce = newVal;
          setBrakeVal(newVal);
        }
      }

      // Speed physics: accelerate toward maxSpeed, brake reduces it
      const target = s.maxSpeed * (1 - s.brakeForce);
      const accel = s.brakeForce > 0.05 ? -0.12 * s.brakeForce : 0.04;
      s.speed = Math.max(0, Math.min(s.maxSpeed, s.speed + accel));
      // Clamp to target from below when braking
      if (s.brakeForce > 0.05) s.speed = Math.min(s.speed, target);

      s.dist += s.speed;

      // Move AI
      for (const v of s.ai) {
        v.dist = (v.dist + v.speed) % TOTAL_LEN;
      }

      // Coin collection
      const { x: px, y: py } = posAtDist(s.dist);
      for (const c of s.coins) {
        if (c.collected) continue;
        const { x: cx, y: cy } = posAtDist(c.dist);
        if (Math.hypot(cx - px, cy - py) < 16) {
          c.collected = true;
          s.score += 10;
        }
      }
      // Respawn all if all collected
      if (s.coins.every(c => c.collected)) s.coins = makeCoins();
    }

    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [loop]);

  // ── Brake interaction ────────────────────────────────────────────────────────
  // Tap = instant 50%. Hold & slide down = remaining 50% builds over 2 seconds.
  // Release = spring back to 0.
  const brakeActive = useRef(false);
  const brakeHoldStart = useRef<number | null>(null); // timestamp when press began
  const brakeStartClientY = useRef(0);

  const onBrakeStart = useCallback((clientY: number) => {
    brakeActive.current = true;
    brakeHoldStart.current = performance.now();
    brakeStartClientY.current = clientY;
    // Instant 50% on tap
    gs.current.brakeForce = 0.5;
    setBrakeVal(0.5);
  }, []);

  const onBrakeMove = useCallback((clientY: number) => {
    if (!brakeActive.current) return;
    const el = brakeRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // How far down from the press start point (0 = no extra, 1 = full extra)
    const dragDelta = (clientY - brakeStartClientY.current) / (rect.height * 0.5);
    const dragExtra = Math.max(0, Math.min(1, dragDelta)); // 0–1 for the upper half of track
    // Time-based ramp: 0→1 over 2 seconds while held
    const elapsed = brakeHoldStart.current !== null
      ? (performance.now() - brakeHoldStart.current) / 2000
      : 0;
    const timeRamp = Math.min(1, elapsed);
    // Extra 50% = max of drag position OR time ramp
    const extra = Math.max(dragExtra, timeRamp) * 0.5;
    const val = Math.min(1, 0.5 + extra);
    gs.current.brakeForce = val;
    setBrakeVal(val);
  }, []);

  const onBrakeEnd = useCallback(() => {
    brakeActive.current = false;
    brakeHoldStart.current = null;
    gs.current.brakeForce = 0;
    setBrakeVal(0);
  }, []);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => { onBrakeStart(e.clientY); };
  const onMouseMove = useCallback((e: MouseEvent) => { onBrakeMove(e.clientY); }, [onBrakeMove]);
  const onMouseUp = useCallback(() => { onBrakeEnd(); }, [onBrakeEnd]);

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => { onBrakeStart(e.touches[0].clientY); };
  const onTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    onBrakeMove(e.touches[0].clientY);
  }, [onBrakeMove]);
  const onTouchEnd = useCallback(() => { onBrakeEnd(); }, [onBrakeEnd]);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [onMouseMove, onMouseUp, onTouchMove, onTouchEnd]);

  // ── Controls ───────────────────────────────────────────────────────────────
  const handlePlay = () => {
    const s = gs.current;
    s.dist = 0; s.speed = 0; s.score = 0; s.frame = 0;
    s.scenarioIdx = 0; s.scenarioTimer = 0;
    s.brakeForce = 0;
    s.coins = makeCoins();
    s.ai = makeAI();
    s.playing = true; s.paused = false;
    setBrakeVal(0);
    setUiState('playing');
  };

  const handleStop = () => {
    gs.current.playing = false;
    gs.current.paused = false;
    gs.current.brakeForce = 0;
    setBrakeVal(0);
    setUiState('idle');
  };

  const brakePercent = Math.round(brakeVal * 100);
  const brakeColor = brakeVal < 0.3
    ? '#2ecc71'
    : brakeVal < 0.65
    ? '#f39c12'
    : '#e74c3c';

  return (
    <div className="w-full bg-gray-900 rounded-lg overflow-hidden select-none">
      <div className="flex gap-0">
        {/* Canvas */}
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            width={CW}
            height={CH}
            className="w-full h-full block"
          />
        </div>

        {/* Brake slider panel */}
        <div className="flex flex-col items-center justify-between bg-gray-800 px-3 py-4 w-20 gap-2">
          <span className="text-white text-xs font-bold text-center leading-tight">BRAKE</span>

          {/* Slider track */}
          <div
            ref={brakeRef}
            className="relative flex-1 w-10 rounded-full cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '2px solid rgba(255,255,255,0.15)',
              minHeight: 200,
              touchAction: 'none',
            }}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
          >
            {/* Fill bar */}
            <div
              className="absolute bottom-0 left-0 right-0 rounded-full transition-none"
              style={{
                height: `${brakePercent}%`,
                background: `linear-gradient(to top, ${brakeColor}, ${brakeColor}88)`,
                transition: brakeVal === 0 ? 'height 0.3s ease-out' : 'none',
              }}
            />
            {/* Thumb */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
              style={{
                bottom: `calc(${brakePercent}% - 16px)`,
                background: brakeColor,
                border: '3px solid rgba(255,255,255,0.6)',
                transition: brakeVal === 0 ? 'bottom 0.3s ease-out, background 0.2s' : 'background 0.2s',
                cursor: 'grab',
              }}
            >
              <span className="text-white text-xs font-black">▼</span>
            </div>
          </div>

          {/* Percentage */}
          <span className="text-xs font-bold" style={{ color: brakeColor }}>
            {brakePercent}%
          </span>

          {/* Brake label */}
          <div className="text-center">
            <span className="text-gray-400 text-xs">slide ↕</span>
          </div>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex gap-2 p-3 bg-gray-800 border-t border-gray-700 justify-center">
        <button
          onClick={handlePlay}
          disabled={uiState === 'playing'}
          className="px-5 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 disabled:opacity-40 transition-all active:scale-95 text-sm"
        >
          ▶ Play
        </button>
        <button
          onClick={handleStop}
          disabled={uiState === 'idle'}
          className="px-5 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 disabled:opacity-40 transition-all active:scale-95 text-sm"
        >
          ⏹ Stop
        </button>
      </div>
    </div>
  );
};

export default TrafficRunnerGame;
