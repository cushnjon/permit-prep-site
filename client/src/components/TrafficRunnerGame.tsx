/**
 * Traffic Jam Runner — Design Upgrade
 * - Controls overlaid on canvas (always visible)
 * - Full road + world rotates during left/right turns
 * - Premium dark asphalt aesthetic with neon accents
 * - Time meter at top of canvas
 */
import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const W = 340;
const H = 560;
const ROAD_LEFT = 65;
const ROAD_RIGHT = W - 65;
const ROAD_W = ROAD_RIGHT - ROAD_LEFT;
const LANE_L = ROAD_LEFT + ROAD_W * 0.27;
const LANE_R = ROAD_LEFT + ROAD_W * 0.73;
const PLAYER_X = W / 2;
const PLAYER_Y = H - 100;
const PW = 32;
const PH = 50;
const STRIPE_H = 30;
const STRIPE_GAP = 30;
const LEVEL_DISTANCE = 400;
const LEVEL_TIME = 60;

// Turn animation: the entire world rotates around the player
const TURN_ANGLE_TARGET = 90; // degrees
const TURN_DURATION = 1.2;    // seconds for full turn

// ─── Types ────────────────────────────────────────────────────────────────────
type LaneDir = 'down' | 'cross-left' | 'cross-right';
type TurnDir = 'none' | 'left' | 'right';

interface Car {
  id: number;
  x: number; y: number;
  w: number; h: number;
  speed: number;
  color: string; roofColor: string; windowColor: string;
  label: string;
  laneDir: LaneDir;
  hasROW: boolean;
  isPed: boolean;
  isEmergency: boolean;
}

interface GameState {
  phase: 'idle' | 'playing' | 'crashed' | 'levelComplete' | 'timeout';
  score: number;
  distance: number;
  streak: number;
  level: number;
  timeLeft: number;
  worldAngle: number;   // current world rotation in degrees
  turnDir: TurnDir;
  turnProgress: number; // 0→1 during a turn
  isTurning: boolean;
  lawText: string;
  lawTitle: string;
}

// ─── Vehicle defs ─────────────────────────────────────────────────────────────
const MOTOR_DEFS = [
  { w: 28, h: 46, color: '#1e3a5f', roofColor: '#0d2137', windowColor: '#5bc8f5', label: 'Sedan' },
  { w: 32, h: 52, color: '#7c2d12', roofColor: '#431407', windowColor: '#fb923c', label: 'SUV' },
  { w: 36, h: 62, color: '#3b0764', roofColor: '#1e0338', windowColor: '#c084fc', label: 'Truck' },
  { w: 34, h: 56, color: '#064e3b', roofColor: '#022c22', windowColor: '#34d399', label: 'Van' },
  { w: 30, h: 50, color: '#7f1d1d', roofColor: '#450a0a', windowColor: '#f87171', label: 'Pickup' },
  { w: 18, h: 34, color: '#713f12', roofColor: '#3d1f07', windowColor: '#fbbf24', label: 'Moto' },
];

let uid = 0;
function rnd<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function makeCar(x: number, y: number, speed: number, laneDir: LaneDir, hasROW: boolean): Car {
  const d = rnd(MOTOR_DEFS);
  return { id: uid++, x, y, w: d.w, h: d.h, speed, color: d.color, roofColor: d.roofColor, windowColor: d.windowColor, label: d.label, laneDir, hasROW, isPed: false, isEmergency: false };
}
function makePed(x: number, y: number, speed: number, laneDir: LaneDir): Car {
  return { id: uid++, x, y, w: 12, h: 22, speed, color: '#166534', roofColor: '#14532d', windowColor: '#86efac', label: '🚶', laneDir, hasROW: true, isPed: true, isEmergency: false };
}
function makeEmergency(x: number, y: number, speed: number): Car {
  return { id: uid++, x, y, w: 30, h: 50, speed, color: '#7f1d1d', roofColor: '#450a0a', windowColor: '#fca5a5', label: '🚨', laneDir: 'down', hasROW: true, isPed: false, isEmergency: true };
}

// ─── Turn events ──────────────────────────────────────────────────────────────
interface TurnEvent {
  title: string;
  law: string;
  dir: TurnDir;
  spawnCars: (lv: number) => Car[];
}

const TURN_EVENTS: TurnEvent[] = [
  {
    title: 'Unprotected Left Turn',
    law: 'Yield to ALL oncoming straight traffic before turning left.',
    dir: 'left',
    spawnCars: (lv) => [
      makeCar(LANE_R, -50, 140 + lv * 35, 'down', true),
      makeCar(LANE_R, -170, 120 + lv * 35, 'down', true),
    ],
  },
  {
    title: 'Right Turn — Pedestrian',
    law: 'Yield to pedestrians in the crosswalk before turning right.',
    dir: 'right',
    spawnCars: () => [
      makePed(ROAD_LEFT - 18, PLAYER_Y - 45, 55, 'cross-left'),
      makePed(ROAD_RIGHT + 18, PLAYER_Y - 65, 55, 'cross-right'),
    ],
  },
  {
    title: '4-Way Stop',
    law: 'Simultaneous arrival — yield to the vehicle on your RIGHT.',
    dir: 'none',
    spawnCars: (lv) => [makeCar(ROAD_RIGHT + 55, PLAYER_Y - 8, 90 + lv * 20, 'cross-right', true)],
  },
  {
    title: 'Emergency Vehicle',
    law: 'Always yield to emergency vehicles — pull over and stop.',
    dir: 'none',
    spawnCars: (lv) => [makeEmergency(PLAYER_X, -70, 180 + lv * 40)],
  },
  {
    title: 'T-Intersection',
    law: 'Through-road traffic has right-of-way over entering vehicles.',
    dir: 'none',
    spawnCars: (lv) => [
      makeCar(ROAD_LEFT - 75, PLAYER_Y - 15, 120 + lv * 30, 'cross-left', true),
      makeCar(ROAD_RIGHT + 75, PLAYER_Y - 35, 110 + lv * 30, 'cross-right', true),
    ],
  },
  {
    title: 'Roundabout Entry',
    law: 'Yield to all vehicles already circulating inside the roundabout.',
    dir: 'left',
    spawnCars: (lv) => [makeCar(PLAYER_X - 18, PLAYER_Y - 65, 100 + lv * 25, 'cross-right', true)],
  },
  {
    title: 'Driveway Exit',
    law: 'Yield to ALL road traffic and pedestrians when exiting a driveway.',
    dir: 'right',
    spawnCars: (lv) => [
      makeCar(LANE_L, -40, 130 + lv * 30, 'down', true),
      makeCar(LANE_R, -90, 120 + lv * 30, 'down', true),
    ],
  },
  {
    title: 'Green Light Left Turn',
    law: 'Green light does NOT give left-turners priority. Yield to oncoming straight traffic.',
    dir: 'left',
    spawnCars: (lv) => [
      makeCar(LANE_R, -30, 150 + lv * 40, 'down', true),
      makeCar(LANE_R, -150, 140 + lv * 40, 'down', true),
    ],
  },
];

// ─── Drawing ──────────────────────────────────────────────────────────────────
function drawScene(
  ctx: CanvasRenderingContext2D,
  cars: Car[],
  stripeOff: number,
  worldAngle: number,
  isMoving: boolean,
  crashed: boolean
) {
  // Save and rotate entire world around player position
  ctx.save();
  ctx.translate(PLAYER_X, PLAYER_Y);
  ctx.rotate((worldAngle * Math.PI) / 180);
  ctx.translate(-PLAYER_X, -PLAYER_Y);

  // ── Background / grass ───────────────────────────────────────────────────
  // Extended to cover rotation artifacts
  const ext = 200;
  ctx.fillStyle = '#14532d';
  ctx.fillRect(-ext, -ext, W + ext * 2, H + ext * 2);

  // Grass texture dots
  ctx.fillStyle = 'rgba(21,128,61,0.4)';
  for (let gx = -ext; gx < W + ext; gx += 18) {
    for (let gy = -ext; gy < H + ext; gy += 18) {
      ctx.beginPath(); ctx.arc(gx + 4, gy + 4, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ── Road surface ─────────────────────────────────────────────────────────
  ctx.fillStyle = '#1c2526';
  ctx.fillRect(ROAD_LEFT, -ext, ROAD_W, H + ext * 2);

  // Road subtle texture
  ctx.fillStyle = 'rgba(255,255,255,0.015)';
  for (let ry = -ext; ry < H + ext; ry += 8) {
    ctx.fillRect(ROAD_LEFT, ry, ROAD_W, 3);
  }

  // Edge rumble strips
  const rumbleW = 8;
  for (let ry = -ext; ry < H + ext; ry += 20) {
    ctx.fillStyle = ry % 40 < 20 ? '#fbbf24' : '#1c2526';
    ctx.fillRect(ROAD_LEFT, ry, rumbleW, 20);
    ctx.fillRect(ROAD_RIGHT - rumbleW, ry, rumbleW, 20);
  }

  // Road edge lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(ROAD_LEFT + rumbleW, -ext); ctx.lineTo(ROAD_LEFT + rumbleW, H + ext); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ROAD_RIGHT - rumbleW, -ext); ctx.lineTo(ROAD_RIGHT - rumbleW, H + ext); ctx.stroke();

  // Center dashes
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([STRIPE_H, STRIPE_GAP]);
  ctx.lineDashOffset = -stripeOff;
  ctx.beginPath(); ctx.moveTo(W / 2, -ext); ctx.lineTo(W / 2, H + ext); ctx.stroke();
  ctx.setLineDash([]);

  // ── Draw cars ────────────────────────────────────────────────────────────
  for (const car of cars) drawCar(ctx, car);

  ctx.restore();
}

function drawCar(ctx: CanvasRenderingContext2D, car: Car) {
  ctx.save();
  ctx.translate(car.x, car.y);
  if (car.laneDir === 'cross-left') ctx.rotate(Math.PI / 2);
  else if (car.laneDir === 'cross-right') ctx.rotate(-Math.PI / 2);

  const hw = car.w / 2, hh = car.h / 2;

  if (car.isPed) {
    ctx.fillStyle = '#bbf7d0';
    ctx.beginPath(); ctx.arc(0, -hh + 4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = car.color;
    ctx.fillRect(-2.5, -hh + 8, 5, 10);
    ctx.fillRect(-5, -hh + 18, 4, 7);
    ctx.fillRect(1, -hh + 18, 4, 7);
    ctx.restore();
    if (car.hasROW) drawROWBadge(ctx, car.x + 10, car.y - 10);
    return;
  }

  // Glow for emergency
  if (car.isEmergency) {
    const t = Date.now() % 400 < 200;
    ctx.shadowColor = t ? '#3b82f6' : '#ef4444';
    ctx.shadowBlur = 18;
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(3, hh + 4, hw * 0.8, 5, 0, 0, Math.PI * 2); ctx.fill();

  // Body
  ctx.fillStyle = car.color;
  ctx.beginPath(); ctx.roundRect(-hw, -hh, car.w, car.h, 6); ctx.fill();

  // Roof
  ctx.fillStyle = car.roofColor;
  ctx.beginPath(); ctx.roundRect(-hw + 4, -hh + car.h * 0.22, car.w - 8, car.h * 0.36, 4); ctx.fill();

  // Windshield glow
  ctx.fillStyle = car.windowColor;
  ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.roundRect(-hw + 3, -hh + 3, car.w - 6, 10, 2); ctx.fill();
  ctx.globalAlpha = 1;

  // Headlights
  if (car.isEmergency) {
    const t = Date.now() % 400 < 200;
    ctx.fillStyle = t ? '#60a5fa' : '#f87171';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
  } else {
    ctx.fillStyle = '#fef9c3';
    ctx.shadowColor = '#fef9c3';
    ctx.shadowBlur = 6;
  }
  ctx.beginPath(); ctx.roundRect(-hw + 2, -hh + 2, 6, 4, 1); ctx.fill();
  ctx.beginPath(); ctx.roundRect(hw - 8, -hh + 2, 6, 4, 1); ctx.fill();
  ctx.shadowBlur = 0;

  // Taillights
  ctx.fillStyle = '#ef4444';
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 5;
  ctx.beginPath(); ctx.roundRect(-hw + 2, hh - 6, 6, 4, 1); ctx.fill();
  ctx.beginPath(); ctx.roundRect(hw - 8, hh - 6, 6, 4, 1); ctx.fill();
  ctx.shadowBlur = 0;

  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = 'bold 7px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(car.label, 0, 3);

  ctx.restore();

  if (car.hasROW) drawROWBadge(ctx, car.x + car.w / 2 - 1, car.y - car.h / 2 - 1);
}

function drawROWBadge(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#dc2626';
  ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 5.5px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('ROW', x, y + 2);
  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, isMoving: boolean, crashed: boolean) {
  const hw = PW / 2, hh = PH / 2;
  const body = crashed ? '#7f1d1d' : isMoving ? '#14532d' : '#166534';
  const roof = crashed ? '#450a0a' : '#052e16';
  const win = crashed ? '#fca5a5' : '#86efac';

  // Glow
  ctx.shadowColor = crashed ? '#ef4444' : isMoving ? '#22c55e' : '#16a34a';
  ctx.shadowBlur = crashed ? 20 : isMoving ? 14 : 8;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(PLAYER_X + 3, PLAYER_Y + hh + 4, hw * 0.8, 5, 0, 0, Math.PI * 2); ctx.fill();

  // Body
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.roundRect(PLAYER_X - hw, PLAYER_Y - hh, PW, PH, 6); ctx.fill();

  // Roof
  ctx.fillStyle = roof;
  ctx.beginPath(); ctx.roundRect(PLAYER_X - hw + 4, PLAYER_Y - hh + PH * 0.22, PW - 8, PH * 0.36, 4); ctx.fill();

  // Windshield
  ctx.fillStyle = win;
  ctx.globalAlpha = 0.75;
  ctx.beginPath(); ctx.roundRect(PLAYER_X - hw + 3, PLAYER_Y - hh + 3, PW - 6, 10, 2); ctx.fill();
  ctx.globalAlpha = 1;

  // Headlights
  ctx.fillStyle = '#fef9c3';
  ctx.shadowColor = '#fef9c3';
  ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.roundRect(PLAYER_X - hw + 2, PLAYER_Y - hh + 2, 6, 4, 1); ctx.fill();
  ctx.beginPath(); ctx.roundRect(PLAYER_X + hw - 8, PLAYER_Y - hh + 2, 6, 4, 1); ctx.fill();
  ctx.shadowBlur = 0;

  // Taillights
  ctx.fillStyle = '#ef4444';
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.roundRect(PLAYER_X - hw + 2, PLAYER_Y + hh - 6, 6, 4, 1); ctx.fill();
  ctx.beginPath(); ctx.roundRect(PLAYER_X + hw - 8, PLAYER_Y + hh - 6, 6, 4, 1); ctx.fill();
  ctx.shadowBlur = 0;

  // YOU label
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 7px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('YOU', PLAYER_X, PLAYER_Y + 3);

  if (crashed) {
    ctx.font = 'bold 22px Arial';
    ctx.fillText('💥', PLAYER_X, PLAYER_Y - hh - 14);
  }
}

function drawHUD(
  ctx: CanvasRenderingContext2D,
  score: number, distance: number,
  timeLeft: number, hasROW: boolean,
  turnDir: TurnDir, lawTitle: string, lawText: string,
  isTurning: boolean
) {
  // ── Top HUD bar ──────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, W, 38);

  // Time meter
  const mW = 100, mX = 8, mY = 10, mH = 16;
  const pct = Math.max(0, timeLeft / LEVEL_TIME);
  const mColor = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#fbbf24' : '#ef4444';
  // Track
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath(); ctx.roundRect(mX, mY, mW, mH, 4); ctx.fill();
  // Fill
  ctx.fillStyle = mColor;
  ctx.shadowColor = mColor;
  ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.roundRect(mX, mY, mW * pct, mH, 4); ctx.fill();
  ctx.shadowBlur = 0;
  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(mX, mY, mW, mH, 4); ctx.stroke();
  // Timer text
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 9px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`⏱ ${Math.ceil(timeLeft)}s`, mX + 3, mY + 12);

  // Distance
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.floor(distance)}m`, W / 2, 24);

  // Score
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`${score} pts`, W - 8, 24);

  // ── Turn banner ──────────────────────────────────────────────────────────
  if (turnDir !== 'none' || isTurning) {
    const bColor = turnDir === 'left' ? '#1d4ed8' : '#7c3aed';
    ctx.fillStyle = bColor;
    ctx.fillRect(0, 38, W, 22);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    const arrow = isTurning ? (turnDir === 'left' ? '↰ Turning Left…' : '↱ Turning Right…') : (turnDir === 'left' ? '← LEFT TURN — Yield first!' : '→ RIGHT TURN — Yield first!');
    ctx.fillText(arrow, W / 2, 54);
  }

  // ── Law strip ────────────────────────────────────────────────────────────
  if (lawTitle && !lawTitle.startsWith('Open')) {
    const topY = 38 + (turnDir !== 'none' || isTurning ? 22 : 0);
    ctx.fillStyle = 'rgba(15,23,42,0.85)';
    ctx.fillRect(0, topY, W, 28);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`⚠ ${lawTitle}`, W / 2, topY + 11);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px Arial';
    let t = lawText;
    while (ctx.measureText(t).width > W - 16 && t.length > 10) t = t.slice(0, -4) + '…';
    ctx.fillText(t, W / 2, topY + 23);
  }

  // ── ROW indicator (bottom of canvas) ────────────────────────────────────
  const rowBg = hasROW ? 'rgba(20,83,45,0.92)' : 'rgba(127,29,29,0.92)';
  ctx.fillStyle = rowBg;
  ctx.fillRect(ROAD_LEFT + 8, H - 38, ROAD_W - 16, 28);
  ctx.strokeStyle = hasROW ? '#22c55e' : '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(ROAD_LEFT + 8, H - 38, ROAD_W - 16, 28, 4); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(hasROW ? '✓ YOU HAVE ROW — HOLD TO GO' : '✗ YIELD — RELEASE BUTTON NOW', W / 2, H - 19);
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props { onScoreUpdate?: (s: number) => void; }

export default function TrafficRunnerGame({ onScoreUpdate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState>({
    phase: 'idle', score: 0, distance: 0, streak: 0, level: 0,
    timeLeft: LEVEL_TIME, worldAngle: 0, turnDir: 'none',
    turnProgress: 0, isTurning: false, lawText: '', lawTitle: '',
  });
  const carsRef = useRef<Car[]>([]);
  const stripeRef = useRef(0);
  const movingRef = useRef(false);
  const lastTRef = useRef(0);
  const rafRef = useRef(0);
  const carCountRef = useRef(0);
  const turnQueueRef = useRef<TurnEvent[]>([]);
  const activeTurnRef = useRef<TurnEvent | null>(null);
  const nextSpawnRef = useRef(1000);
  const [disp, setDisp] = useState({ ...stateRef.current });
  const [levelIdx, setLevelIdx] = useState(0);
  const LEVEL_NAMES = ['Suburban Streets', 'Downtown Grid', 'Highway Approach'];

  const computeROW = useCallback((cars: Car[]): boolean => {
    const dTop = PLAYER_Y - PH / 2 - 170;
    const dBot = PLAYER_Y + PH / 2 + 20;
    for (const car of cars) {
      if (!car.hasROW) continue;
      if (car.laneDir === 'cross-left') {
        if (car.x < ROAD_RIGHT + 60 && car.x > ROAD_LEFT - 60 && car.y > dTop && car.y < dBot) return false;
        continue;
      }
      if (car.laneDir === 'cross-right') {
        if (car.x > ROAD_LEFT - 60 && car.x < ROAD_RIGHT + 60 && car.y > dTop && car.y < dBot) return false;
        continue;
      }
      if (car.y - car.h / 2 < dBot && car.y + car.h / 2 > dTop) return false;
    }
    return true;
  }, []);

  const checkCollision = useCallback((cars: Car[]): boolean => {
    const px = PLAYER_X - PW / 2, py = PLAYER_Y - PH / 2;
    for (const car of cars) {
      const cx = car.x - car.w / 2, cy = car.y - car.h / 2;
      if (px < cx + car.w && px + PW > cx && py < cy + car.h && py + PH > cy) return true;
    }
    return false;
  }, []);

  function buildQueue(): TurnEvent[] {
    const pool = [...TURN_EVENTS].sort(() => Math.random() - 0.5);
    return pool;
  }

  const gameLoop = useCallback((ts: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;
    if (s.phase !== 'playing') return;

    const dt = Math.min((ts - lastTRef.current) / 1000, 0.05);
    lastTRef.current = ts;
    const moving = movingRef.current;
    const lv = s.level;
    const baseSpeed = 120 + lv * 40;

    // ── Road scroll ──────────────────────────────────────────────────────────
    if (moving) stripeRef.current = (stripeRef.current + 160 * dt) % (STRIPE_H + STRIPE_GAP);

    // ── World rotation for turns ─────────────────────────────────────────────
    let worldAngle = s.worldAngle;
    let turnProgress = s.turnProgress;
    let isTurning = s.isTurning;

    if (isTurning) {
      turnProgress = Math.min(1, turnProgress + dt / TURN_DURATION);
      // Smooth ease in-out
      const eased = turnProgress < 0.5 ? 2 * turnProgress * turnProgress : 1 - Math.pow(-2 * turnProgress + 2, 2) / 2;
      const targetAngle = s.turnDir === 'left' ? -TURN_ANGLE_TARGET : TURN_ANGLE_TARGET;
      worldAngle = targetAngle * eased;
      if (turnProgress >= 1) {
        isTurning = false;
        turnProgress = 0;
        worldAngle = 0; // reset after turn completes
      }
    }

    // ── Move cars ────────────────────────────────────────────────────────────
    for (const car of carsRef.current) {
      if (car.laneDir === 'cross-left') car.x += car.speed * dt;
      else if (car.laneDir === 'cross-right') car.x -= car.speed * dt;
      else car.y += car.speed * dt;
    }
    carsRef.current = carsRef.current.filter(c => {
      if (c.laneDir === 'cross-left') return c.x < W + 100;
      if (c.laneDir === 'cross-right') return c.x > -100;
      return c.y - c.h / 2 < H + 80;
    });

    // ── Spawn cars ───────────────────────────────────────────────────────────
    nextSpawnRef.current -= dt * 1000;
    if (nextSpawnRef.current <= 0) {
      carCountRef.current++;
      const interval = Math.max(900, 2400 - lv * 400);
      nextSpawnRef.current = interval;

      if (carCountRef.current % 2 === 0) {
        // Every 2nd car → turn event
        if (turnQueueRef.current.length === 0) turnQueueRef.current = buildQueue();
        activeTurnRef.current = turnQueueRef.current.shift()!;
        carsRef.current.push(...activeTurnRef.current.spawnCars(lv));
        // Start turn animation if directional
        const newTurnDir = activeTurnRef.current.dir;
        const startTurning = newTurnDir !== 'none';
        stateRef.current = {
          ...stateRef.current,
          turnDir: newTurnDir,
          lawTitle: activeTurnRef.current.title,
          lawText: activeTurnRef.current.law,
          isTurning: startTurning,
          turnProgress: startTurning ? 0 : turnProgress,
        };
      } else {
        // Normal car
        const lane = Math.random() < 0.5 ? LANE_L : LANE_R;
        carsRef.current.push(makeCar(lane, -60, baseSpeed * (0.8 + Math.random() * 0.4), 'down', false));
        if (!isTurning) {
          stateRef.current = { ...stateRef.current, turnDir: 'none', lawTitle: '', lawText: '' };
        }
      }
    }

    // ── ROW ──────────────────────────────────────────────────────────────────
    const hasROW = computeROW(carsRef.current);

    // ── Score / distance ─────────────────────────────────────────────────────
    let newDist = s.distance;
    let newScore = s.score;
    if (moving) {
      newDist += 160 * dt * 0.05;
      newScore += Math.floor(160 * dt * 0.1);
    }

    // ── Timer ────────────────────────────────────────────────────────────────
    const newTime = s.timeLeft - dt;
    if (newTime <= 0) {
      stateRef.current = { ...s, phase: 'timeout', timeLeft: 0, score: newScore, distance: newDist };
      setDisp({ ...stateRef.current });
      onScoreUpdate?.(newScore);
      return;
    }

    // ── Crash ────────────────────────────────────────────────────────────────
    if (checkCollision(carsRef.current) || (moving && !hasROW)) {
      stateRef.current = { ...s, phase: 'crashed', score: newScore, distance: newDist, worldAngle, isTurning, turnProgress };
      setDisp({ ...stateRef.current });
      renderFrame(ctx, false, true, hasROW, stateRef.current);
      onScoreUpdate?.(newScore);
      return;
    }

    // ── Level complete ───────────────────────────────────────────────────────
    if (newDist >= LEVEL_DISTANCE) {
      stateRef.current = { ...s, phase: 'levelComplete', score: newScore, distance: newDist, streak: s.streak + 1 };
      setDisp({ ...stateRef.current });
      renderFrame(ctx, moving, false, hasROW, stateRef.current);
      onScoreUpdate?.(newScore);
      return;
    }

    stateRef.current = { ...s, score: newScore, distance: newDist, timeLeft: newTime, worldAngle, isTurning, turnProgress };
    renderFrame(ctx, moving, false, hasROW, stateRef.current);
    if (ts % 80 < 20) setDisp({ ...stateRef.current });

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [checkCollision, computeROW, onScoreUpdate]);

  function renderFrame(ctx: CanvasRenderingContext2D, moving: boolean, crashed: boolean, hasROW: boolean, s: GameState) {
    // Clear
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // Draw rotated world (road + cars)
    drawScene(ctx, carsRef.current, stripeRef.current, s.worldAngle, moving, crashed);

    // Player is always centered (not rotated)
    drawPlayer(ctx, moving, crashed);

    // HUD on top
    drawHUD(ctx, s.score, s.distance, s.timeLeft, hasROW, s.turnDir, s.lawTitle, s.lawText, s.isTurning);

    if (crashed) {
      ctx.fillStyle = 'rgba(127,29,29,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 34px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CRASH!', W / 2, H / 2 - 28);
      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 11px Arial';
      ctx.fillText(s.lawTitle, W / 2, H / 2 - 4);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '9px Arial';
      let t = s.lawText;
      while (ctx.measureText(t).width > W - 28 && t.length > 10) t = t.slice(0, -4) + '…';
      ctx.fillText(t, W / 2, H / 2 + 14);
    }

    if (s.phase === 'timeout') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 30px Arial';
      ctx.textAlign = 'center';
      ctx.fillText("TIME'S UP!", W / 2, H / 2 - 14);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '13px Arial';
      ctx.fillText(`${Math.floor(s.distance)}m driven`, W / 2, H / 2 + 12);
    }

    if (s.phase === 'levelComplete') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('LEVEL CLEAR!', W / 2, H / 2 - 14);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '13px Arial';
      ctx.fillText(`${Math.floor(s.distance)}m • ${s.score} pts`, W / 2, H / 2 + 12);
    }
  }

  const startGame = useCallback((lv: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    carsRef.current = [];
    stripeRef.current = 0;
    movingRef.current = false;
    carCountRef.current = 0;
    nextSpawnRef.current = 1000;
    turnQueueRef.current = buildQueue();
    activeTurnRef.current = null;
    const ns: GameState = {
      phase: 'playing', score: 0, distance: 0,
      streak: stateRef.current.streak, level: lv,
      timeLeft: LEVEL_TIME, worldAngle: 0, turnDir: 'none',
      turnProgress: 0, isTurning: false, lawText: '', lawTitle: '',
    };
    stateRef.current = ns;
    setDisp(ns);
    lastTRef.current = performance.now();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  const pressStart = useCallback(() => { if (stateRef.current.phase === 'playing') movingRef.current = true; }, []);
  const pressEnd = useCallback(() => { movingRef.current = false; }, []);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); pressStart(); } };
    const ku = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); pressEnd(); } };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, [pressStart, pressEnd]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // Idle screen
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);
    drawScene(ctx, [], 0, 0, false, false);
    drawPlayer(ctx, false, false);
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
    ctx.fillText('Hold button to drive forward', W / 2, H / 2 - 10);
    ctx.fillText('Release when you must yield', W / 2, H / 2 + 8);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('← → Turns every 2 cars  |  8 DMV ROW laws', W / 2, H / 2 + 28);
    ctx.fillStyle = '#f87171';
    ctx.font = '9px Arial';
    ctx.fillText('🔴 ROW = that vehicle has right of way', W / 2, H / 2 + 44);
  }, []);

  const phase = disp.phase;
  const isPlaying = phase === 'playing';

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center gap-1 select-none">
      {/* Level selector */}
      <div className="w-full flex items-center justify-between bg-slate-800 text-white rounded-lg px-3 py-1.5 border border-slate-700">
        <button onClick={() => setLevelIdx(i => Math.max(0, i - 1))} className="font-bold text-xl px-2 disabled:opacity-30 text-green-400" disabled={levelIdx === 0}>‹</button>
        <div className="text-center">
          <p className="font-bold text-xs text-green-300">{LEVEL_NAMES[levelIdx]}</p>
          <p className="text-xs text-slate-400">Lv {levelIdx + 1} / {LEVEL_NAMES.length}</p>
        </div>
        <button onClick={() => setLevelIdx(i => Math.min(LEVEL_NAMES.length - 1, i + 1))} className="font-bold text-xl px-2 disabled:opacity-30 text-green-400" disabled={levelIdx === LEVEL_NAMES.length - 1}>›</button>
      </div>

      {/* Canvas — full width, no gap to button */}
      <div className="relative w-full max-w-sm">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="w-full rounded-t-xl border-2 border-slate-600 touch-none block"
        />

        {/* HOLD button overlaid at bottom of canvas */}
        <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
          {!isPlaying ? (
            <div className="flex gap-2">
              <button
                onClick={() => startGame(levelIdx)}
                className="flex-1 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-bold py-3 rounded-lg shadow-lg transition-all text-sm border border-green-400"
              >
                {phase === 'crashed' || phase === 'timeout' ? '🔄 Retry' : phase === 'levelComplete' ? '▶ Play Again' : '▶ Start Game'}
              </button>
              {phase === 'levelComplete' && levelIdx < LEVEL_NAMES.length - 1 && (
                <button
                  onClick={() => { const n = levelIdx + 1; setLevelIdx(n); startGame(n); }}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-3 rounded-lg shadow-lg transition-all text-sm border border-blue-400"
                >Next Level ›</button>
              )}
            </div>
          ) : (
            <button
              onMouseDown={pressStart}
              onMouseUp={pressEnd}
              onMouseLeave={pressEnd}
              onTouchStart={(e) => { e.preventDefault(); pressStart(); }}
              onTouchEnd={(e) => { e.preventDefault(); pressEnd(); }}
              onTouchCancel={(e) => { e.preventDefault(); pressEnd(); }}
              className="w-full bg-blue-700 active:bg-blue-900 text-white font-extrabold py-4 rounded-lg shadow-xl text-lg border border-blue-400 touch-none"
              style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
            >🚗 HOLD TO DRIVE</button>
          )}
        </div>
      </div>

      {/* Stats row — compact, dark */}
      <div className="w-full max-w-sm grid grid-cols-3 gap-1 text-center">
        {[['Score', disp.score], ['Distance', `${Math.floor(disp.distance)}m`], ['Streak', disp.streak]].map(([l, v]) => (
          <div key={l as string} className="bg-slate-800 rounded-md py-1 border border-slate-700">
            <p className="text-xs text-slate-400">{l}</p>
            <p className="text-sm font-bold text-green-400">{v}</p>
          </div>
        ))}
      </div>

      {/* Compact ROW reference */}
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300">
        <p className="font-bold text-yellow-400 mb-0.5">DMV Right-of-Way Laws:</p>
        <div className="grid grid-cols-2 gap-x-3 text-slate-400">
          <p>• Left turn → yield oncoming</p>
          <p>• Right turn → yield peds</p>
          <p>• 4-way stop → yield to right</p>
          <p>• Emergency → always yield</p>
          <p>• T-intersection → yield entering</p>
          <p>• Roundabout → yield inside</p>
          <p>• Driveway exit → yield all</p>
          <p>• Green left → yield oncoming</p>
        </div>
      </div>
    </div>
  );
}
