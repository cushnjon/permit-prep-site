/**
 * Traffic Jam Runner — Intersection-Based
 * - Intersections spawn every 50 meters
 * - Each intersection has realistic cross-traffic based on exact DMV rules
 * - Crashes ONLY happen at intersections when violating ROW
 * - 8 unique DMV scenarios rotate through
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
const LEVEL_TIME = 60;
const INTERSECTION_INTERVAL = 50; // meters between intersections
const INTERSECTION_ZONE = 80; // pixel height of intersection danger zone

// ─── Types ────────────────────────────────────────────────────────────────────
type LaneDir = 'down' | 'cross-left' | 'cross-right';

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

interface Intersection {
  distanceMeters: number;
  scenario: Scenario;
  passed: boolean;
  crashed: boolean;
}

interface Scenario {
  title: string;
  law: string;
  description: string;
  turnDir: 'left' | 'right' | 'straight';
  spawnCars: () => Car[];
}

interface GameState {
  phase: 'idle' | 'playing' | 'crashed' | 'levelComplete' | 'timeout';
  score: number;
  distance: number;
  streak: number;
  level: number;
  timeLeft: number;
  currentIntersection: Intersection | null;
  intersectionProgress: number; // 0-1, how far through the intersection
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

// Polyfill for roundRect (not available in all browsers)
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const r2 = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + r2, y);
  ctx.lineTo(x + w - r2, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r2);
  ctx.lineTo(x + w, y + h - r2);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r2, y + h);
  ctx.lineTo(x + r2, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r2);
  ctx.lineTo(x, y + r2);
  ctx.quadraticCurveTo(x, y, x + r2, y);
  ctx.closePath();
}

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

// ─── DMV Scenarios (exact driving rules) ──────────────────────────────────────
const SCENARIOS: Scenario[] = [
  {
    title: 'Unprotected Left Turn',
    law: 'Yield to ALL oncoming straight traffic before turning left.',
    description: 'You want to turn left. Oncoming cars have ROW.',
    turnDir: 'left',
    spawnCars: () => [
      makeCar(LANE_R, -40, 140, 'down', true),
      makeCar(LANE_R, -160, 120, 'down', true),
    ],
  },
  {
    title: 'Right Turn — Pedestrian',
    law: 'Yield to pedestrians in the crosswalk before turning right.',
    description: 'Pedestrians crossing have ROW.',
    turnDir: 'right',
    spawnCars: () => [
      makePed(ROAD_LEFT - 18, PLAYER_Y - 45, 55, 'cross-left'),
      makePed(ROAD_RIGHT + 18, PLAYER_Y - 65, 55, 'cross-right'),
    ],
  },
  {
    title: '4-Way Stop',
    law: 'Simultaneous arrival — yield to the vehicle on your RIGHT.',
    description: 'All vehicles arrived at same time. Yield to right.',
    turnDir: 'straight',
    spawnCars: () => [
      makeCar(ROAD_RIGHT + 55, PLAYER_Y - 8, 90, 'cross-right', true),
    ],
  },
  {
    title: 'Emergency Vehicle',
    law: 'Always yield to emergency vehicles — pull over and stop.',
    description: 'Emergency vehicle approaching. Must yield.',
    turnDir: 'straight',
    spawnCars: () => [
      makeEmergency(PLAYER_X, -70, 180),
    ],
  },
  {
    title: 'T-Intersection',
    law: 'Through-road traffic has right-of-way over entering vehicles.',
    description: 'You are on main road. Side traffic must yield.',
    turnDir: 'straight',
    spawnCars: () => [
      makeCar(ROAD_LEFT - 75, PLAYER_Y - 15, 120, 'cross-left', true),
      makeCar(ROAD_RIGHT + 75, PLAYER_Y - 35, 110, 'cross-right', true),
    ],
  },
  {
    title: 'Roundabout Entry',
    law: 'Yield to all vehicles already circulating inside the roundabout.',
    description: 'Traffic inside roundabout has ROW.',
    turnDir: 'left',
    spawnCars: () => [
      makeCar(PLAYER_X - 18, PLAYER_Y - 65, 100, 'cross-right', true),
    ],
  },
  {
    title: 'Driveway Exit',
    law: 'Yield to ALL road traffic and pedestrians when exiting a driveway.',
    description: 'You are exiting. All road traffic has ROW.',
    turnDir: 'right',
    spawnCars: () => [
      makeCar(LANE_L, -40, 130, 'down', true),
      makeCar(LANE_R, -90, 120, 'down', true),
    ],
  },
  {
    title: 'Green Light Left Turn',
    law: 'Green light does NOT give left-turners priority. Yield to oncoming straight traffic.',
    description: 'Turning left on green. Oncoming straight traffic has ROW.',
    turnDir: 'left',
    spawnCars: () => [
      makeCar(LANE_R, -30, 150, 'down', true),
      makeCar(LANE_R, -150, 140, 'down', true),
    ],
  },
];

// ─── Drawing ──────────────────────────────────────────────────────────────────
function drawScene(
  ctx: CanvasRenderingContext2D,
  cars: Car[],
  stripeOff: number,
  isMoving: boolean
) {
  // Background
  ctx.fillStyle = '#14532d';
  ctx.fillRect(0, 0, W, H);

  // Grass texture
  ctx.fillStyle = 'rgba(21,128,61,0.4)';
  for (let gx = 0; gx < W; gx += 18) {
    for (let gy = 0; gy < H; gy += 18) {
      ctx.beginPath(); ctx.arc(gx + 4, gy + 4, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Road surface
  ctx.fillStyle = '#1c2526';
  ctx.fillRect(ROAD_LEFT, 0, ROAD_W, H);

  // Road texture
  ctx.fillStyle = 'rgba(255,255,255,0.015)';
  for (let ry = 0; ry < H; ry += 8) {
    ctx.fillRect(ROAD_LEFT, ry, ROAD_W, 3);
  }

  // Edge rumble strips
  const rumbleW = 8;
  for (let ry = 0; ry < H; ry += 20) {
    ctx.fillStyle = ry % 40 < 20 ? '#fbbf24' : '#1c2526';
    ctx.fillRect(ROAD_LEFT, ry, rumbleW, 20);
    ctx.fillRect(ROAD_RIGHT - rumbleW, ry, rumbleW, 20);
  }

  // Road edge lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(ROAD_LEFT + rumbleW, 0); ctx.lineTo(ROAD_LEFT + rumbleW, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ROAD_RIGHT - rumbleW, 0); ctx.lineTo(ROAD_RIGHT - rumbleW, H); ctx.stroke();

  // Center dashes
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([STRIPE_H, STRIPE_GAP]);
  ctx.lineDashOffset = -stripeOff;
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  ctx.setLineDash([]);

  // Draw cars
  for (const car of cars) drawCar(ctx, car);
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
  ctx.beginPath(); roundRect(ctx, -hw, -hh, car.w, car.h, 6); ctx.fill();

  // Roof
  ctx.fillStyle = car.roofColor;
  ctx.beginPath(); roundRect(ctx, -hw + 4, -hh + car.h * 0.22, car.w - 8, car.h * 0.36, 4); ctx.fill();

  // Windshield
  ctx.fillStyle = car.windowColor;
  ctx.globalAlpha = 0.7;
  ctx.beginPath(); roundRect(ctx, -hw + 3, -hh + 3, car.w - 6, 10, 2); ctx.fill();
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
  ctx.beginPath(); roundRect(ctx, -hw + 2, -hh + 2, 6, 4, 1); ctx.fill();
  ctx.beginPath(); roundRect(ctx, hw - 8, -hh + 2, 6, 4, 1); ctx.fill();
  ctx.shadowBlur = 0;

  // Taillights
  ctx.fillStyle = '#ef4444';
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 5;
  ctx.beginPath(); roundRect(ctx, -hw + 2, hh - 6, 6, 4, 1); ctx.fill();
  ctx.beginPath(); roundRect(ctx, hw - 8, hh - 6, 6, 4, 1); ctx.fill();
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

  ctx.shadowColor = crashed ? '#ef4444' : isMoving ? '#22c55e' : '#16a34a';
  ctx.shadowBlur = crashed ? 20 : isMoving ? 14 : 8;

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(PLAYER_X + 3, PLAYER_Y + hh + 4, hw * 0.8, 5, 0, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = body;
  ctx.beginPath(); ctx.roundRect(PLAYER_X - hw, PLAYER_Y - hh, PW, PH, 6); ctx.fill();

  ctx.fillStyle = roof;
  ctx.beginPath(); ctx.roundRect(PLAYER_X - hw + 4, PLAYER_Y - hh + PH * 0.22, PW - 8, PH * 0.36, 4); ctx.fill();

  ctx.fillStyle = win;
  ctx.globalAlpha = 0.75;
  ctx.beginPath(); ctx.roundRect(PLAYER_X - hw + 3, PLAYER_Y - hh + 3, PW - 6, 10, 2); ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#fef9c3';
  ctx.shadowColor = '#fef9c3';
  ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.roundRect(PLAYER_X - hw + 2, PLAYER_Y - hh + 2, 6, 4, 1); ctx.fill();
  ctx.beginPath(); ctx.roundRect(PLAYER_X + hw - 8, PLAYER_Y - hh + 2, 6, 4, 1); ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#ef4444';
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.roundRect(PLAYER_X - hw + 2, PLAYER_Y + hh - 6, 6, 4, 1); ctx.fill();
  ctx.beginPath(); ctx.roundRect(PLAYER_X + hw - 8, PLAYER_Y + hh - 6, 6, 4, 1); ctx.fill();
  ctx.shadowBlur = 0;

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
  timeLeft: number,
  currentIntersection: Intersection | null,
  intersectionProgress: number
) {
  // Top HUD bar
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, W, 38);

  // Time meter
  const mW = 100, mX = 8, mY = 10, mH = 16;
  const pct = Math.max(0, timeLeft / LEVEL_TIME);
  const mColor = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#fbbf24' : '#ef4444';
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath(); roundRect(ctx, mX, mY, mW, mH, 4); ctx.fill();
  ctx.fillStyle = mColor;
  ctx.shadowColor = mColor;
  ctx.shadowBlur = 6;
  ctx.beginPath(); roundRect(ctx, mX, mY, mW * pct, mH, 4); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath(); roundRect(ctx, mX, mY, mW, mH, 4); ctx.stroke();
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

  // Intersection info
  if (currentIntersection && intersectionProgress > 0 && intersectionProgress < 1) {
    const s = currentIntersection.scenario;
    ctx.fillStyle = 'rgba(15,23,42,0.85)';
    ctx.fillRect(0, 38, W, 28);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`⚠ ${s.title}`, W / 2, 50);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px Arial';
    let t = s.law;
    while (ctx.measureText(t).width > W - 16 && t.length > 10) t = t.slice(0, -4) + '…';
    ctx.fillText(t, W / 2, 62);
  }

  // ROW indicator (bottom)
  const hasROW = currentIntersection ? true : false; // simplified for now
  const rowBg = hasROW ? 'rgba(20,83,45,0.92)' : 'rgba(127,29,29,0.92)';
  ctx.fillStyle = rowBg;
  ctx.fillRect(ROAD_LEFT + 8, H - 38, ROAD_W - 16, 28);
  ctx.strokeStyle = hasROW ? '#22c55e' : '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); roundRect(ctx, ROAD_LEFT + 8, H - 38, ROAD_W - 16, 28, 4); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(hasROW ? '✓ APPROACHING INTERSECTION' : '✗ CLEAR INTERSECTION — RELEASE', W / 2, H - 19);
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props { onScoreUpdate?: (s: number) => void; }

export default function TrafficRunnerGame({ onScoreUpdate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState>({
    phase: 'idle', score: 0, distance: 0, streak: 0, level: 0,
    timeLeft: LEVEL_TIME, currentIntersection: null, intersectionProgress: 0,
  });
  const carsRef = useRef<Car[]>([]);
  const stripeRef = useRef(0);
  const movingRef = useRef(false);
  const lastTRef = useRef(0);
  const rafRef = useRef(0);
  const nextIntersectionRef = useRef(INTERSECTION_INTERVAL);
  const scenarioQueueRef = useRef<Scenario[]>([]);
  const [disp, setDisp] = useState({ ...stateRef.current });
  const [levelIdx, setLevelIdx] = useState(0);
  const LEVEL_NAMES = ['Suburban Streets', 'Downtown Grid', 'Highway Approach'];

  const computeROW = useCallback((cars: Car[], scenario: Scenario): boolean => {
    // Simplified: if any ROW car is in danger zone, player doesn't have ROW
    const dTop = PLAYER_Y - PH / 2 - 100;
    const dBot = PLAYER_Y + PH / 2 + 50;
    for (const car of cars) {
      if (!car.hasROW) continue;
      if (car.laneDir === 'cross-left' || car.laneDir === 'cross-right') {
        if (car.x > ROAD_LEFT - 60 && car.x < ROAD_RIGHT + 60 && car.y > dTop && car.y < dBot) return false;
      } else {
        if (car.y > dTop && car.y < dBot) return false;
      }
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

  function buildScenarioQueue(): Scenario[] {
    const pool = [...SCENARIOS].sort(() => Math.random() - 0.5);
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

    // ── Distance / intersection logic ────────────────────────────────────────
    let newDist = s.distance;
    let newScore = s.score;
    let newIntersection = s.currentIntersection;
    let intersectionProgress = s.intersectionProgress;

    if (moving) {
      newDist += 160 * dt * 0.05; // ~160 px/s = ~5 m/s in game
      newScore += Math.floor(160 * dt * 0.1);

      // Check if we should spawn a new intersection
      if (newDist >= nextIntersectionRef.current) {
        if (scenarioQueueRef.current.length === 0) scenarioQueueRef.current = buildScenarioQueue();
        const scenario = scenarioQueueRef.current.shift()!;
        newIntersection = {
          distanceMeters: nextIntersectionRef.current,
          scenario,
          passed: false,
          crashed: false,
        };
        carsRef.current = scenario.spawnCars();
        intersectionProgress = 0;
        nextIntersectionRef.current += INTERSECTION_INTERVAL;
      }

      // Update intersection progress
      if (newIntersection) {
        intersectionProgress = Math.min(1, (newDist - newIntersection.distanceMeters) / (INTERSECTION_ZONE / 160 * 0.05));
        if (intersectionProgress >= 1) {
          // Passed intersection
          newIntersection.passed = true;
          newIntersection = null;
          intersectionProgress = 0;
        }
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

    // ── Collision detection (ONLY at intersections) ───────────────────────────
    let crashed = false;
    if (newIntersection && intersectionProgress > 0.2 && intersectionProgress < 0.8) {
      // In active intersection zone
      if (moving && !computeROW(carsRef.current, newIntersection.scenario)) {
        crashed = true;
      }
      if (checkCollision(carsRef.current)) {
        crashed = true;
      }
    }

    if (crashed) {
      stateRef.current = { ...s, phase: 'crashed', score: newScore, distance: newDist, currentIntersection: newIntersection, intersectionProgress };
      setDisp({ ...stateRef.current });
      renderFrame(ctx, false, true, stateRef.current);
      onScoreUpdate?.(newScore);
      return;
    }

    // ── Timer ────────────────────────────────────────────────────────────────
    const newTime = s.timeLeft - dt;
    if (newTime <= 0) {
      stateRef.current = { ...s, phase: 'timeout', timeLeft: 0, score: newScore, distance: newDist };
      setDisp({ ...stateRef.current });
      renderFrame(ctx, moving, false, stateRef.current);
      onScoreUpdate?.(newScore);
      return;
    }

    // ── Level complete ───────────────────────────────────────────────────────
    if (newDist >= 500) { // 500m = 10 intersections
      stateRef.current = { ...s, phase: 'levelComplete', score: newScore, distance: newDist, streak: s.streak + 1 };
      setDisp({ ...stateRef.current });
      renderFrame(ctx, moving, false, stateRef.current);
      onScoreUpdate?.(newScore);
      return;
    }

    stateRef.current = { ...s, score: newScore, distance: newDist, timeLeft: newTime, currentIntersection: newIntersection, intersectionProgress };
    renderFrame(ctx, moving, false, stateRef.current);
    if (ts % 80 < 20) setDisp({ ...stateRef.current });

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [checkCollision, computeROW, onScoreUpdate]);

  function renderFrame(ctx: CanvasRenderingContext2D, moving: boolean, crashed: boolean, s: GameState) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    drawScene(ctx, carsRef.current, stripeRef.current, moving);
    drawPlayer(ctx, moving, crashed);
    drawHUD(ctx, s.score, s.distance, s.timeLeft, s.currentIntersection, s.intersectionProgress);

    if (crashed) {
      ctx.fillStyle = 'rgba(127,29,29,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 34px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CRASH!', W / 2, H / 2 - 28);
      if (s.currentIntersection) {
        ctx.fillStyle = '#fca5a5';
        ctx.font = 'bold 11px Arial';
        ctx.fillText(s.currentIntersection.scenario.title, W / 2, H / 2 - 4);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '9px Arial';
        let t = s.currentIntersection.scenario.law;
        while (ctx.measureText(t).width > W - 28 && t.length > 10) t = t.slice(0, -4) + '…';
        ctx.fillText(t, W / 2, H / 2 + 14);
      }
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
    nextIntersectionRef.current = INTERSECTION_INTERVAL;
    scenarioQueueRef.current = buildScenarioQueue();
    const ns: GameState = {
      phase: 'playing', score: 0, distance: 0,
      streak: stateRef.current.streak, level: lv,
      timeLeft: LEVEL_TIME, currentIntersection: null, intersectionProgress: 0,
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
    drawScene(ctx, [], 0, false);
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
    ctx.fillText('Intersections every 50m  |  8 DMV ROW laws', W / 2, H / 2 + 28);
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

      {/* Canvas */}
      <div className="relative w-full max-w-sm">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="w-full rounded-t-xl border-2 border-slate-600 touch-none block"
        />

        {/* HOLD button overlaid */}
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

      {/* Stats row */}
      <div className="w-full max-w-sm grid grid-cols-3 gap-1 text-center">
        {[['Score', disp.score], ['Distance', `${Math.floor(disp.distance)}m`], ['Streak', disp.streak]].map(([l, v]) => (
          <div key={l as string} className="bg-slate-800 rounded-md py-1 border border-slate-700">
            <p className="text-xs text-slate-400">{l}</p>
            <p className="text-sm font-bold text-green-400">{v}</p>
          </div>
        ))}
      </div>

      {/* ROW reference */}
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
