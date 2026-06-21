/**
 * Traffic Jam Runner — Map-Based Fixed Route
 * - Pre-drawn map with fixed driving route
 * - Car automatically follows the route
 * - Play/Stop button to start/pause
 * - Game ends if player fails to yield at correct time
 * - 8 DMV scenarios, same route each time
 */
import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const W = 340;
const H = 560;
const LEVEL_TIME = 90;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Waypoint {
  x: number;
  y: number;
  type: 'road' | 'intersection';
  scenario?: Scenario;
  yieldRequired: boolean;
  yieldWindow: [number, number]; // [start_time, end_time] in seconds
}

interface Scenario {
  title: string;
  law: string;
  description: string;
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
  {
    title: 'Unprotected Left Turn',
    law: 'Yield to ALL oncoming straight traffic before turning left.',
    description: 'Turn left. Oncoming cars have ROW.',
  },
  {
    title: 'Right Turn — Pedestrian',
    law: 'Yield to pedestrians in the crosswalk before turning right.',
    description: 'Turn right. Pedestrians crossing have ROW.',
  },
  {
    title: '4-Way Stop',
    law: 'Simultaneous arrival — yield to the vehicle on your RIGHT.',
    description: 'All vehicles arrived at same time. Yield to right.',
  },
  {
    title: 'Emergency Vehicle',
    law: 'Always yield to emergency vehicles — pull over and stop.',
    description: 'Emergency vehicle approaching. Must yield.',
  },
  {
    title: 'T-Intersection',
    law: 'Through-road traffic has right-of-way over entering vehicles.',
    description: 'You are on main road. Side traffic must yield.',
  },
  {
    title: 'Roundabout Entry',
    law: 'Yield to all vehicles already circulating inside the roundabout.',
    description: 'Traffic inside roundabout has ROW.',
  },
  {
    title: 'Driveway Exit',
    law: 'Yield to ALL road traffic and pedestrians when exiting a driveway.',
    description: 'You are exiting. All road traffic has ROW.',
  },
  {
    title: 'Green Light Left Turn',
    law: 'Green light does NOT give left-turners priority. Yield to oncoming straight traffic.',
    description: 'Turning left on green. Oncoming straight traffic has ROW.',
  },
];

// ─── Fixed Route with Waypoints ────────────────────────────────────────────────
function generateRoute(): Waypoint[] {
  const route: Waypoint[] = [];
  
  // Starting position
  route.push({ x: W / 2, y: H - 40, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });
  
  // Drive forward
  route.push({ x: W / 2, y: H - 100, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });
  route.push({ x: W / 2, y: H - 160, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });
  
  // First intersection — Unprotected Left Turn (yield 10-15 seconds)
  route.push({ x: W / 2, y: H - 220, type: 'intersection', scenario: SCENARIOS[0], yieldRequired: true, yieldWindow: [10, 15] });
  
  // Turn left
  route.push({ x: W / 2 - 60, y: H - 220, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });
  route.push({ x: W / 2 - 120, y: H - 220, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });
  
  // Drive down
  route.push({ x: W / 2 - 120, y: H - 160, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });
  route.push({ x: W / 2 - 120, y: H - 100, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });
  
  // Second intersection — Right Turn Pedestrian (yield 25-30 seconds)
  route.push({ x: W / 2 - 120, y: 100, type: 'intersection', scenario: SCENARIOS[1], yieldRequired: true, yieldWindow: [25, 30] });
  
  // Turn right
  route.push({ x: W / 2 - 60, y: 100, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });
  route.push({ x: W / 2, y: 100, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });
  
  // Drive up
  route.push({ x: W / 2, y: 80, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });
  route.push({ x: W / 2, y: 60, type: 'road', yieldRequired: false, yieldWindow: [0, 0] });
  
  // Third intersection — 4-Way Stop (yield 40-45 seconds)
  route.push({ x: W / 2, y: 40, type: 'intersection', scenario: SCENARIOS[2], yieldRequired: true, yieldWindow: [40, 45] });
  
  return route;
}

// ─── Drawing ──────────────────────────────────────────────────────────────────
function drawMap(ctx: CanvasRenderingContext2D) {
  // Background
  ctx.fillStyle = '#14532d';
  ctx.fillRect(0, 0, W, H);

  // Grass texture
  ctx.fillStyle = 'rgba(21,128,61,0.4)';
  for (let gx = 0; gx < W; gx += 18) {
    for (let gy = 0; gy < H; gy += 18) {
      ctx.beginPath();
      ctx.arc(gx + 4, gy + 4, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Main road (vertical)
  ctx.fillStyle = '#1c2526';
  ctx.fillRect(W / 2 - 40, 0, 80, H);

  // Road center line
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.setLineDash([20, 20]);
  ctx.beginPath();
  ctx.moveTo(W / 2, 0);
  ctx.lineTo(W / 2, H);
  ctx.stroke();
  ctx.setLineDash([]);

  // Road edge lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 40, 0);
  ctx.lineTo(W / 2 - 40, H);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W / 2 + 40, 0);
  ctx.lineTo(W / 2 + 40, H);
  ctx.stroke();

  // Horizontal road for intersections
  ctx.fillStyle = '#1c2526';
  ctx.fillRect(0, H - 220, W, 80); // First intersection
  ctx.fillRect(0, 60, W, 80); // Second intersection
  ctx.fillRect(0, 0, W, 80); // Third intersection

  // Horizontal road lines
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.setLineDash([20, 20]);
  ctx.beginPath();
  ctx.moveTo(0, H - 220);
  ctx.lineTo(W, H - 220);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 100);
  ctx.lineTo(W, 100);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.lineTo(W, 40);
  ctx.stroke();
  ctx.setLineDash([]);

  // Intersection highlights
  ctx.strokeStyle = 'rgba(251,191,36,0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(W / 2 - 40, H - 220, 80, 80);
  ctx.strokeRect(W / 2 - 40, 60, 80, 80);
  ctx.strokeRect(W / 2 - 40, 0, 80, 80);
}

function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, crashed: boolean) {
  const w = 24;
  const h = 40;
  const hw = w / 2;
  const hh = h / 2;

  ctx.save();
  ctx.translate(x, y);

  const body = crashed ? '#7f1d1d' : '#14532d';
  const roof = crashed ? '#450a0a' : '#052e16';
  const win = crashed ? '#fca5a5' : '#86efac';

  ctx.shadowColor = crashed ? '#ef4444' : '#22c55e';
  ctx.shadowBlur = crashed ? 16 : 10;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(2, hh + 3, hw * 0.7, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-hw + 4, -hh);
  ctx.lineTo(hw - 4, -hh);
  ctx.quadraticCurveTo(hw, -hh, hw, -hh + 4);
  ctx.lineTo(hw, hh - 4);
  ctx.quadraticCurveTo(hw, hh, hw - 4, hh);
  ctx.lineTo(-hw + 4, hh);
  ctx.quadraticCurveTo(-hw, hh, -hw, hh - 4);
  ctx.lineTo(-hw, -hh + 4);
  ctx.quadraticCurveTo(-hw, -hh, -hw + 4, -hh);
  ctx.fill();

  // Roof
  ctx.fillStyle = roof;
  ctx.fillRect(-hw + 3, -hh + h * 0.2, w - 6, h * 0.35);

  // Windshield
  ctx.fillStyle = win;
  ctx.globalAlpha = 0.7;
  ctx.fillRect(-hw + 2, -hh + 2, w - 4, 8);
  ctx.globalAlpha = 1;

  // Headlights
  ctx.fillStyle = '#fef9c3';
  ctx.shadowColor = '#fef9c3';
  ctx.shadowBlur = 6;
  ctx.fillRect(-hw + 1, -hh + 1, 4, 3);
  ctx.fillRect(hw - 5, -hh + 1, 4, 3);
  ctx.shadowBlur = 0;

  // Taillights
  ctx.fillStyle = '#ef4444';
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 5;
  ctx.fillRect(-hw + 1, hh - 4, 4, 3);
  ctx.fillRect(hw - 5, hh - 4, 4, 3);
  ctx.shadowBlur = 0;

  ctx.restore();
}

function drawHUD(ctx: CanvasRenderingContext2D, score: number, time: number, scenario: Scenario | null, yieldRequired: boolean, yieldWindow: [number, number]) {
  // Top HUD bar
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, W, 40);

  // Time display
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`⏱ ${time.toFixed(1)}s`, 8, 24);

  // Score
  ctx.fillStyle = '#fbbf24';
  ctx.textAlign = 'right';
  ctx.fillText(`${score} pts`, W - 8, 24);

  // Scenario info
  if (scenario && yieldRequired) {
    ctx.fillStyle = 'rgba(15,23,42,0.85)';
    ctx.fillRect(0, 40, W, 32);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`⚠ ${scenario.title}`, W / 2, 52);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px Arial';
    let t = scenario.law;
    while (ctx.measureText(t).width > W - 16 && t.length > 10) t = t.slice(0, -4) + '…';
    ctx.fillText(t, W / 2, 66);

    // Yield window indicator
    const inWindow = time >= yieldWindow[0] && time <= yieldWindow[1];
    const windowColor = inWindow ? '#22c55e' : '#ef4444';
    ctx.fillStyle = windowColor;
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Yield: ${yieldWindow[0]}-${yieldWindow[1]}s (${inWindow ? '✓ NOW' : '✗ WAIT'})`, W / 2, H - 8);
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
      renderFrame(ctx, s, routeRef.current, false);
      onScoreUpdate?.(newScore);
      return;
    }

    // Check yield requirements at intersections
    const currentWP = routeRef.current[s.currentWaypoint];
    if (currentWP.type === 'intersection' && currentWP.yieldRequired) {
      const inYieldWindow = newTime >= currentWP.yieldWindow[0] && newTime <= currentWP.yieldWindow[1];
      
      // If we're past the yield window without yielding, crash
      if (newTime > currentWP.yieldWindow[1] && !inYieldWindow) {
        crashed = true;
      }
    }

    if (crashed) {
      stateRef.current = { ...s, phase: 'crashed', score: newScore, time: newTime };
      setDisp({ ...stateRef.current });
      renderFrame(ctx, s, routeRef.current, true);
      onScoreUpdate?.(newScore);
      return;
    }

    // Auto-advance waypoint every 2 seconds
    if (newTime % 2 < dt) {
      s.currentWaypoint = Math.min(s.currentWaypoint + 1, routeRef.current.length - 1);
      if (currentWP.type === 'intersection') {
        newScore += 50; // Bonus for clearing intersection
      }
    }

    // Timeout after 90 seconds
    if (newTime >= LEVEL_TIME) {
      stateRef.current = { ...s, phase: 'timeout', score: newScore, time: LEVEL_TIME };
      setDisp({ ...stateRef.current });
      renderFrame(ctx, s, routeRef.current, false);
      onScoreUpdate?.(newScore);
      return;
    }

    stateRef.current = { ...s, score: newScore, time: newTime };
    renderFrame(ctx, s, routeRef.current, false);
    if (ts % 80 < 20) setDisp({ ...stateRef.current });

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [onScoreUpdate]);

  function renderFrame(ctx: CanvasRenderingContext2D, s: GameState, route: Waypoint[], crashed: boolean) {
    drawMap(ctx);

    // Draw player car
    const currentWP = route[s.currentWaypoint];
    drawCar(ctx, currentWP.x, currentWP.y, crashed);

    // Draw HUD
    const scenario = currentWP.type === 'intersection' ? (currentWP.scenario || null) : null;
    drawHUD(ctx, s.score, s.time, scenario, currentWP.yieldRequired, currentWP.yieldWindow);

    // Draw crash overlay
    if (crashed) {
      ctx.fillStyle = 'rgba(127,29,29,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 34px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CRASH!', W / 2, H / 2 - 28);
      if (scenario) {
        ctx.fillStyle = '#fca5a5';
        ctx.font = 'bold 11px Arial';
        ctx.fillText(scenario.title, W / 2, H / 2 - 4);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '9px Arial';
        let t = scenario.law;
        while (ctx.measureText(t).width > W - 28 && t.length > 10) t = t.slice(0, -4) + '…';
        ctx.fillText(t, W / 2, H / 2 + 14);
      }
    }

    // Draw timeout overlay
    if (s.phase === 'timeout') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 30px Arial';
      ctx.textAlign = 'center';
      ctx.fillText("TIME'S UP!", W / 2, H / 2 - 14);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '13px Arial';
      ctx.fillText(`${s.score} pts`, W / 2, H / 2 + 12);
    }

    // Draw level complete overlay
    if (s.phase === 'levelComplete') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('LEVEL CLEAR!', W / 2, H / 2 - 14);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '13px Arial';
      ctx.fillText(`${s.score} pts`, W / 2, H / 2 + 12);
    }
  }

  const startGame = useCallback((lv: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    routeRef.current = generateRoute();
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
    drawMap(ctx);
    drawCar(ctx, W / 2, H - 40, false);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, H / 2 - 70, W, 120);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, H / 2 - 70, W, 120);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Traffic Jam Runner', W / 2, H / 2 - 34);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Arial';
    ctx.fillText('Follow the fixed route', W / 2, H / 2 - 10);
    ctx.fillText('Yield at the right time', W / 2, H / 2 + 8);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('8 DMV Right-of-Way Scenarios', W / 2, H / 2 + 28);
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
          width={W}
          height={H}
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
        <p className="text-slate-400 text-xs leading-relaxed">Click Play to start. Your car follows a fixed route. At intersections, you must yield at the correct time. Yield too early or too late = crash. Clear all intersections to win!</p>
      </div>
    </div>
  );
}
