import React, { useRef, useEffect, useState } from 'react';
import { Slider } from '@/components/ui/slider';

const CANVAS_W = 800;
const CANVAS_H = 600;
const TILE_SIZE = 32;  // Isometric tile size
const TOTAL_LEN = 2000; // Total route distance

// ─── Isometric Projection ─────────────────────────────────────────────────────
// Convert 2D world coords to isometric screen coords
function worldToIso(x: number, y: number): [number, number] {
  const isoX = (x - y) * 0.866;  // cos(30°)
  const isoY = (x + y) * 0.5;    // sin(30°)
  return [isoX + CANVAS_W / 2, isoY + CANVAS_H / 3];
}

// ─── Game types ───────────────────────────────────────────────────────────────
interface AIVehicle {
  dist: number;
  speed: number;
  color: string;
  lane: number;
}

interface Coin {
  dist: number;
  collected: boolean;
}

const AI_COLORS = ['#e74c3c', '#3498db', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'];

function makeAI(): AIVehicle[] {
  return Array.from({ length: 12 }, (_, i) => ({
    dist: (TOTAL_LEN / 12) * i + Math.random() * 120,
    speed: 1.4 + Math.random() * 1.0,
    color: AI_COLORS[i % AI_COLORS.length],
    lane: 0,
  }));
}

function makeCoins(): Coin[] {
  return Array.from({ length: 20 }, (_, i) => ({
    dist: (TOTAL_LEN / 20) * i + Math.random() * 50,
    collected: false,
  }));
}

// ─── Position along route (simple circular path in isometric space) ───────────
function posAtDist(dist: number): { x: number; y: number; heading: number } {
  const angle = (dist / TOTAL_LEN) * Math.PI * 2;
  const radius = 300;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const heading = angle;
  return { x, y, heading };
}

// ─── Draw isometric building ───────────────────────────────────────────────────
function drawIsoBuildingBlock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  const [sx, sy] = worldToIso(x, y);
  const [ex, ey] = worldToIso(x + w, y);
  const [ex2, ey2] = worldToIso(x + w, y + h);
  const [sx2, sy2] = worldToIso(x, y + h);

  // Top face
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.lineTo(ex2, ey2);
  ctx.lineTo(sx2, sy2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Left face (shadow)
  ctx.fillStyle = adjustBrightness(color, -30);
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx2, sy2);
  ctx.lineTo(sx2, sy2 + 20);
  ctx.lineTo(sx, sy + 20);
  ctx.closePath();
  ctx.fill();

  // Right face (shadow)
  ctx.fillStyle = adjustBrightness(color, -20);
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex2, ey2);
  ctx.lineTo(ex2, ey2 + 20);
  ctx.lineTo(ex, ey + 20);
  ctx.closePath();
  ctx.fill();
}

function adjustBrightness(color: string, amount: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// ─── Draw isometric car ────────────────────────────────────────────────────────
function drawIsoCar(ctx: CanvasRenderingContext2D, x: number, y: number, heading: number, color: string, size: number = 1) {
  const [sx, sy] = worldToIso(x, y);
  
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(heading);

  // Car body (isometric diamond shape)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -12 * size);
  ctx.lineTo(8 * size, -4 * size);
  ctx.lineTo(0, 12 * size);
  ctx.lineTo(-8 * size, -4 * size);
  ctx.closePath();
  ctx.fill();

  // Windshield
  ctx.fillStyle = '#87ceeb';
  ctx.beginPath();
  ctx.moveTo(-4 * size, -8 * size);
  ctx.lineTo(4 * size, -8 * size);
  ctx.lineTo(2 * size, -2 * size);
  ctx.lineTo(-2 * size, -2 * size);
  ctx.closePath();
  ctx.fill();

  // Headlights
  ctx.fillStyle = '#ffff99';
  ctx.fillRect(-3 * size, -12 * size, 2 * size, 2 * size);
  ctx.fillRect(1 * size, -12 * size, 2 * size, 2 * size);

  ctx.restore();
}

// ─── Draw isometric coin ───────────────────────────────────────────────────────
function drawIsoCoin(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const [sx, sy] = worldToIso(x, y);
  
  // Coin as isometric diamond
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.moveTo(sx, sy - 8);
  ctx.lineTo(sx + 8, sy);
  ctx.lineTo(sx, sy + 8);
  ctx.lineTo(sx - 8, sy);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#ffaa00';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ─── Main game component ───────────────────────────────────────────────────────
export function TrafficRunnerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brakeVal, setBrakeVal] = useState(0);
  const [uiState, setUiState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const SCENARIOS = [
    'Unprotected Left Turn', 'Right Turn—Pedestrian', 'Yield at Stop Sign',
    'School Zone', 'Merging Traffic', 'Roundabout Entry', 'Driveway Exit',
  ];

  const gs = useRef({
    playing: false,
    paused: false,
    dist: TOTAL_LEN * 0.25,
    speed: 0,
    maxSpeed: 2.88,
    brakeForce: 0,
    score: 0,
    frame: 0,
    scenarioIdx: 0,
    scenarioTimer: 0,
    coins: [] as Coin[],
    ai: [] as AIVehicle[],
    crashed: false,
    graceFrames: 120,
    brakePressTime: 0,
  });

  // Draw isometric road network
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      // Background
      ctx.fillStyle = '#87ceeb';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Draw isometric grid and buildings
      for (let x = -400; x < 400; x += 64) {
        for (let y = -400; y < 400; y += 64) {
          // Grass
          const [sx, sy] = worldToIso(x, y);
          ctx.fillStyle = '#90ee90';
          ctx.fillRect(sx - 30, sy - 15, 60, 30);

          // Random buildings
          if ((Math.abs(x) + Math.abs(y)) % 128 === 0 && Math.random() > 0.4) {
            const colors = ['#d4a574', '#b8860b', '#cd853f', '#8b4513'];
            drawIsoBuildingBlock(ctx, x, y, 48, 48, colors[Math.floor(Math.random() * colors.length)]);
          }
        }
      }

      // Draw road (circular path)
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const angle = (i / 100) * Math.PI * 2;
        const radius = 300;
        const wx = Math.cos(angle) * radius;
        const wy = Math.sin(angle) * radius;
        const [sx, sy] = worldToIso(wx, wy);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.stroke();

      // Road markings (dashed centre line)
      ctx.strokeStyle = '#ffff99';
      ctx.setLineDash([8, 8]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const angle = (i / 100) * Math.PI * 2;
        const radius = 300;
        const wx = Math.cos(angle) * radius;
        const wy = Math.sin(angle) * radius;
        const [sx, sy] = worldToIso(wx, wy);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
    };

    draw();
  }, []);

  // Game loop
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const s = gs.current;
    const interval = setInterval(() => {
      if (!s.playing) return;

      // Update player
      const brakeEffect = 1 - s.brakeForce * 0.8;
      s.speed = Math.min(s.maxSpeed * brakeEffect, s.speed + 0.05);
      s.dist = (s.dist + s.speed) % TOTAL_LEN;

      // Update AI
      for (const v of s.ai) {
        v.dist = (v.dist + v.speed) % TOTAL_LEN;
      }

      // Collision detection (with grace period)
      s.graceFrames--;
      if (!s.crashed && s.graceFrames <= 0) {
        const { x: px, y: py } = posAtDist(s.dist);
        for (const v of s.ai) {
          const { x: vx, y: vy } = posAtDist(v.dist);
          const dist = Math.hypot(vx - px, vy - py);
          if (dist < 30) {
            s.crashed = true;
            s.playing = false;
            break;
          }
        }
      }

      // Coin collection
      const { x: px, y: py } = posAtDist(s.dist);
      for (const c of s.coins) {
        if (!c.collected) {
          const { x: cx, y: cy } = posAtDist(c.dist);
          if (Math.hypot(cx - px, cy - py) < 25) {
            c.collected = true;
            s.score += 10;
          }
        }
      }

      // Scenario rotation
      s.scenarioTimer++;
      if (s.scenarioTimer > 900) {
        s.scenarioIdx = (s.scenarioIdx + 1) % SCENARIOS.length;
        s.scenarioTimer = 0;
      }

      s.frame++;

      // Draw game
      ctx.fillStyle = '#87ceeb';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Draw buildings and road
      for (let x = -400; x < 400; x += 64) {
        for (let y = -400; y < 400; y += 64) {
          const [sx, sy] = worldToIso(x, y);
          ctx.fillStyle = '#90ee90';
          ctx.fillRect(sx - 30, sy - 15, 60, 30);

          if ((Math.abs(x) + Math.abs(y)) % 128 === 0 && Math.random() > 0.4) {
            const colors = ['#d4a574', '#b8860b', '#cd853f', '#8b4513'];
            drawIsoBuildingBlock(ctx, x, y, 48, 48, colors[Math.floor(Math.random() * colors.length)]);
          }
        }
      }

      // Draw road
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 40;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const angle = (i / 100) * Math.PI * 2;
        const radius = 300;
        const wx = Math.cos(angle) * radius;
        const wy = Math.sin(angle) * radius;
        const [sx, sy] = worldToIso(wx, wy);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.stroke();

      // Draw coins
      for (const c of s.coins) {
        if (!c.collected) {
          const { x, y } = posAtDist(c.dist);
          drawIsoCoin(ctx, x, y);
        }
      }

      // Draw AI vehicles
      for (const v of s.ai) {
        const { x, y, heading } = posAtDist(v.dist);
        drawIsoCar(ctx, x, y, heading, v.color, 0.8);
      }

      // Draw player car
      const { x: px2, y: py2, heading: ph } = posAtDist(s.dist);
      drawIsoCar(ctx, px2, py2, ph, '#00cc00', 1);

      // Draw HUD
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(10, 10, 200, 100);
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.fillText(`Score: ${s.score}`, 20, 30);
      ctx.fillText(`Speed: ${(s.speed * 10).toFixed(1)} km/h`, 20, 50);
      ctx.fillText(`Scenario: ${SCENARIOS[s.scenarioIdx]}`, 20, 70);
      ctx.fillText(`Brake: ${Math.round(s.brakeForce * 100)}%`, 20, 90);

      // Draw crash overlay
      if (s.crashed) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CRASH!', CANVAS_W / 2, CANVAS_H / 2 - 40);
        ctx.fillStyle = '#fff';
        ctx.font = '24px sans-serif';
        ctx.fillText(`Final Score: ${s.score}`, CANVAS_W / 2, CANVAS_H / 2 + 40);
        ctx.textAlign = 'left';
      }
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [SCENARIOS]);

  const handlePlay = () => {
    const s = gs.current;
    s.dist = TOTAL_LEN * 0.25;
    s.speed = 0;
    s.score = 0;
    s.frame = 0;
    s.scenarioIdx = 0;
    s.scenarioTimer = 0;
    s.brakeForce = 0;
    s.crashed = false;
    s.graceFrames = 120;
    s.coins = makeCoins();
    s.ai = makeAI();
    s.playing = true;
    s.paused = false;
    setBrakeVal(0);
    setUiState('playing');
  };

  const handleStop = () => {
    gs.current.playing = false;
    gs.current.paused = false;
    setUiState('idle');
    setBrakeVal(0);
  };

  const handleBrakeChange = (val: number[]) => {
    const brakePercent = val[0] / 100;
    gs.current.brakeForce = brakePercent;
    setBrakeVal(brakePercent);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-900 rounded-lg">
      <div className="flex gap-4">
        <div className="flex-1">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full border-2 border-gray-700 rounded"
          />
        </div>

        {/* Enlarged Brake Button */}
        <div className="flex flex-col items-center gap-4 p-4 bg-gray-800 rounded-lg w-32">
          <div className="text-white font-bold text-lg">BRAKE</div>
          <Slider
            value={[brakeVal * 100]}
            onValueChange={handleBrakeChange}
            min={0}
            max={100}
            step={1}
            orientation="vertical"
            className="h-64"
          />
          <div className="text-white text-sm font-mono">{Math.round(brakeVal * 100)}%</div>
          <div className="text-xs text-gray-400 text-center">slide ↕</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={handlePlay}
          disabled={uiState === 'playing'}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          ▶ Play
        </button>
        <button
          onClick={handleStop}
          disabled={uiState === 'idle'}
          className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          ⏹ Stop
        </button>
      </div>
    </div>
  );
}
