/**
 * Traffic Jam Runner — Reworked
 * - Left/right turns every 2 oncoming cars
 * - Time limit meter at top of canvas
 * - Compact layout: canvas → tight gap → HOLD button
 * - Official DMV right-of-way laws enforced
 */
import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const W = 340;
const H = 520;
const ROAD_LEFT = 70;
const ROAD_RIGHT = W - 70;
const ROAD_W = ROAD_RIGHT - ROAD_LEFT;
const LANE_L = ROAD_LEFT + ROAD_W * 0.27;  // oncoming left lane center
const LANE_R = ROAD_LEFT + ROAD_W * 0.73;  // oncoming right lane center
const PLAYER_X = ROAD_LEFT + ROAD_W * 0.5; // player center
const PLAYER_Y = H - 90;
const PW = 32;
const PH = 50;
const STRIPE_H = 32;
const STRIPE_GAP = 32;
const LEVEL_DISTANCE = 400; // metres to complete a level
const LEVEL_TIME = 60;       // seconds per level

// ─── Types ────────────────────────────────────────────────────────────────────
type TurnDir = 'none' | 'left' | 'right';
type LaneDir = 'down' | 'cross-left' | 'cross-right';

interface Car {
  id: number;
  x: number; y: number;
  w: number; h: number;
  speed: number;
  color: string; roofColor: string;
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
  playerAngle: number; // degrees for turn animation
  turnDir: TurnDir;
  lawText: string;
}

// ─── Vehicle definitions ──────────────────────────────────────────────────────
const MOTOR_DEFS = [
  { w: 30, h: 48, color: '#1565c0', roofColor: '#0d47a1', label: 'Sedan' },
  { w: 34, h: 54, color: '#e65100', roofColor: '#bf360c', label: 'SUV' },
  { w: 38, h: 64, color: '#6a1b9a', roofColor: '#4a148c', label: 'Truck' },
  { w: 36, h: 58, color: '#00695c', roofColor: '#004d40', label: 'Van' },
  { w: 32, h: 52, color: '#b71c1c', roofColor: '#7f0000', label: 'Pickup' },
  { w: 20, h: 36, color: '#f57f17', roofColor: '#e65100', label: 'Moto' },
];

let uid = 0;
function rndMotor() { return MOTOR_DEFS[Math.floor(Math.random() * MOTOR_DEFS.length)]; }

function makeCar(x: number, y: number, speed: number, laneDir: LaneDir, hasROW: boolean): Car {
  const d = rndMotor();
  return { id: uid++, x, y, w: d.w, h: d.h, speed, color: d.color, roofColor: d.roofColor, label: d.label, laneDir, hasROW, isPed: false, isEmergency: false };
}
function makePed(x: number, y: number, speed: number, laneDir: LaneDir): Car {
  return { id: uid++, x, y, w: 14, h: 24, speed, color: '#2e7d32', roofColor: '#1b5e20', label: '🚶', laneDir, hasROW: true, isPed: true, isEmergency: false };
}
function makeEmergency(x: number, y: number, speed: number): Car {
  return { id: uid++, x, y, w: 32, h: 52, speed, color: '#d32f2f', roofColor: '#b71c1c', label: '🚨', laneDir: 'down', hasROW: true, isPed: false, isEmergency: true };
}

// ─── Turn / Scenario system ───────────────────────────────────────────────────
// Every 2 cars the player must execute a turn. The turn type determines which
// ROW rule applies and which traffic spawns.
type TurnType = 'straight' | 'left-unprotected' | 'right-pedestrian' | 'four-way-stop' | 'emergency' | 't-intersection' | 'roundabout' | 'driveway';

interface TurnEvent {
  type: TurnType;
  dir: TurnDir;
  law: string;
  spawnROWCars: (level: number) => Car[];
}

const TURN_EVENTS: TurnEvent[] = [
  {
    type: 'straight',
    dir: 'none',
    law: 'Open road — proceed.',
    spawnROWCars: (lv) => [
      makeCar(LANE_L, -60, 120 + lv * 30, 'down', false),
      makeCar(LANE_R, -130, 110 + lv * 30, 'down', false),
    ],
  },
  {
    type: 'left-unprotected',
    dir: 'left',
    law: 'LEFT TURN: Yield to ALL oncoming straight traffic before turning.',
    spawnROWCars: (lv) => [
      makeCar(LANE_R, -50, 140 + lv * 35, 'down', true),
      makeCar(LANE_R, -160, 130 + lv * 35, 'down', true),
    ],
  },
  {
    type: 'right-pedestrian',
    dir: 'right',
    law: 'RIGHT TURN: Yield to pedestrians in the crosswalk.',
    spawnROWCars: () => [
      makePed(ROAD_LEFT - 20, PLAYER_Y - 50, 55, 'cross-left'),
      makePed(ROAD_RIGHT + 20, PLAYER_Y - 70, 55, 'cross-right'),
    ],
  },
  {
    type: 'four-way-stop',
    dir: 'none',
    law: '4-WAY STOP: Simultaneous arrival — yield to vehicle on your RIGHT.',
    spawnROWCars: (lv) => [
      makeCar(ROAD_RIGHT + 60, PLAYER_Y - 8, 90 + lv * 20, 'cross-right', true),
    ],
  },
  {
    type: 'emergency',
    dir: 'none',
    law: 'EMERGENCY VEHICLE: Always yield — pull over and stop immediately.',
    spawnROWCars: (lv) => [makeEmergency(PLAYER_X, -70, 180 + lv * 40)],
  },
  {
    type: 't-intersection',
    dir: 'none',
    law: 'T-INTERSECTION: Through-road traffic has right-of-way over entering vehicles.',
    spawnROWCars: (lv) => [
      makeCar(ROAD_LEFT - 80, PLAYER_Y - 15, 120 + lv * 30, 'cross-left', true),
      makeCar(ROAD_RIGHT + 80, PLAYER_Y - 35, 110 + lv * 30, 'cross-right', true),
    ],
  },
  {
    type: 'roundabout',
    dir: 'left',
    law: 'ROUNDABOUT: Yield to all vehicles already circulating inside.',
    spawnROWCars: (lv) => [
      makeCar(PLAYER_X - 20, PLAYER_Y - 70, 100 + lv * 25, 'cross-right', true),
    ],
  },
  {
    type: 'driveway',
    dir: 'right',
    law: 'DRIVEWAY EXIT: Yield to ALL road traffic and pedestrians.',
    spawnROWCars: (lv) => [
      makeCar(LANE_L, -40, 130 + lv * 30, 'down', true),
      makeCar(LANE_R, -90, 120 + lv * 30, 'down', true),
    ],
  },
];

// ─── Drawing helpers ──────────────────────────────────────────────────────────
function drawRoad(ctx: CanvasRenderingContext2D, stripeOff: number, turnDir: TurnDir, lawText: string) {
  // Sky / grass
  ctx.fillStyle = '#c8e6c9';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#66bb6a';
  ctx.fillRect(0, 0, ROAD_LEFT, H);
  ctx.fillRect(ROAD_RIGHT, 0, W - ROAD_RIGHT, H);

  // Road
  ctx.fillStyle = '#37474f';
  ctx.fillRect(ROAD_LEFT, 0, ROAD_W, H);

  // Edge lines
  ctx.strokeStyle = '#eceff1';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(ROAD_LEFT, 0); ctx.lineTo(ROAD_LEFT, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ROAD_RIGHT, 0); ctx.lineTo(ROAD_RIGHT, H); ctx.stroke();

  // Scrolling center dashes
  ctx.strokeStyle = '#ffd54f';
  ctx.lineWidth = 2;
  ctx.setLineDash([STRIPE_H, STRIPE_GAP]);
  ctx.lineDashOffset = -stripeOff;
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  ctx.setLineDash([]);

  // Turn arrow on road
  if (turnDir !== 'none') {
    const ax = PLAYER_X;
    const ay = PLAYER_Y - 75;
    ctx.save();
    ctx.translate(ax, ay);
    if (turnDir === 'left') ctx.rotate(-Math.PI / 2);
    else ctx.rotate(Math.PI / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(0, -18); ctx.lineTo(10, 0); ctx.lineTo(4, 0);
    ctx.lineTo(4, 18); ctx.lineTo(-4, 18); ctx.lineTo(-4, 0);
    ctx.lineTo(-10, 0); ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Stop line
  if (lawText && !lawText.startsWith('Open')) {
    ctx.strokeStyle = '#ef5350';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ROAD_LEFT, PLAYER_Y - 62); ctx.lineTo(ROAD_RIGHT, PLAYER_Y - 62); ctx.stroke();
  }

  // Crosswalk stripes for pedestrian scenarios
  if (lawText.includes('pedestrian') || lawText.includes('DRIVEWAY')) {
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    for (let i = 0; i < 5; i++) ctx.fillRect(ROAD_LEFT, PLAYER_Y - 58 + i * 9, ROAD_W, 5);
  }
}

function drawCar(ctx: CanvasRenderingContext2D, car: Car) {
  ctx.save();
  ctx.translate(car.x, car.y);
  if (car.laneDir === 'cross-left') ctx.rotate(Math.PI / 2);
  else if (car.laneDir === 'cross-right') ctx.rotate(-Math.PI / 2);

  const hw = car.w / 2, hh = car.h / 2;

  if (car.isPed) {
    ctx.fillStyle = car.color;
    ctx.beginPath(); ctx.arc(0, -hh + 4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-2.5, -hh + 8, 5, 10);
    ctx.fillRect(-5, -hh + 18, 4, 7);
    ctx.fillRect(1, -hh + 18, 4, 7);
    ctx.restore();
    // ROW badge
    ctx.save();
    ctx.translate(car.x + 10, car.y - 10);
    ctx.fillStyle = '#d32f2f';
    ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 5px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ROW', 0, 2);
    ctx.restore();
    return;
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(2, hh + 3, hw * 0.85, 4, 0, 0, Math.PI * 2); ctx.fill();

  // Body
  ctx.fillStyle = car.color;
  ctx.beginPath(); ctx.roundRect(-hw, -hh, car.w, car.h, 5); ctx.fill();

  // Roof
  ctx.fillStyle = car.roofColor;
  ctx.beginPath(); ctx.roundRect(-hw + 4, -hh + car.h * 0.2, car.w - 8, car.h * 0.38, 3); ctx.fill();

  // Windshield
  ctx.fillStyle = 'rgba(144,202,249,0.7)';
  ctx.beginPath(); ctx.roundRect(-hw + 3, -hh + 3, car.w - 6, 10, 2); ctx.fill();

  // Headlights
  ctx.fillStyle = car.isEmergency ? (Date.now() % 300 < 150 ? '#2196f3' : '#f44336') : '#fffde7';
  ctx.beginPath(); ctx.roundRect(-hw + 2, -hh + 2, 6, 4, 1); ctx.fill();
  ctx.beginPath(); ctx.roundRect(hw - 8, -hh + 2, 6, 4, 1); ctx.fill();

  // Taillights
  ctx.fillStyle = '#ef5350';
  ctx.beginPath(); ctx.roundRect(-hw + 2, hh - 6, 6, 4, 1); ctx.fill();
  ctx.beginPath(); ctx.roundRect(hw - 8, hh - 6, 6, 4, 1); ctx.fill();

  // ROW badge
  if (car.hasROW) {
    ctx.fillStyle = '#d32f2f';
    ctx.beginPath(); ctx.arc(hw - 1, -hh - 1, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 5.5px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ROW', hw - 1, -hh + 2);
  }

  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.font = 'bold 7px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(car.label, 0, 3);

  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, angle: number, isMoving: boolean, crashed: boolean) {
  ctx.save();
  ctx.translate(PLAYER_X, PLAYER_Y);
  ctx.rotate((angle * Math.PI) / 180);

  const hw = PW / 2, hh = PH / 2;
  const body = crashed ? '#c62828' : isMoving ? '#2e7d32' : '#43a047';
  const roof = crashed ? '#7f0000' : '#1b5e20';

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(2, hh + 3, hw * 0.85, 4, 0, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = body;
  ctx.beginPath(); ctx.roundRect(-hw, -hh, PW, PH, 5); ctx.fill();

  ctx.fillStyle = roof;
  ctx.beginPath(); ctx.roundRect(-hw + 4, -hh + PH * 0.2, PW - 8, PH * 0.38, 3); ctx.fill();

  ctx.fillStyle = 'rgba(144,202,249,0.8)';
  ctx.beginPath(); ctx.roundRect(-hw + 3, -hh + 3, PW - 6, 10, 2); ctx.fill();

  ctx.fillStyle = '#fffde7';
  ctx.beginPath(); ctx.roundRect(-hw + 2, -hh + 2, 6, 4, 1); ctx.fill();
  ctx.beginPath(); ctx.roundRect(hw - 8, -hh + 2, 6, 4, 1); ctx.fill();

  ctx.fillStyle = '#ef5350';
  ctx.beginPath(); ctx.roundRect(-hw + 2, hh - 6, 6, 4, 1); ctx.fill();
  ctx.beginPath(); ctx.roundRect(hw - 8, hh - 6, 6, 4, 1); ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = 'bold 7px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('YOU', 0, 3);

  ctx.restore();

  if (crashed) {
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('💥', PLAYER_X, PLAYER_Y - hh - 12);
  }
}

function drawHUD(
  ctx: CanvasRenderingContext2D,
  score: number, distance: number,
  timeLeft: number, hasROW: boolean,
  turnDir: TurnDir, lawText: string
) {
  // ── Top bar: time meter + score ──────────────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, W, 34);

  // Time meter (left side)
  const meterW = 110;
  const meterX = 8;
  const meterY = 8;
  const meterH = 14;
  const pct = Math.max(0, timeLeft / LEVEL_TIME);
  const meterColor = pct > 0.5 ? '#66bb6a' : pct > 0.25 ? '#ffd54f' : '#ef5350';
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath(); ctx.roundRect(meterX, meterY, meterW, meterH, 3); ctx.fill();
  ctx.fillStyle = meterColor;
  ctx.beginPath(); ctx.roundRect(meterX, meterY, meterW * pct, meterH, 3); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(meterX, meterY, meterW, meterH, 3); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 9px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`⏱ ${Math.ceil(timeLeft)}s`, meterX + 2, meterY + 11);

  // Score (center)
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.floor(distance)}m`, W / 2, 22);

  // Streak (right)
  ctx.textAlign = 'right';
  ctx.font = 'bold 10px Arial';
  ctx.fillText(`Pts: ${score}`, W - 8, 22);

  // ── Turn indicator strip ─────────────────────────────────────────────────
  if (turnDir !== 'none') {
    ctx.fillStyle = 'rgba(255,193,7,0.88)';
    ctx.fillRect(0, 34, W, 18);
    ctx.fillStyle = '#212121';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    const arrow = turnDir === 'left' ? '← TURN LEFT' : '→ TURN RIGHT';
    ctx.fillText(arrow, W / 2, 47);
  }

  // ── ROW bar at bottom of canvas ──────────────────────────────────────────
  const rowColor = hasROW ? '#2e7d32' : '#c62828';
  ctx.fillStyle = rowColor;
  ctx.fillRect(ROAD_LEFT, H - 36, ROAD_W, 28);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(hasROW ? '✓ GO — YOU HAVE ROW' : '✗ YIELD — RELEASE NOW', W / 2, H - 17);

  // ── Law text strip ───────────────────────────────────────────────────────
  if (lawText && !lawText.startsWith('Open')) {
    ctx.fillStyle = 'rgba(21,21,21,0.78)';
    ctx.fillRect(0, 34 + (turnDir !== 'none' ? 18 : 0), W, 26);
    ctx.fillStyle = '#ffd54f';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    // Truncate to one line
    const maxW = W - 16;
    let text = lawText;
    while (ctx.measureText(text).width > maxW && text.length > 10) text = text.slice(0, -4) + '…';
    ctx.fillText(text, W / 2, 34 + (turnDir !== 'none' ? 18 : 0) + 17);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props { onScoreUpdate?: (s: number) => void; }

export default function TrafficRunnerGame({ onScoreUpdate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>({
    phase: 'idle', score: 0, distance: 0, streak: 0, level: 0,
    timeLeft: LEVEL_TIME, playerAngle: 0, turnDir: 'none', lawText: '',
  });
  const carsRef = useRef<Car[]>([]);
  const stripeRef = useRef(0);
  const movingRef = useRef(false);
  const lastTRef = useRef(0);
  const rafRef = useRef(0);
  const carCountRef = useRef(0);       // cars spawned since last turn event
  const turnQueueRef = useRef<TurnEvent[]>([]);
  const activeTurnRef = useRef<TurnEvent | null>(null);
  const nextSpawnRef = useRef(0);      // ms until next car spawn
  const [disp, setDisp] = useState({ ...stateRef.current });
  const [levelIdx, setLevelIdx] = useState(0);
  const LEVEL_NAMES = ['Suburban Streets', 'Downtown Grid', 'Highway Approach'];

  // ── ROW check ────────────────────────────────────────────────────────────────
  const computeROW = useCallback((cars: Car[]): boolean => {
    const dangerTop = PLAYER_Y - PH / 2 - 160;
    const dangerBot = PLAYER_Y + PH / 2 + 20;
    for (const car of cars) {
      if (!car.hasROW) continue;
      if (car.laneDir === 'cross-left') {
        if (car.x < ROAD_RIGHT + 50 && car.x > ROAD_LEFT - 50 && car.y > dangerTop && car.y < dangerBot) return false;
        continue;
      }
      if (car.laneDir === 'cross-right') {
        if (car.x > ROAD_LEFT - 50 && car.x < ROAD_RIGHT + 50 && car.y > dangerTop && car.y < dangerBot) return false;
        continue;
      }
      // down
      if (car.y - car.h / 2 < dangerBot && car.y + car.h / 2 > dangerTop) return false;
    }
    return true;
  }, []);

  // ── Collision ────────────────────────────────────────────────────────────────
  const checkCollision = useCallback((cars: Car[]): boolean => {
    const px = PLAYER_X - PW / 2, py = PLAYER_Y - PH / 2;
    for (const car of cars) {
      const cx = car.x - car.w / 2, cy = car.y - car.h / 2;
      if (px < cx + car.w && px + PW > cx && py < cy + car.h && py + PH > cy) return true;
    }
    return false;
  }, []);

  // ── Build shuffled turn queue ─────────────────────────────────────────────────
  function buildQueue(): TurnEvent[] {
    const pool = [...TURN_EVENTS];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  }

  // ── Game loop ─────────────────────────────────────────────────────────────────
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

    // ── Scroll road ──────────────────────────────────────────────────────────
    if (moving) stripeRef.current = (stripeRef.current + 160 * dt) % (STRIPE_H + STRIPE_GAP);

    // ── Move cars ────────────────────────────────────────────────────────────
    for (const car of carsRef.current) {
      if (car.laneDir === 'cross-left') car.x += car.speed * dt;
      else if (car.laneDir === 'cross-right') car.x -= car.speed * dt;
      else car.y += car.speed * dt;
    }
    carsRef.current = carsRef.current.filter(c => {
      if (c.laneDir === 'cross-left') return c.x < W + 80;
      if (c.laneDir === 'cross-right') return c.x > -80;
      return c.y - c.h / 2 < H + 60;
    });

    // ── Spawn cars (every 2 cars → trigger turn event) ───────────────────────
    nextSpawnRef.current -= dt * 1000;
    if (nextSpawnRef.current <= 0) {
      carCountRef.current++;
      const interval = Math.max(800, 2200 - lv * 400);
      nextSpawnRef.current = interval;

      if (carCountRef.current % 2 === 0) {
        // Every 2nd car → trigger next turn event
        if (turnQueueRef.current.length === 0) turnQueueRef.current = buildQueue();
        activeTurnRef.current = turnQueueRef.current.shift()!;
        const newCars = activeTurnRef.current.spawnROWCars(lv);
        carsRef.current.push(...newCars);
        stateRef.current = {
          ...stateRef.current,
          turnDir: activeTurnRef.current.dir,
          lawText: activeTurnRef.current.law,
        };
      } else {
        // Normal oncoming car (no ROW conflict)
        const lane = Math.random() < 0.5 ? LANE_L : LANE_R;
        carsRef.current.push(makeCar(lane, -60, baseSpeed * (0.8 + Math.random() * 0.4), 'down', false));
        if (activeTurnRef.current === null || activeTurnRef.current.type === 'straight') {
          stateRef.current = { ...stateRef.current, turnDir: 'none', lawText: 'Open road — proceed.' };
        }
      }
    }

    // ── Player turn angle animation ──────────────────────────────────────────
    const targetAngle = s.turnDir === 'left' ? -18 : s.turnDir === 'right' ? 18 : 0;
    const newAngle = s.playerAngle + (targetAngle - s.playerAngle) * 8 * dt;

    // ── ROW & distance ───────────────────────────────────────────────────────
    const hasROW = computeROW(carsRef.current);
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
    if (checkCollision(carsRef.current)) {
      stateRef.current = { ...s, phase: 'crashed', score: newScore, distance: newDist, playerAngle: newAngle };
      setDisp({ ...stateRef.current });
      renderFrame(ctx, false, true, hasROW, stateRef.current);
      onScoreUpdate?.(newScore);
      return;
    }
    if (moving && !hasROW) {
      stateRef.current = { ...s, phase: 'crashed', score: newScore, distance: newDist, playerAngle: newAngle };
      setDisp({ ...stateRef.current });
      renderFrame(ctx, moving, true, hasROW, stateRef.current);
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

    stateRef.current = { ...s, score: newScore, distance: newDist, timeLeft: newTime, playerAngle: newAngle };
    renderFrame(ctx, moving, false, hasROW, stateRef.current);
    if (ts % 100 < 20) setDisp({ ...stateRef.current });

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [checkCollision, computeROW, onScoreUpdate]);

  function renderFrame(ctx: CanvasRenderingContext2D, moving: boolean, crashed: boolean, hasROW: boolean, s: GameState) {
    drawRoad(ctx, stripeRef.current, s.turnDir, s.lawText);
    for (const car of carsRef.current) drawCar(ctx, car);
    drawPlayer(ctx, s.playerAngle, moving, crashed);
    drawHUD(ctx, s.score, s.distance, s.timeLeft, hasROW, s.turnDir, s.lawText);

    if (crashed) {
      ctx.fillStyle = 'rgba(183,28,28,0.52)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CRASH!', W / 2, H / 2 - 20);
      ctx.font = '11px Arial';
      const words = s.lawText.split(' ');
      let line = '', ly = H / 2 + 8;
      for (const w of words) {
        const t = line + w + ' ';
        if (ctx.measureText(t).width > W - 28) { ctx.fillText(line.trim(), W / 2, ly); line = w + ' '; ly += 14; }
        else line = t;
      }
      if (line) ctx.fillText(line.trim(), W / 2, ly);
    }

    if (s.phase === 'timeout') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffd54f';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TIME\'S UP!', W / 2, H / 2 - 16);
      ctx.fillStyle = '#fff';
      ctx.font = '13px Arial';
      ctx.fillText(`You drove ${Math.floor(s.distance)}m`, W / 2, H / 2 + 12);
    }
  }

  // ── Start game ────────────────────────────────────────────────────────────────
  const startGame = useCallback((lv: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    carsRef.current = [];
    stripeRef.current = 0;
    movingRef.current = false;
    carCountRef.current = 0;
    nextSpawnRef.current = 800;
    turnQueueRef.current = buildQueue();
    activeTurnRef.current = null;
    const ns: GameState = {
      phase: 'playing', score: 0, distance: 0,
      streak: stateRef.current.streak, level: lv,
      timeLeft: LEVEL_TIME, playerAngle: 0, turnDir: 'none', lawText: 'Open road — proceed.',
    };
    stateRef.current = ns;
    setDisp(ns);
    lastTRef.current = performance.now();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  // ── Input ─────────────────────────────────────────────────────────────────────
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

  // Draw idle screen
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawRoad(ctx, 0, 'none', '');
    drawPlayer(ctx, 0, false, false);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, H / 2 - 66, W, 110);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Traffic Jam Runner', W / 2, H / 2 - 34);
    ctx.font = '11px Arial';
    ctx.fillText('Hold button to drive forward', W / 2, H / 2 - 10);
    ctx.fillText('Release when you DON\'T have right of way', W / 2, H / 2 + 10);
    ctx.fillStyle = '#ffd54f';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('← → Turns every 2 cars | 8 DMV ROW laws', W / 2, H / 2 + 30);
    ctx.fillStyle = '#ef9a9a';
    ctx.font = '9px Arial';
    ctx.fillText('🔴 ROW badge = that vehicle has right of way', W / 2, H / 2 + 46);
  }, []);

  const phase = disp.phase;

  return (
    <div className="w-full flex flex-col items-center gap-1.5 select-none">
      {/* Level selector */}
      <div className="w-full flex items-center justify-between bg-green-600 text-white rounded-lg px-3 py-1.5">
        <button onClick={() => setLevelIdx(i => Math.max(0, i - 1))} className="font-bold text-xl px-2 disabled:opacity-40" disabled={levelIdx === 0}>‹</button>
        <div className="text-center">
          <p className="font-bold text-xs">{LEVEL_NAMES[levelIdx]}</p>
          <p className="text-xs opacity-75">Lv {levelIdx + 1} / {LEVEL_NAMES.length}</p>
        </div>
        <button onClick={() => setLevelIdx(i => Math.min(LEVEL_NAMES.length - 1, i + 1))} className="font-bold text-xl px-2 disabled:opacity-40" disabled={levelIdx === LEVEL_NAMES.length - 1}>›</button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full max-w-sm rounded-xl border-4 border-green-500 shadow-xl touch-none"
      />

      {/* Stats row — compact */}
      <div className="w-full max-w-sm grid grid-cols-3 gap-1.5 text-center">
        {[['Score', disp.score], ['Distance', `${Math.floor(disp.distance)}m`], ['Streak', disp.streak]].map(([l, v]) => (
          <div key={l as string} className="bg-white rounded-md py-1 shadow-sm border border-green-100">
            <p className="text-xs text-gray-400">{l}</p>
            <p className="text-base font-bold text-green-600">{v}</p>
          </div>
        ))}
      </div>

      {/* Status */}
      <div className={`w-full max-w-sm rounded-lg px-3 py-1.5 text-xs font-semibold text-center
        ${phase === 'crashed' ? 'bg-red-100 text-red-700 border border-red-300'
          : phase === 'levelComplete' ? 'bg-green-100 text-green-700 border border-green-300'
          : phase === 'timeout' ? 'bg-amber-100 text-amber-700 border border-amber-300'
          : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
        {phase === 'idle' && 'Press Start — turns every 2 cars with 8 official DMV ROW laws!'}
        {phase === 'playing' && (disp.turnDir !== 'none' ? `⚠ ${disp.turnDir === 'left' ? '← Left turn' : '→ Right turn'} — check ROW!` : 'Hold to drive. Release when you must yield!')}
        {phase === 'crashed' && '💥 Crash! You moved without right of way.'}
        {phase === 'levelComplete' && `✅ Level done! ${Math.floor(disp.distance)}m driven.`}
        {phase === 'timeout' && `⏱ Time\'s up! You drove ${Math.floor(disp.distance)}m.`}
      </div>

      {/* Control button — tight to canvas */}
      <div className="w-full max-w-sm">
        {phase !== 'playing' ? (
          <div className="flex gap-2">
            <button
              onClick={() => startGame(levelIdx)}
              className="flex-1 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold py-3 rounded-xl shadow-md transition-all text-sm"
            >
              {phase === 'crashed' || phase === 'timeout' ? '🔄 Retry' : phase === 'levelComplete' ? '▶ Play Again' : '▶ Start'}
            </button>
            {phase === 'levelComplete' && levelIdx < LEVEL_NAMES.length - 1 && (
              <button
                onClick={() => { const n = levelIdx + 1; setLevelIdx(n); startGame(n); }}
                className="flex-1 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold py-3 rounded-xl shadow-md transition-all text-sm"
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
            className="w-full bg-blue-600 active:bg-blue-900 text-white font-extrabold py-4 rounded-xl shadow-xl text-lg transition-colors duration-75 touch-none"
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          >🚗 HOLD TO DRIVE</button>
        )}
      </div>

      {/* Compact ROW reference */}
      <div className="w-full max-w-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs text-amber-900">
        <p className="font-bold mb-0.5">DMV Right-of-Way Laws:</p>
        <div className="grid grid-cols-2 gap-x-2">
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
