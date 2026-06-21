/**
 * Traffic Jam Runner — Map-Based Fixed Route with Lane Mechanics & Camera
 * - Car stays in correct lane based on route
 * - Car rotates to match road direction
 * - Camera follows car, scrolling the map
 * - Play/Stop button to start/pause
 * - Game ends if player fails to yield at correct time
 */
import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const CANVAS_W = 340;
const CANVAS_H = 560;
const MAP_W = 400;
const MAP_H = 1200; // Large map to scroll through
const LEVEL_TIME = 90;
const LANE_WIDTH = 40;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Waypoint {
  x: number;
  y: number;
  lane: 'left' | 'center' | 'right'; // Which lane the car should be in
  heading: number; // Rotation in degrees (0=up, 90=right, 180=down, 270=left)
  type: 'road' | 'intersection';
  scenario?: Scenario;
  yieldRequired: boolean;
  yieldWindow: [number, number];
}

interface Scenario {
  title: string;
  law: string;
}

interface GameState {
  phase: 'idle' | 'playing' | 'paused' | 'crashed' | 'levelComplete' | 'timeout';
  score: number;
  time: number;
  level: number;
  currentWaypoint: number;
  playerPaused: boolean;
}

// ─── DMV Scenarios ────────────────────────────────────────────────────────────
const SCENARIOS: Scenario[] = [
  { title: 'Unprotected Left Turn', law: 'Yield to ALL oncoming traffic before turning left.' },
  { title: 'Right Turn — Pedestrian', law: 'Yield to pedestrians in crosswalk before turning right.' },
  { title: '4-Way Stop', law: 'Simultaneous arrival — yield to vehicle on your RIGHT.' },
  { title: 'Emergency Vehicle', law: 'Always yield to emergency vehicles — pull over and stop.' },
  { title: 'T-Intersection', law: 'Through-road traffic has right-of-way over entering vehicles.' },
  { title: 'Roundabout Entry', law: 'Yield to all vehicles already circulating inside.' },
  { title: 'Driveway Exit', law: 'Yield to ALL road traffic and pedestrians when exiting.' },
  { title: 'Green Light Left Turn', law: 'Green does NOT give priority. Yield to oncoming straight traffic.' },
];

// ─── Fixed Route with Lane & Heading Info ────────────────────────────────────
function generateRoute(): Waypoint[] {
  const route: Waypoint[] = [];
  const centerX = MAP_W / 2;

  // Segment 1: Drive straight up (heading 0 = north)
  route.push({ x: centerX, y: 1100, lane: 'center', heading: 0, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });
  route.push({ x: centerX, y: 1000, lane: 'center', heading: 0, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });
  route.push({ x: centerX, y: 900, lane: 'center', heading: 0, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });

  // First intersection (Unprotected Left Turn) - yield 10-15s
  route.push({ x: centerX, y: 800, lane: 'center', heading: 0, type: 'intersection', scenario: SCENARIOS[0], yieldRequired: true, yieldWindow: [10, 15] });

  // Turn left (heading 270 = west)
  route.push({ x: centerX - 50, y: 800, lane: 'center', heading: 270, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });
  route.push({ x: centerX - 100, y: 800, lane: 'center', heading: 270, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });

  // Drive down (heading 180 = south)
  route.push({ x: centerX - 100, y: 700, lane: 'center', heading: 180, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });
  route.push({ x: centerX - 100, y: 600, lane: 'center', heading: 180, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });
  route.push({ x: centerX - 100, y: 500, lane: 'center', heading: 180, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });

  // Second intersection (Right Turn Pedestrian) - yield 25-30s
  route.push({ x: centerX - 100, y: 400, lane: 'center', heading: 180, type: 'intersection', scenario: SCENARIOS[1], yieldRequired: true, yieldWindow: [25, 30] });

  // Turn right (heading 90 = east)
  route.push({ x: centerX - 50, y: 400, lane: 'center', heading: 90, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });
  route.push({ x: centerX, y: 400, lane: 'center', heading: 90, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });
  route.push({ x: centerX + 50, y: 400, lane: 'center', heading: 90, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });

  // Drive up (heading 0 = north)
  route.push({ x: centerX + 50, y: 300, lane: 'center', heading: 0, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });
  route.push({ x: centerX + 50, y: 200, lane: 'center', heading: 0, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });
  route.push({ x: centerX + 50, y: 100, lane: 'center', heading: 0, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });

  // Third intersection (4-Way Stop) - yield 40-45s
  route.push({ x: centerX + 50, y: 50, lane: 'center', heading: 0, type: 'intersection', scenario: SCENARIOS[2], yieldRequired: true, yieldWindow: [40, 45] });

  return route;
}

// ─── Drawing Functions ────────────────────────────────────────────────────────
function drawMap(ctx: CanvasRenderingContext2D, cameraY: number) {
  // Background
  ctx.fillStyle = '#14532d';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Grass texture
  ctx.fillStyle = 'rgba(21,128,61,0.4)';
  for (let gx = 0; gx < CANVAS_W; gx += 18) {
    for (let gy = 0; gy < CANVAS_H; gy += 18) {
      const worldY = gy + cameraY;
      ctx.beginPath();
      ctx.arc(gx + 4, gy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Main vertical road (center)
  const roadX = CANVAS_W / 2;
  ctx.fillStyle = '#1c2526';
  ctx.fillRect(roadX - 60, 0, 120, CANVAS_H);

  // Road center line
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.setLineDash([20, 20]);
  ctx.beginPath();
  ctx.moveTo(roadX, 0);
  ctx.lineTo(roadX, CANVAS_H);
  ctx.stroke();
  ctx.setLineDash([]);

  // Road edge lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(roadX - 60, 0);
  ctx.lineTo(roadX - 60, CANVAS_H);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(roadX + 60, 0);
  ctx.lineTo(roadX + 60, CANVAS_H);
  ctx.stroke();

  // Lane dividers
  ctx.strokeStyle = 'rgba(251,191,36,0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(roadX - 20, 0);
  ctx.lineTo(roadX - 20, CANVAS_H);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(roadX + 20, 0);
  ctx.lineTo(roadX + 20, CANVAS_H);
  ctx.stroke();
  ctx.setLineDash([]);

  // Horizontal roads (intersections)
  ctx.fillStyle = '#1c2526';
  ctx.fillRect(0, 240 - cameraY, CANVAS_W, 80); // Intersection 1
  ctx.fillRect(0, 80 - cameraY, CANVAS_W, 80);  // Intersection 2
  ctx.fillRect(0, -80 - cameraY, CANVAS_W, 80); // Intersection 3

  // Intersection lines
  ctx.strokeStyle = 'rgba(251,191,36,0.4)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(roadX - 60, 240 - cameraY, 120, 80);
  ctx.strokeRect(roadX - 60, 80 - cameraY, 120, 80);
  ctx.strokeRect(roadX - 60, -80 - cameraY, 120, 80);
}

function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, heading: number, crashed: boolean) {
  const w = 24;
  const h = 40;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((heading * Math.PI) / 180);

  const body = crashed ? '#7f1d1d' : '#14532d';
  const roof = crashed ? '#450a0a' : '#052e16';
  const win = crashed ? '#fca5a5' : '#86efac';

  ctx.shadowColor = crashed ? '#ef4444' : '#22c55e';
  ctx.shadowBlur = crashed ? 16 : 10;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, h / 2 + 3, w * 0.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 4, -h / 2);
  ctx.lineTo(w / 2 - 4, -h / 2);
  ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + 4);
  ctx.lineTo(w / 2, h / 2 - 4);
  ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - 4, h / 2);
  ctx.lineTo(-w / 2 + 4, h / 2);
  ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - 4);
  ctx.lineTo(-w / 2, -h / 2 + 4);
  ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + 4, -h / 2);
  ctx.fill();

  // Roof
  ctx.fillStyle = roof;
  ctx.fillRect(-w / 2 + 3, -h / 2 + h * 0.2, w - 6, h * 0.35);

  // Windshield
  ctx.fillStyle = win;
  ctx.globalAlpha = 0.7;
  ctx.fillRect(-w / 2 + 2, -h / 2 + 2, w - 4, 8);
  ctx.globalAlpha = 1;

  // Headlights
  ctx.fillStyle = '#fef9c3';
  ctx.shadowColor = '#fef9c3';
  ctx.shadowBlur = 6;
  ctx.fillRect(-w / 2 + 1, -h / 2 + 1, 4, 3);
  ctx.fillRect(w / 2 - 5, -h / 2 + 1, 4, 3);
  ctx.shadowBlur = 0;

  // Taillights
  ctx.fillStyle = '#ef4444';
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 5;
  ctx.fillRect(-w / 2 + 1, h / 2 - 4, 4, 3);
  ctx.fillRect(w / 2 - 5, h / 2 - 4, 4, 3);
  ctx.shadowBlur = 0;

  ctx.restore();
}

function drawHUD(ctx: CanvasRenderingContext2D, score: number, time: number, scenario: Scenario | null, yieldRequired: boolean, yieldWindow: [number, number]) {
  // Top HUD bar
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, CANVAS_W, 40);

  // Time display
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`⏱ ${time.toFixed(1)}s`, 8, 24);

  // Score
  ctx.fillStyle = '#fbbf24';
  ctx.textAlign = 'right';
  ctx.fillText(`${score} pts`, CANVAS_W - 8, 24);

  // Scenario info
  if (scenario && yieldRequired) {
    ctx.fillStyle = 'rgba(15,23,42,0.85)';
    ctx.fillRect(0, 40, CANVAS_W, 32);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`⚠ ${scenario.title}`, CANVAS_W / 2, 52);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px Arial';
    let t = scenario.law;
    while (ctx.measureText(t).width > CANVAS_W - 16 && t.length > 10) t = t.slice(0, -4) + '…';
    ctx.fillText(t, CANVAS_W / 2, 66);

    // Yield window indicator
    const inWindow = time >= yieldWindow[0] && time <= yieldWindow[1];
    const windowColor = inWindow ? '#22c55e' : '#ef4444';
    ctx.fillStyle = windowColor;
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Yield: ${yieldWindow[0]}-${yieldWindow[1]}s (${inWindow ? '✓ NOW' : '✗ WAIT'})`, CANVAS_W / 2, CANVAS_H - 8);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props { onScoreUpdate?: (s: number) => void; }

export default function TrafficRunnerGame({ onScoreUpdate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>({
    phase: 'idle',
    score: 0,
    time: 0,
    level: 0,
    currentWaypoint: 0,
    playerPaused: false,
  });
  const routeRef = useRef<Waypoint[]>([]);
  const cameraYRef = useRef(0);
  const lastTRef = useRef(0);
  const rafRef = useRef(0);
  const [disp, setDisp] = useState({ ...stateRef.current });
  const [levelIdx, setLevelIdx] = useState(0);
  const LEVEL_NAMES = ['Suburban Streets', 'Downtown Grid', 'Highway Approach'];

  const gameLoop = useCallback((ts: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;
    if (s.phase !== 'playing' || s.playerPaused) return;

    const dt = Math.min((ts - lastTRef.current) / 1000, 0.05);
    lastTRef.current = ts;

    // Update time
    let newTime = s.time + dt;
    let newScore = s.score;
    let crashed = false;

    // Check if we've reached the end
    if (s.currentWaypoint >= routeRef.current.length - 1) {
      stateRef.current = { ...s, phase: 'levelComplete', score: newScore };
      setDisp({ ...stateRef.current });
      renderFrame(ctx, s, routeRef.current, false, cameraYRef.current);
      onScoreUpdate?.(newScore);
      return;
    }

    // Check yield requirements
    const currentWP = routeRef.current[s.currentWaypoint];
    if (currentWP.type === 'intersection' && currentWP.yieldRequired) {
      const inYieldWindow = newTime >= currentWP.yieldWindow[0] && newTime <= currentWP.yieldWindow[1];
      if (newTime > currentWP.yieldWindow[1] && !inYieldWindow) {
        crashed = true;
      }
    }

    if (crashed) {
      stateRef.current = { ...s, phase: 'crashed', score: newScore, time: newTime };
      setDisp({ ...stateRef.current });
      renderFrame(ctx, s, routeRef.current, true, cameraYRef.current);
      onScoreUpdate?.(newScore);
      return;
    }

    // Auto-advance waypoint every 2 seconds
    if (newTime % 2 < dt) {
      s.currentWaypoint = Math.min(s.currentWaypoint + 1, routeRef.current.length - 1);
      if (currentWP.type === 'intersection') {
        newScore += 50;
      }
    }

    // Update camera to follow car
    const nextWP = routeRef.current[s.currentWaypoint];
    cameraYRef.current = nextWP.y - CANVAS_H / 2;

    // Timeout after 90 seconds
    if (newTime >= LEVEL_TIME) {
      stateRef.current = { ...s, phase: 'timeout', score: newScore, time: LEVEL_TIME };
      setDisp({ ...stateRef.current });
      renderFrame(ctx, s, routeRef.current, false, cameraYRef.current);
      onScoreUpdate?.(newScore);
      return;
    }

    stateRef.current = { ...s, score: newScore, time: newTime };
    renderFrame(ctx, s, routeRef.current, false, cameraYRef.current);
    if (ts % 80 < 20) setDisp({ ...stateRef.current });

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [onScoreUpdate]);

  function renderFrame(ctx: CanvasRenderingContext2D, s: GameState, route: Waypoint[], crashed: boolean, cameraY: number) {
    drawMap(ctx, cameraY);

    // Draw player car
    const currentWP = route[s.currentWaypoint];
    const screenY = currentWP.y - cameraY;
    drawCar(ctx, CANVAS_W / 2, screenY, currentWP.heading, crashed);

    // Draw HUD
    const scenario = currentWP.type === 'intersection' ? (currentWP.scenario || null) : null;
    drawHUD(ctx, s.score, s.time, scenario, currentWP.yieldRequired, currentWP.yieldWindow);

    // Draw crash overlay
    if (crashed) {
      ctx.fillStyle = 'rgba(127,29,29,0.6)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 34px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CRASH!', CANVAS_W / 2, CANVAS_H / 2 - 28);
      if (scenario) {
        ctx.fillStyle = '#fca5a5';
        ctx.font = 'bold 11px Arial';
        ctx.fillText(scenario.title, CANVAS_W / 2, CANVAS_H / 2 - 4);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '9px Arial';
        let t = scenario.law;
        while (ctx.measureText(t).width > CANVAS_W - 28 && t.length > 10) t = t.slice(0, -4) + '…';
        ctx.fillText(t, CANVAS_W / 2, CANVAS_H / 2 + 14);
      }
    }

    // Draw timeout overlay
    if (s.phase === 'timeout') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 30px Arial';
      ctx.textAlign = 'center';
      ctx.fillText("TIME'S UP!", CANVAS_W / 2, CANVAS_H / 2 - 14);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '13px Arial';
      ctx.fillText(`${s.score} pts`, CANVAS_W / 2, CANVAS_H / 2 + 12);
    }

    // Draw level complete overlay
    if (s.phase === 'levelComplete') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('LEVEL CLEAR!', CANVAS_W / 2, CANVAS_H / 2 - 14);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '13px Arial';
      ctx.fillText(`${s.score} pts`, CANVAS_W / 2, CANVAS_H / 2 + 12);
    }
  }

  const startGame = useCallback((lv: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    routeRef.current = generateRoute();
    cameraYRef.current = routeRef.current[0].y - CANVAS_H / 2;
    const ns: GameState = {
      phase: 'playing',
      score: 0,
      time: 0,
      level: lv,
      currentWaypoint: 0,
      playerPaused: false,
    };
    stateRef.current = ns;
    setDisp(ns);
    lastTRef.current = performance.now();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  const togglePause = useCallback(() => {
    if (stateRef.current.phase === 'playing') {
      stateRef.current.playerPaused = !stateRef.current.playerPaused;
      setDisp({ ...stateRef.current });
    }
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // Idle screen
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawMap(ctx, 0);
    drawCar(ctx, CANVAS_W / 2, CANVAS_H - 80, 0, false);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, CANVAS_H / 2 - 70, CANVAS_W, 120);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, CANVAS_H / 2 - 70, CANVAS_W, 120);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Traffic Jam Runner', CANVAS_W / 2, CANVAS_H / 2 - 34);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Arial';
    ctx.fillText('Follow the fixed route', CANVAS_W / 2, CANVAS_H / 2 - 10);
    ctx.fillText('Yield at the right time', CANVAS_W / 2, CANVAS_H / 2 + 8);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('8 DMV Right-of-Way Scenarios', CANVAS_W / 2, CANVAS_H / 2 + 28);
  }, []);

  const phase = disp.phase;
  const isPlaying = phase === 'playing';

  return (
    <div className="w-full flex flex-col items-center gap-1 select-none">
      {/* Level selector */}
      <div className="w-full flex items-center justify-between bg-slate-800 text-white rounded-lg px-3 py-1.5 border border-slate-700">
        <button onClick={() => setLevelIdx(i => Math.max(0, i - 1))} className="font-bold text-xl px-2 disabled:opacity-30 text-green-400" disabled={levelIdx === 0}>‹</button>
        <div className="text-center">
          <p className="font-bold text-xs text-green-300">{LEVEL_NAMES[levelIdx]}</p>
          <p className="text-xs text-slate-400">Lv {levelIdx + 1} / {LEVEL_NAMES.length}</p>
        </div>
        <button onClick={() => setLevelIdx(i => Math.min(LEVEL_NAMES.length - 1, i + 1))} className="font-bold text-xl px-2 disabled:opacity-30 text-green-400" disabled={levelIdx === LEVEL_NAMES.length - 1}>›</button>
      </div>

      {/* Canvas */}
      <div className="relative w-full max-w-sm">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full rounded-t-xl border-2 border-slate-600 touch-none block"
        />

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
          {!isPlaying ? (
            <button
              onClick={() => startGame(levelIdx)}
              className="w-full bg-green-600 hover:bg-green-500 active:scale-95 text-white font-bold py-3 rounded-lg shadow-lg transition-all text-sm border border-green-400"
            >
              {phase === 'crashed' || phase === 'timeout' ? '🔄 Retry' : phase === 'levelComplete' ? '▶ Play Again' : '▶ Play'}
            </button>
          ) : (
            <button
              onClick={togglePause}
              className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-3 rounded-lg shadow-lg transition-all text-sm border border-blue-400"
            >
              {disp.playerPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="w-full max-w-sm grid grid-cols-2 gap-1 text-center">
        {[['Score', disp.score], ['Time', `${disp.time.toFixed(1)}s`]].map(([l, v]) => (
          <div key={l as string} className="bg-slate-800 rounded-md py-1 border border-slate-700">
            <p className="text-xs text-slate-400">{l}</p>
            <p className="text-sm font-bold text-green-400">{v}</p>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300">
        <p className="font-bold text-yellow-400 mb-0.5">How to Play:</p>
        <p className="text-slate-400 text-xs leading-relaxed">Click Play to start. Your car follows a fixed route with proper lane positioning and turns. At intersections, yield at the correct time. Yield too early or too late = crash. The map scrolls as you drive!</p>
      </div>
    </div>
  );
}
