/**
 * Traffic Jam Runner — Snake.io Style Game
 * - Car moves constantly forward
 * - Random turns every 3-5 seconds (50/50 left or right, otherwise forward)
 * - Collect coins/iron scattered on map
 * - Stop button to yield at intersections (right-of-way mechanic)
 * - No reverse, only forward/left/right
 */
import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const CANVAS_W = 340;
const CANVAS_H = 560;
const MAP_W = 800;
const MAP_H = 800;
const LEVEL_TIME = 90;
const CAR_SIZE = 16;
const CAR_SPEED = 120; // pixels per second
const TURN_INTERVAL_MIN = 3000; // 3 seconds
const TURN_INTERVAL_MAX = 5000; // 5 seconds
const COIN_SIZE = 8;
const COIN_COUNT = 15;

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

  // ─── Spawn coins ────────────────────────────────────────────────────────────
  const spawnCoins = useCallback(() => {
    const coins: Coin[] = [];
    for (let i = 0; i < COIN_COUNT; i++) {
      coins.push({
        x: Math.random() * (MAP_W - 100) + 50,
        y: Math.random() * (MAP_H - 100) + 50,
        collected: false,
      });
    }
    coinsRef.current = coins;
  }, []);

  // ─── Draw functions ────────────────────────────────────────────────────────
  const drawMap = useCallback((ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) => {
    // Background grass
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid pattern
    ctx.strokeStyle = 'rgba(107, 114, 128, 0.2)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = -offsetX % gridSize; x < CANVAS_W; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
      ctx.stroke();
    }
    for (let y = -offsetY % gridSize; y < CANVAS_H; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }
  }, []);

  const drawCar = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, heading: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((heading * Math.PI) / 2);

    // Car body
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-CAR_SIZE / 2, -CAR_SIZE / 2, CAR_SIZE, CAR_SIZE);

    // Car front indicator
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
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${s.time.toFixed(1)}s`, 8, 12);

    // Score
    ctx.textAlign = 'right';
    ctx.fillText(`${s.score} pts`, CANVAS_W - 8, 12);

    // Scenario title
    if (s.phase === 'playing') {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(SCENARIOS[currentScenarioRef.current].title, CANVAS_W / 2, 24);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Arial';
      ctx.fillText(SCENARIOS[currentScenarioRef.current].law, CANVAS_W / 2, 36);
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
        // else go forward (no change)
      }
      nextTurnTimeRef.current = now + (Math.random() * (TURN_INTERVAL_MAX - TURN_INTERVAL_MIN) + TURN_INTERVAL_MIN);
    }

    // Move car
    const moveDistance = CAR_SPEED * deltaTime;
    const dx = [0, moveDistance, 0, -moveDistance][headingRef.current];
    const dy = [-moveDistance, 0, moveDistance, 0][headingRef.current];

    carXRef.current += dx;
    carYRef.current += dy;

    // Wrap around map
    if (carXRef.current < 0) carXRef.current = MAP_W;
    if (carXRef.current > MAP_W) carXRef.current = 0;
    if (carYRef.current < 0) carYRef.current = MAP_H;
    if (carYRef.current > MAP_H) carYRef.current = 0;

    // Check coin collection
    let newScore = s.score;
    let coinsCollected = s.coinsCollected;
    coinsRef.current.forEach((coin) => {
      if (!coin.collected) {
        const dist = Math.hypot(carXRef.current - coin.x, carYRef.current - coin.y);
        if (dist < CAR_SIZE) {
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

  // ─── Draw frame ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const s = stateRef.current;

    if (s.phase === 'idle') {
      drawMap(ctx, 0, 0);
      drawCar(ctx, CANVAS_W / 2, CANVAS_H / 2, 0);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, CANVAS_H / 2 - 70, CANVAS_W, 120);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, CANVAS_H / 2 - 70, CANVAS_W, 120);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Snake Traffic', CANVAS_W / 2, CANVAS_H / 2 - 34);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Arial';
      ctx.fillText('Collect coins while driving', CANVAS_W / 2, CANVAS_H / 2 - 10);
      ctx.fillText('Press STOP to yield', CANVAS_W / 2, CANVAS_H / 2 + 8);
      ctx.fillStyle = '#fbbf24';
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
    carXRef.current = MAP_W / 2;
    carYRef.current = MAP_H / 2;
    headingRef.current = 0;
    cameraXRef.current = MAP_W / 2 - CANVAS_W / 2;
    cameraYRef.current = MAP_H / 2 - CANVAS_H / 2;
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
      // Player yielded - award bonus points
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
          className="w-full rounded-t-xl border-2 border-slate-600 touch-none block"
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
        <p className="text-slate-400 text-xs leading-relaxed">Your car drives automatically and turns randomly every 3-5 seconds. Collect coins for points. Press STOP to yield at intersections and complete the level!</p>
      </div>
    </div>
  );
}
