/**
 * Traffic Jam Runner — Real Street Map with Road Constraints
 * - Car moves on actual street map (DMV Test Site area)
 * - Car constrained to roads (gray lines)
 * - Wrap-around at edges to closest parallel road
 * - Coins spawn only on roads
 * - 8 DMV scenarios rotate
 */
import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const CANVAS_W = 340;
const CANVAS_H = 560;
const MAP_W = 800;
const MAP_H = 1000;
const LEVEL_TIME = 90;
const CAR_SIZE = 14;
const CAR_SPEED = 100; // pixels per second
const TURN_INTERVAL_MIN = 3000; // 3 seconds
const TURN_INTERVAL_MAX = 5000; // 5 seconds
const COIN_SIZE = 6;
const COIN_COUNT = 12;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Coin {
  x: number;
  y: number;
  collected: boolean;
}

interface GameState {
  phase: 'idle' | 'playing' | 'paused' | 'crashed' | 'levelComplete' | 'timeout';
  score: number;
  time: number;
  level: number;
  coinsCollected: number;
  playerPaused: boolean;
}

// ─── DMV Scenarios ────────────────────────────────────────────────────────────
const SCENARIOS = [
  { title: 'Unprotected Left Turn', law: 'Yield to ALL oncoming traffic before turning left.' },
  { title: 'Right Turn — Pedestrian', law: 'Yield to pedestrians in crosswalk before turning right.' },
  { title: '4-Way Stop', law: 'Simultaneous arrival — yield to vehicle on your RIGHT.' },
  { title: 'Emergency Vehicle', law: 'Always yield to emergency vehicles — pull over and stop.' },
  { title: 'T-Intersection', law: 'Vehicle on through road has right-of-way over side road.' },
  { title: 'Roundabout Entry', law: 'Yield to traffic already in the roundabout.' },
  { title: 'Driveway Exit', law: 'Yield to pedestrians and traffic on the main road.' },
  { title: 'Green Light Left Turn', law: 'Yield to oncoming traffic even with green arrow.' },
];

const LEVEL_NAMES = ['Suburban Streets', 'Downtown Rush', 'Highway Merge'];

// ─── Road network definition (approximate grid of roads) ────────────────────
// Vertical roads (N-S)
const VERTICAL_ROADS = [
  { x: 80, lanes: [60, 80, 100] },
  { x: 180, lanes: [160, 180, 200] },
  { x: 280, lanes: [260, 280, 300] },
  { x: 380, lanes: [360, 380, 400] },
  { x: 480, lanes: [460, 480, 500] },
  { x: 580, lanes: [560, 580, 600] },
  { x: 680, lanes: [660, 680, 700] },
];

// Horizontal roads (E-W)
const HORIZONTAL_ROADS = [
  { y: 100, lanes: [80, 100, 120] },
  { y: 200, lanes: [180, 200, 220] },
  { y: 300, lanes: [280, 300, 320] },
  { y: 400, lanes: [380, 400, 420] },
  { y: 500, lanes: [480, 500, 520] },
  { y: 600, lanes: [580, 600, 620] },
  { y: 700, lanes: [680, 700, 720] },
  { y: 800, lanes: [780, 800, 820] },
  { y: 900, lanes: [880, 900, 920] },
];

// ─── Helper: Find closest road to position ────────────────────────────────────
function findClosestRoad(x: number, y: number): { x: number; y: number; heading: number } {
  let closest = { dist: Infinity, x, y, heading: 0 };

  // Check vertical roads
  VERTICAL_ROADS.forEach((road) => {
    const dist = Math.abs(x - road.x);
    if (dist < closest.dist && y >= 0 && y < MAP_H) {
      closest = { dist, x: road.x, y, heading: 0 };
    }
  });

  // Check horizontal roads
  HORIZONTAL_ROADS.forEach((road) => {
    const dist = Math.abs(y - road.y);
    if (dist < closest.dist && x >= 0 && x < MAP_W) {
      closest = { dist, x, y: road.y, heading: 1 };
    }
  });

  return { x: closest.x, y: closest.y, heading: closest.heading };
}

// ─── Helper: Check if position is on a road ────────────────────────────────────
function isOnRoad(x: number, y: number, tolerance: number = 25): boolean {
  // Check vertical roads
  for (const road of VERTICAL_ROADS) {
    if (Math.abs(x - road.x) < tolerance && y >= 0 && y < MAP_H) return true;
  }
  // Check horizontal roads
  for (const road of HORIZONTAL_ROADS) {
    if (Math.abs(y - road.y) < tolerance && x >= 0 && x < MAP_W) return true;
  }
  return false;
}

// ─── Helper: Wrap position to opposite side ────────────────────────────────────
function wrapPosition(x: number, y: number): { x: number; y: number } {
  let newX = x;
  let newY = y;

  if (x < 0) newX = MAP_W - 10;
  if (x > MAP_W) newX = 10;
  if (y < 0) newY = MAP_H - 10;
  if (y > MAP_H) newY = 10;

  // Snap to closest road
  const snapped = findClosestRoad(newX, newY);
  return { x: snapped.x, y: snapped.y };
}

// ─── Game Component ────────────────────────────────────────────────────────────
export function TrafficRunnerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>({
    phase: 'idle',
    score: 0,
    time: 0,
    level: 0,
    coinsCollected: 0,
    playerPaused: false,
  });
  const [disp, setDisp] = useState<GameState>(stateRef.current);
  const [levelIdx, setLevelIdx] = useState(0);

  // Game state refs
  const carXRef = useRef(MAP_W / 2);
  const carYRef = useRef(MAP_H / 2);
  const headingRef = useRef(0); // 0=up, 1=right, 2=down, 3=left
  const cameraXRef = useRef(0);
  const cameraYRef = useRef(0);
  const coinsRef = useRef<Coin[]>([]);
  const lastTRef = useRef(0);
  const rafRef = useRef<number | undefined>(undefined);
  const nextTurnTimeRef = useRef(0);
  const currentScenarioRef = useRef(0);

  // ─── Spawn coins on roads ────────────────────────────────────────────────────────
  const spawnCoins = useCallback(() => {
    const coins: Coin[] = [];
    let attempts = 0;
    while (coins.length < COIN_COUNT && attempts < 100) {
      const x = Math.random() * MAP_W;
      const y = Math.random() * MAP_H;
      if (isOnRoad(x, y, 30)) {
        coins.push({ x, y, collected: false });
      }
      attempts++;
    }
    coinsRef.current = coins;
  }, []);

  // ─── Draw functions ────────────────────────────────────────────────────────
  const drawMap = useCallback((ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) => {
    // Background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw roads (gray lines)
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 2;

    // Vertical roads
    VERTICAL_ROADS.forEach((road) => {
      const screenX = road.x - offsetX;
      if (screenX > -50 && screenX < CANVAS_W + 50) {
        ctx.beginPath();
        ctx.moveTo(screenX, -offsetY);
        ctx.lineTo(screenX, CANVAS_H - offsetY);
        ctx.stroke();
      }
    });

    // Horizontal roads
    HORIZONTAL_ROADS.forEach((road) => {
      const screenY = road.y - offsetY;
      if (screenY > -50 && screenY < CANVAS_H + 50) {
        ctx.beginPath();
        ctx.moveTo(-offsetX, screenY);
        ctx.lineTo(CANVAS_W - offsetX, screenY);
        ctx.stroke();
      }
    });

    // Road markings (dashed center lines)
    ctx.strokeStyle = '#ffff99';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    VERTICAL_ROADS.forEach((road) => {
      const screenX = road.x - offsetX;
      if (screenX > -50 && screenX < CANVAS_W + 50) {
        ctx.beginPath();
        ctx.moveTo(screenX, -offsetY);
        ctx.lineTo(screenX, CANVAS_H - offsetY);
        ctx.stroke();
      }
    });

    HORIZONTAL_ROADS.forEach((road) => {
      const screenY = road.y - offsetY;
      if (screenY > -50 && screenY < CANVAS_H + 50) {
        ctx.beginPath();
        ctx.moveTo(-offsetX, screenY);
        ctx.lineTo(CANVAS_W - offsetX, screenY);
        ctx.stroke();
      }
    });

    ctx.setLineDash([]);
  }, []);

  const drawCar = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, heading: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((heading * Math.PI) / 2);

    // Car body
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-CAR_SIZE / 2, -CAR_SIZE / 2, CAR_SIZE, CAR_SIZE);

    // Car front
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-CAR_SIZE / 2 + 2, -CAR_SIZE / 2, CAR_SIZE - 4, 4);

    ctx.restore();
  }, []);

  const drawCoins = useCallback((ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) => {
    coinsRef.current.forEach((coin) => {
      if (!coin.collected) {
        const screenX = coin.x - offsetX;
        const screenY = coin.y - offsetY;
        if (screenX > -20 && screenX < CANVAS_W + 20 && screenY > -20 && screenY < CANVAS_H + 20) {
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(screenX, screenY, COIN_SIZE, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    });
  }, []);

  const drawHUD = useCallback((ctx: CanvasRenderingContext2D, s: GameState) => {
    // Time
    ctx.fillStyle = '#333';
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${s.time.toFixed(1)}s`, 8, 12);

    // Score
    ctx.textAlign = 'right';
    ctx.fillText(`${s.score} pts`, CANVAS_W - 8, 12);

    // Scenario title
    if (s.phase === 'playing') {
      ctx.fillStyle = '#d97706';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(SCENARIOS[currentScenarioRef.current].title, CANVAS_W / 2, 24);
      ctx.fillStyle = '#666';
      ctx.font = '9px Arial';
      ctx.fillText(SCENARIOS[currentScenarioRef.current].law, CANVAS_W / 2, 34);
    }
  }, []);

  // ─── Game loop ────────────────────────────────────────────────────────────
  const gameLoop = useCallback(() => {
    const now = performance.now();
    const deltaTime = lastTRef.current ? (now - lastTRef.current) / 1000 : 0;
    lastTRef.current = now;

    const s = stateRef.current;
    if (s.phase !== 'playing' || s.playerPaused) {
      rafRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // Update time
    let newTime = s.time + deltaTime;
    if (newTime > LEVEL_TIME) {
      stateRef.current = { ...s, phase: 'timeout', time: LEVEL_TIME };
      setDisp(stateRef.current);
      return;
    }

    // Random turn logic
    if (now >= nextTurnTimeRef.current) {
      const rand = Math.random();
      if (rand < 0.5) {
        // Turn left
        headingRef.current = (headingRef.current - 1 + 4) % 4;
      } else if (rand < 1.0) {
        // Turn right (or go forward)
        if (rand < 0.75) {
          headingRef.current = (headingRef.current + 1) % 4;
        }
      }
      nextTurnTimeRef.current = now + (Math.random() * (TURN_INTERVAL_MAX - TURN_INTERVAL_MIN) + TURN_INTERVAL_MIN);
    }

    // Move car
    const moveDistance = CAR_SPEED * deltaTime;
    const dx = [0, moveDistance, 0, -moveDistance][headingRef.current];
    const dy = [-moveDistance, 0, moveDistance, 0][headingRef.current];

    let newX = carXRef.current + dx;
    let newY = carYRef.current + dy;

    // Wrap around at edges
    if (newX < 0 || newX > MAP_W || newY < 0 || newY > MAP_H) {
      const wrapped = wrapPosition(newX, newY);
      newX = wrapped.x;
      newY = wrapped.y;
    }

    carXRef.current = newX;
    carYRef.current = newY;

    // Check coin collection
    let newScore = s.score;
    let coinsCollected = s.coinsCollected;
    coinsRef.current.forEach((coin) => {
      if (!coin.collected) {
        const dist = Math.hypot(carXRef.current - coin.x, carYRef.current - coin.y);
        if (dist < CAR_SIZE + COIN_SIZE) {
          coin.collected = true;
          newScore += 10;
          coinsCollected += 1;
        }
      }
    });

    // Update camera to follow car
    cameraXRef.current = carXRef.current - CANVAS_W / 2;
    cameraYRef.current = carYRef.current - CANVAS_H / 2;

    // Clamp camera
    cameraXRef.current = Math.max(0, Math.min(MAP_W - CANVAS_W, cameraXRef.current));
    cameraYRef.current = Math.max(0, Math.min(MAP_H - CANVAS_H, cameraYRef.current));

    // Random scenario every 15 seconds
    if (Math.floor(newTime) % 15 === 0 && Math.floor(newTime) !== Math.floor(s.time)) {
      currentScenarioRef.current = Math.floor(Math.random() * SCENARIOS.length);
    }

    stateRef.current = { ...s, time: newTime, score: newScore, coinsCollected };
    setDisp(stateRef.current);

    rafRef.current = requestAnimationFrame(gameLoop);
  }, []);

  // ─── Draw frame ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const s = stateRef.current;

    if (s.phase === 'idle') {
      drawMap(ctx, 0, 0);
      drawCar(ctx, CANVAS_W / 2, CANVAS_H / 2, 0);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(0, CANVAS_H / 2 - 70, CANVAS_W, 120);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, CANVAS_H / 2 - 70, CANVAS_W, 120);
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Street Navigation', CANVAS_W / 2, CANVAS_H / 2 - 34);
      ctx.fillStyle = '#666';
      ctx.font = '11px Arial';
      ctx.fillText('Follow the roads and collect coins', CANVAS_W / 2, CANVAS_H / 2 - 10);
      ctx.fillText('Press STOP to yield and complete', CANVAS_W / 2, CANVAS_H / 2 + 8);
      ctx.fillStyle = '#d97706';
      ctx.font = 'bold 10px Arial';
      ctx.fillText('8 DMV Right-of-Way Scenarios', CANVAS_W / 2, CANVAS_H / 2 + 28);
      return;
    }

    drawMap(ctx, cameraXRef.current, cameraYRef.current);
    drawCoins(ctx, cameraXRef.current, cameraYRef.current);

    const screenCarX = carXRef.current - cameraXRef.current;
    const screenCarY = carYRef.current - cameraYRef.current;
    drawCar(ctx, screenCarX, screenCarY, headingRef.current);

    drawHUD(ctx, s);

    // Draw crashed overlay
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

    // Draw timeout overlay
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
  }, [disp, drawMap, drawCar, drawCoins, drawHUD]);

  const startGame = useCallback((lv: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    spawnCoins();

    // Start on a road
    const startRoad = findClosestRoad(MAP_W / 2, MAP_H / 2);
    carXRef.current = startRoad.x;
    carYRef.current = startRoad.y;
    headingRef.current = 0;
    cameraXRef.current = Math.max(0, Math.min(MAP_W - CANVAS_W, carXRef.current - CANVAS_W / 2));
    cameraYRef.current = Math.max(0, Math.min(MAP_H - CANVAS_H, carYRef.current - CANVAS_H / 2));
    nextTurnTimeRef.current = performance.now() + TURN_INTERVAL_MIN;
    currentScenarioRef.current = Math.floor(Math.random() * SCENARIOS.length);

    const ns: GameState = {
      phase: 'playing',
      score: 0,
      time: 0,
      level: lv,
      coinsCollected: 0,
      playerPaused: false,
    };
    stateRef.current = ns;
    setDisp(ns);
    lastTRef.current = performance.now();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop, spawnCoins]);

  const togglePause = useCallback(() => {
    if (stateRef.current.phase === 'playing') {
      stateRef.current.playerPaused = !stateRef.current.playerPaused;
      setDisp({ ...stateRef.current });
    }
  }, []);

  const stopForYield = useCallback(() => {
    if (stateRef.current.phase === 'playing') {
      stateRef.current.score += 50;
      stateRef.current.phase = 'levelComplete';
      setDisp({ ...stateRef.current });
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

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
          className="w-full rounded-t-xl border-2 border-slate-600 touch-none block bg-white"
        />

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 flex gap-1">
          {!isPlaying ? (
            <button
              onClick={() => startGame(levelIdx)}
              className="flex-1 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-bold py-3 rounded-lg shadow-lg transition-all text-sm border border-green-400"
            >
              {phase === 'crashed' || phase === 'timeout' ? '🔄 Retry' : phase === 'levelComplete' ? '▶ Play Again' : '▶ Play'}
            </button>
          ) : (
            <>
              <button
                onClick={togglePause}
                className="flex-1 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-3 rounded-lg shadow-lg transition-all text-sm border border-blue-400"
              >
                {disp.playerPaused ? '▶ Resume' : '⏸ Pause'}
              </button>
              <button
                onClick={stopForYield}
                className="flex-1 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold py-3 rounded-lg shadow-lg transition-all text-sm border border-red-400"
              >
                🛑 STOP (Yield)
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="w-full max-w-sm grid grid-cols-3 gap-1 text-center">
        {[['Score', disp.score], ['Time', `${disp.time.toFixed(1)}s`], ['Coins', disp.coinsCollected]].map(([l, v]) => (
          <div key={l as string} className="bg-slate-800 rounded-md py-1 border border-slate-700">
            <p className="text-xs text-slate-400">{l}</p>
            <p className="text-sm font-bold text-green-400">{v}</p>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300">
        <p className="font-bold text-yellow-400 mb-0.5">How to Play:</p>
        <p className="text-slate-400 text-xs leading-relaxed">Your car drives on the street grid and turns randomly. Stay on the roads! Collect coins for points. Press STOP to yield and complete the level.</p>
      </div>
    </div>
  );
}
