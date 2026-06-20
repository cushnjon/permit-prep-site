import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TrafficCar {
  id: number;
  x: number;       // world-x (lane center)
  y: number;       // world-y (scrolls toward bottom)
  w: number;
  h: number;
  speed: number;   // px/s downward (positive = toward player)
  color: string;
  bodyColor: string;
  label: string;
  hasRightOfWay: boolean; // if true, player must STOP for this car
  lane: 'left' | 'right'; // which side of the road
}

interface GameState {
  phase: 'idle' | 'playing' | 'crashed' | 'levelComplete';
  score: number;
  distance: number;  // metres driven
  streak: number;
  level: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const W = 360;
const H = 560;
const ROAD_LEFT = 60;
const ROAD_RIGHT = W - 60;
const ROAD_W = ROAD_RIGHT - ROAD_LEFT;
const LANE_LEFT_X = ROAD_LEFT + ROAD_W * 0.25;
const LANE_RIGHT_X = ROAD_LEFT + ROAD_W * 0.75;
const PLAYER_X = W / 2;
const PLAYER_Y = H - 100;
const PLAYER_W = 36;
const PLAYER_H = 56;
const PLAYER_SPEED = 180;  // px/s when moving
const STRIPE_H = 40;
const STRIPE_GAP = 40;
const CAR_SPAWN_Y = -80;

const LEVELS = [
  { name: 'Suburban Streets',   spawnInterval: 2200, trafficSpeed: 140, rightOfWayChance: 0.45 },
  { name: 'Downtown Grid',      spawnInterval: 1600, trafficSpeed: 190, rightOfWayChance: 0.55 },
  { name: 'Highway Approach',   spawnInterval: 1100, trafficSpeed: 260, rightOfWayChance: 0.60 },
];

const CAR_TYPES = [
  { label: 'Sedan',  w: 34, h: 52, color: '#e74c3c', bodyColor: '#c0392b' },
  { label: 'SUV',    w: 38, h: 58, color: '#3498db', bodyColor: '#2980b9' },
  { label: 'Truck',  w: 42, h: 70, color: '#f39c12', bodyColor: '#e67e22' },
  { label: 'Van',    w: 40, h: 64, color: '#9b59b6', bodyColor: '#8e44ad' },
  { label: 'Pickup', w: 38, h: 62, color: '#1abc9c', bodyColor: '#16a085' },
];

let nextId = 0;

function spawnCar(level: number, trafficSpeed: number, rightOfWayChance: number): TrafficCar {
  const type = CAR_TYPES[Math.floor(Math.random() * CAR_TYPES.length)];
  const lane = Math.random() < 0.5 ? 'left' : 'right';
  const x = lane === 'left' ? LANE_LEFT_X : LANE_RIGHT_X;
  const hasROW = Math.random() < rightOfWayChance;
  const speedVariance = 0.8 + Math.random() * 0.4;
  return {
    id: nextId++,
    x,
    y: CAR_SPAWN_Y,
    w: type.w,
    h: type.h,
    speed: trafficSpeed * speedVariance,
    color: type.color,
    bodyColor: type.bodyColor,
    label: type.label,
    hasRightOfWay: hasROW,
    lane,
  };
}

// ─── Drawing helpers ──────────────────────────────────────────────────────────
function drawRoad(ctx: CanvasRenderingContext2D, stripeOffset: number) {
  // Sky / grass
  ctx.fillStyle = '#d4edda';
  ctx.fillRect(0, 0, W, H);

  // Grass sides
  ctx.fillStyle = '#7dba7d';
  ctx.fillRect(0, 0, ROAD_LEFT, H);
  ctx.fillRect(ROAD_RIGHT, 0, W - ROAD_RIGHT, H);

  // Road surface
  ctx.fillStyle = '#4a4a5a';
  ctx.fillRect(ROAD_LEFT, 0, ROAD_W, H);

  // Road edge lines
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(ROAD_LEFT, 0); ctx.lineTo(ROAD_LEFT, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ROAD_RIGHT, 0); ctx.lineTo(ROAD_RIGHT, H); ctx.stroke();

  // Center dashes (scrolling)
  ctx.strokeStyle = '#FFD93D';
  ctx.lineWidth = 2;
  ctx.setLineDash([STRIPE_H, STRIPE_GAP]);
  ctx.lineDashOffset = -stripeOffset;
  ctx.beginPath();
  ctx.moveTo(W / 2, 0);
  ctx.lineTo(W / 2, H);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawVehicle(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  bodyColor: string, roofColor: string,
  label: string, hasROW: boolean, facingDown: boolean
) {
  const hw = w / 2;
  const hh = h / 2;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(x, y + hh + 4, hw * 0.9, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.roundRect(x - hw, y - hh, w, h, 6);
  ctx.fill();

  // Roof
  const roofPad = 6;
  const roofH = h * 0.38;
  const roofY = facingDown ? y - hh + h * 0.22 : y - hh + h * 0.22;
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.roundRect(x - hw + roofPad, roofY, w - roofPad * 2, roofH, 4);
  ctx.fill();

  // Windshield
  ctx.fillStyle = 'rgba(135,206,235,0.75)';
  const wsY = facingDown ? y - hh + 6 : y + hh - roofH - 10;
  ctx.beginPath();
  ctx.roundRect(x - hw + 5, wsY, w - 10, 12, 2);
  ctx.fill();

  // Headlights / taillights
  const lightY = facingDown ? y - hh + 3 : y + hh - 8;
  ctx.fillStyle = facingDown ? '#fffacd' : '#ff4444';
  ctx.beginPath(); ctx.roundRect(x - hw + 3, lightY, 8, 6, 2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(x + hw - 11, lightY, 8, 6, 2); ctx.fill();

  // ROW badge
  if (hasROW) {
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(x + hw - 2, y - hh - 2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 7px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ROW', x + hw - 2, y - hh + 1);
  }

  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = 'bold 9px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y + 4);
}

function drawPlayerCar(ctx: CanvasRenderingContext2D, x: number, y: number, isMoving: boolean, crashed: boolean) {
  const w = PLAYER_W;
  const h = PLAYER_H;
  const hw = w / 2;
  const hh = h / 2;
  const bodyColor = crashed ? '#e74c3c' : isMoving ? '#27ae60' : '#2ecc71';
  const roofColor = crashed ? '#c0392b' : '#1a8a45';

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(x, y + hh + 4, hw * 0.9, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.roundRect(x - hw, y - hh, w, h, 6);
  ctx.fill();

  // Roof
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.roundRect(x - hw + 5, y - hh + h * 0.22, w - 10, h * 0.38, 4);
  ctx.fill();

  // Windshield (top, facing up = toward top of screen)
  ctx.fillStyle = 'rgba(135,206,235,0.8)';
  ctx.beginPath();
  ctx.roundRect(x - hw + 5, y - hh + 5, w - 10, 12, 2);
  ctx.fill();

  // Headlights (top)
  ctx.fillStyle = '#fffacd';
  ctx.beginPath(); ctx.roundRect(x - hw + 3, y - hh + 2, 8, 6, 2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(x + hw - 11, y - hh + 2, 8, 6, 2); ctx.fill();

  // Taillights (bottom)
  ctx.fillStyle = '#ff4444';
  ctx.beginPath(); ctx.roundRect(x - hw + 3, y + hh - 8, 8, 6, 2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(x + hw - 11, y + hh - 8, 8, 6, 2); ctx.fill();

  // YOU label
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = 'bold 9px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('YOU', x, y + 5);

  if (crashed) {
    ctx.font = 'bold 18px Arial';
    ctx.fillText('💥', x, y - hh - 10);
  }
}

function drawHUD(ctx: CanvasRenderingContext2D, score: number, distance: number, streak: number, hasROW: boolean, isMoving: boolean) {
  // Score bar
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, W, 36);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 8, 22);

  ctx.textAlign = 'center';
  ctx.fillText(`${Math.floor(distance)}m`, W / 2, 22);

  ctx.textAlign = 'right';
  ctx.fillText(`Streak: ${streak}`, W - 8, 22);

  // ROW indicator
  const rowColor = hasROW ? '#2ecc71' : '#e74c3c';
  const rowText = hasROW ? '✓ GO' : '✗ STOP';
  ctx.fillStyle = rowColor;
  ctx.fillRect(ROAD_LEFT, H - 44, ROAD_W, 34);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Right of Way: ${rowText}`, W / 2, H - 22);
}

// ─── ROW sign ─────────────────────────────────────────────────────────────────
function drawROWSign(ctx: CanvasRenderingContext2D, car: TrafficCar) {
  if (!car.hasRightOfWay) return;
  // Small stop sign near the car
  const sx = car.x + car.w / 2 + 14;
  const sy = car.y;
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  // Octagon
  const r = 10;
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i - Math.PI / 8;
    const px = sx + r * Math.cos(angle);
    const py = sy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 6px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('STOP', sx, sy + 2);
}

// ─── Component ────────────────────────────────────────────────────────────────
interface TrafficRunnerGameProps {
  onScoreUpdate?: (score: number) => void;
}

export default function TrafficRunnerGame({ onScoreUpdate }: TrafficRunnerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>({ phase: 'idle', score: 0, distance: 0, streak: 0, level: 0 });
  const carsRef = useRef<TrafficCar[]>([]);
  const stripeOffsetRef = useRef(0);
  const isMovingRef = useRef(false);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef(0);
  const rafRef = useRef<number>(0);
  const [displayState, setDisplayState] = useState<GameState>({ phase: 'idle', score: 0, distance: 0, streak: 0, level: 0 });
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);

  // ── Collision check ──────────────────────────────────────────────────────────
  const checkCollision = useCallback((cars: TrafficCar[]): boolean => {
    const px = PLAYER_X - PLAYER_W / 2;
    const py = PLAYER_Y - PLAYER_H / 2;
    for (const car of cars) {
      const cx = car.x - car.w / 2;
      const cy = car.y - car.h / 2;
      if (px < cx + car.w && px + PLAYER_W > cx && py < cy + car.h && py + PLAYER_H > cy) {
        return true;
      }
    }
    return false;
  }, []);

  // ── Determine if player currently has right of way ───────────────────────────
  const playerHasROW = useCallback((cars: TrafficCar[]): boolean => {
    // Player has ROW if no car with hasRightOfWay is in the collision zone (within 120px ahead)
    const dangerZoneTop = PLAYER_Y - PLAYER_H / 2 - 120;
    const dangerZoneBottom = PLAYER_Y + PLAYER_H / 2;
    for (const car of cars) {
      if (!car.hasRightOfWay) continue;
      const cy = car.y - car.h / 2;
      const carBottom = car.y + car.h / 2;
      const cx = car.x - car.w / 2;
      // Only cars in the player's lane (center road)
      if (cx < ROAD_RIGHT && cx + car.w > ROAD_LEFT) {
        if (carBottom > dangerZoneTop && cy < dangerZoneBottom) {
          return false; // a ROW car is nearby → player must stop
        }
      }
    }
    return true;
  }, []);

  // ── Main game loop ────────────────────────────────────────────────────────────
  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = stateRef.current;
    if (state.phase !== 'playing') return;

    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05); // cap at 50ms
    lastTimeRef.current = timestamp;

    const levelCfg = LEVELS[state.level];
    const moving = isMovingRef.current;

    // ── Update stripe offset (road scroll) ──────────────────────────────────
    if (moving) {
      stripeOffsetRef.current = (stripeOffsetRef.current + PLAYER_SPEED * dt) % (STRIPE_H + STRIPE_GAP);
    }

    // ── Move traffic cars downward ───────────────────────────────────────────
    const cars = carsRef.current;
    for (const car of cars) {
      car.y += car.speed * dt;
    }
    // Remove off-screen cars
    carsRef.current = cars.filter(c => c.y - c.h / 2 < H + 20);

    // ── Spawn new cars ───────────────────────────────────────────────────────
    spawnTimerRef.current += dt * 1000;
    if (spawnTimerRef.current >= levelCfg.spawnInterval) {
      spawnTimerRef.current = 0;
      carsRef.current.push(spawnCar(state.level, levelCfg.trafficSpeed, levelCfg.rightOfWayChance));
    }

    // ── Check ROW ────────────────────────────────────────────────────────────
    const hasROW = playerHasROW(carsRef.current);

    // ── Crash detection ──────────────────────────────────────────────────────
    // 1. Physical collision
    if (checkCollision(carsRef.current)) {
      stateRef.current = { ...state, phase: 'crashed' };
      setDisplayState({ ...stateRef.current });
      // Draw one last frame
      drawFrame(ctx, false, true, hasROW, state);
      return;
    }
    // 2. Player moved when no ROW
    if (moving && !hasROW) {
      stateRef.current = { ...state, phase: 'crashed' };
      setDisplayState({ ...stateRef.current });
      drawFrame(ctx, moving, true, hasROW, state);
      return;
    }

    // ── Update score & distance ───────────────────────────────────────────────
    if (moving) {
      const newDist = state.distance + PLAYER_SPEED * dt * 0.05;
      const newScore = state.score + Math.floor(PLAYER_SPEED * dt * 0.1);
      stateRef.current = { ...state, distance: newDist, score: newScore };
    }

    // ── Level complete at 300m ────────────────────────────────────────────────
    if (stateRef.current.distance >= 300) {
      stateRef.current = { ...stateRef.current, phase: 'levelComplete', streak: state.streak + 1 };
      setDisplayState({ ...stateRef.current });
      drawFrame(ctx, moving, false, hasROW, stateRef.current);
      onScoreUpdate?.(stateRef.current.score);
      return;
    }

    // ── Draw ─────────────────────────────────────────────────────────────────
    drawFrame(ctx, moving, false, hasROW, stateRef.current);

    // Throttle display update to ~10fps to avoid React re-render storm
    if (timestamp % 100 < 20) {
      setDisplayState({ ...stateRef.current });
    }

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [checkCollision, playerHasROW, onScoreUpdate]);

  function drawFrame(
    ctx: CanvasRenderingContext2D,
    moving: boolean,
    crashed: boolean,
    hasROW: boolean,
    state: GameState
  ) {
    drawRoad(ctx, stripeOffsetRef.current);

    // Draw traffic cars
    for (const car of carsRef.current) {
      drawVehicle(ctx, car.x, car.y, car.w, car.h, car.color, '#1a1a2e', car.label, car.hasRightOfWay, true);
      drawROWSign(ctx, car);
    }

    // Draw player
    drawPlayerCar(ctx, PLAYER_X, PLAYER_Y, moving, crashed);

    drawHUD(ctx, state.score, state.distance, state.streak, hasROW, moving);

    if (crashed) {
      ctx.fillStyle = 'rgba(231,76,60,0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CRASH!', W / 2, H / 2 - 20);
      ctx.font = '16px Arial';
      ctx.fillText('You moved without right of way!', W / 2, H / 2 + 16);
    }
  }

  // ── Start game ────────────────────────────────────────────────────────────────
  const startGame = useCallback((levelIdx: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    carsRef.current = [];
    stripeOffsetRef.current = 0;
    spawnTimerRef.current = 0;
    isMovingRef.current = false;
    const newState: GameState = { phase: 'playing', score: 0, distance: 0, streak: displayState.streak, level: levelIdx };
    stateRef.current = newState;
    setDisplayState(newState);
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop, displayState.streak]);

  // ── Input handlers ────────────────────────────────────────────────────────────
  const handlePressStart = useCallback(() => {
    if (stateRef.current.phase === 'playing') {
      isMovingRef.current = true;
    }
  }, []);

  const handlePressEnd = useCallback(() => {
    isMovingRef.current = false;
  }, []);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); handlePressStart(); } };
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); handlePressEnd(); } };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [handlePressStart, handlePressEnd]);

  // Cleanup on unmount
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // Draw idle screen
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawRoad(ctx, 0);
    drawPlayerCar(ctx, PLAYER_X, PLAYER_Y, false, false);
    // Title
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, H / 2 - 60, W, 110);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Traffic Jam Runner', W / 2, H / 2 - 24);
    ctx.font = '13px Arial';
    ctx.fillText('Hold button to drive forward', W / 2, H / 2 + 4);
    ctx.fillText('Release when you DON\'T have right of way!', W / 2, H / 2 + 24);
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 11px Arial';
    ctx.fillText('🔴 ROW badge = that car has right of way → you must STOP', W / 2, H / 2 + 46);
  }, []);

  const levelCfg = LEVELS[currentLevelIdx];

  return (
    <div className="w-full flex flex-col items-center gap-3 select-none">
      {/* Level selector */}
      <div className="w-full flex items-center justify-between bg-green-600 text-white rounded-lg px-4 py-2">
        <button
          onClick={() => setCurrentLevelIdx(i => Math.max(0, i - 1))}
          className="text-white font-bold text-lg px-2 disabled:opacity-40"
          disabled={currentLevelIdx === 0}
        >‹</button>
        <div className="text-center">
          <p className="font-bold text-sm">{levelCfg.name}</p>
          <p className="text-xs opacity-80">Level {currentLevelIdx + 1} of {LEVELS.length}</p>
        </div>
        <button
          onClick={() => setCurrentLevelIdx(i => Math.min(LEVELS.length - 1, i + 1))}
          className="text-white font-bold text-lg px-2 disabled:opacity-40"
          disabled={currentLevelIdx === LEVELS.length - 1}
        >›</button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full max-w-sm rounded-xl border-4 border-green-500 shadow-lg touch-none"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Stats row */}
      <div className="w-full max-w-sm grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Score', val: displayState.score },
          { label: 'Distance', val: `${Math.floor(displayState.distance)}m` },
          { label: 'Streak', val: displayState.streak },
        ].map(({ label, val }) => (
          <div key={label} className="bg-white rounded-lg py-2 shadow-sm border border-green-100">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-lg font-bold text-green-600">{val}</p>
          </div>
        ))}
      </div>

      {/* Status message */}
      <div className={`w-full max-w-sm rounded-lg px-4 py-2 text-sm font-semibold text-center
        ${displayState.phase === 'crashed' ? 'bg-red-100 text-red-700 border border-red-300'
          : displayState.phase === 'levelComplete' ? 'bg-green-100 text-green-700 border border-green-300'
          : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
        {displayState.phase === 'idle' && 'Press Start to begin. Hold button to drive — release when you have no right of way!'}
        {displayState.phase === 'playing' && 'Hold the button below to drive. Release when a ROW car is nearby!'}
        {displayState.phase === 'crashed' && '💥 CRASH! You drove without right of way. Try again!'}
        {displayState.phase === 'levelComplete' && `✅ Level complete! You drove ${Math.floor(displayState.distance)}m safely.`}
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-sm flex gap-3">
        {displayState.phase !== 'playing' ? (
          <>
            <button
              onClick={() => startGame(currentLevelIdx)}
              className="flex-1 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold py-3 rounded-xl shadow-md transition-all"
            >
              {displayState.phase === 'crashed' ? '🔄 Retry' : displayState.phase === 'levelComplete' ? '▶ Next Level' : '▶ Start'}
            </button>
            {displayState.phase === 'levelComplete' && currentLevelIdx < LEVELS.length - 1 && (
              <button
                onClick={() => { setCurrentLevelIdx(i => i + 1); startGame(currentLevelIdx + 1); }}
                className="flex-1 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold py-3 rounded-xl shadow-md transition-all"
              >
                Next Level ›
              </button>
            )}
          </>
        ) : (
          <button
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={(e) => { e.preventDefault(); handlePressStart(); }}
            onTouchEnd={(e) => { e.preventDefault(); handlePressEnd(); }}
            onTouchCancel={(e) => { e.preventDefault(); handlePressEnd(); }}
            className="flex-1 bg-blue-600 active:bg-blue-800 text-white font-extrabold py-5 rounded-xl shadow-xl text-xl transition-colors duration-75 touch-none"
            style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
          >
            🚗 HOLD TO DRIVE
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="w-full max-w-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
        <p className="font-bold mb-1">How to play:</p>
        <p>• Hold the button to drive forward</p>
        <p>• Release when a <span className="font-bold text-red-600">🔴 ROW</span> car is in your path — they have right of way</p>
        <p>• Drive without right of way = instant crash!</p>
        <p>• Reach 300m to complete the level</p>
      </div>
    </div>
  );
}
