/**
 * Traffic Jam Runner — Real Intersection Mechanics
 * - Player drives forward on main road
 * - Every 50 meters: intersection appears with cross-traffic
 * - Player must turn left or right to navigate intersection
 * - Cross-traffic spawns from perpendicular roads
 * - Collision only happens if player moves into intersection without right-of-way
 * - 8 DMV scenarios with exact right-of-way rules
 */
import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const W = 340;
const H = 560;
const ROAD_W = 200;
const ROAD_H = 200;
const LEVEL_TIME = 60;
const INTERSECTION_INTERVAL = 50; // meters between intersections

// ─── Types ────────────────────────────────────────────────────────────────────
interface Car {
  id: number;
  x: number; y: number;
  w: number; h: number;
  speed: number;
  color: string; roofColor: string; windowColor: string;
  label: string;
  hasROW: boolean;
  isPed: boolean;
  isEmergency: boolean;
  direction: 'up' | 'down' | 'left' | 'right'; // direction of travel
}

interface Intersection {
  id: number;
  distanceMeters: number;
  scenario: Scenario;
  turnDir: 'left' | 'right';
  crossTraffic: Car[];
  playerHasROW: boolean;
}

interface Scenario {
  title: string;
  law: string;
  description: string;
  spawnCrossTraffic: () => Car[];
}

interface GameState {
  phase: 'idle' | 'playing' | 'crashed' | 'levelComplete' | 'timeout';
  score: number;
  distance: number;
  streak: number;
  level: number;
  timeLeft: number;
  currentIntersection: Intersection | null;
  intersectionVisible: boolean; // is intersection on screen?
  playerTurning: 'none' | 'left' | 'right'; // player's turn input
}

// ─── Vehicle defs ─────────────────────────────────────────────────────────────
const MOTOR_DEFS = [
  { w: 28, h: 46, color: '#1e3a5f', roofColor: '#0d2137', windowColor: '#5bc8f5', label: 'Sedan' },
  { w: 32, h: 52, color: '#7c2d12', roofColor: '#431407', windowColor: '#fb923c', label: 'SUV' },
  { w: 36, h: 62, color: '#3b0764', roofColor: '#1e0338', windowColor: '#c084fc', label: 'Truck' },
  { w: 34, h: 56, color: '#064e3b', roofColor: '#022c22', windowColor: '#34d399', label: 'Van' },
];

let uid = 0;
function rnd<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function makeCar(x: number, y: number, speed: number, direction: 'up' | 'down' | 'left' | 'right', hasROW: boolean): Car {
  const d = rnd(MOTOR_DEFS);
  return { id: uid++, x, y, w: d.w, h: d.h, speed, color: d.color, roofColor: d.roofColor, windowColor: d.windowColor, label: d.label, hasROW, isPed: false, isEmergency: false, direction };
}

function makePed(x: number, y: number, speed: number, direction: 'up' | 'down' | 'left' | 'right'): Car {
  return { id: uid++, x, y, w: 12, h: 22, speed, color: '#166534', roofColor: '#14532d', windowColor: '#86efac', label: '🚶', hasROW: true, isPed: true, isEmergency: false, direction };
}

function makeEmergency(x: number, y: number, speed: number, direction: 'up' | 'down' | 'left' | 'right'): Car {
  return { id: uid++, x, y, w: 30, h: 50, speed, color: '#7f1d1d', roofColor: '#450a0a', windowColor: '#fca5a5', label: '🚨', hasROW: true, isPed: false, isEmergency: true, direction };
}

// ─── DMV Scenarios ────────────────────────────────────────────────────────────
const SCENARIOS: Scenario[] = [
  {
    title: 'Unprotected Left Turn',
    law: 'Yield to ALL oncoming straight traffic before turning left.',
    description: 'Turn left. Oncoming cars have ROW.',
    spawnCrossTraffic: () => [
      makeCar(W / 2 + 80, H / 2 - 60, 140, 'up', true),
      makeCar(W / 2 + 80, H / 2 - 160, 120, 'up', true),
    ],
  },
  {
    title: 'Right Turn — Pedestrian',
    law: 'Yield to pedestrians in the crosswalk before turning right.',
    description: 'Turn right. Pedestrians crossing have ROW.',
    spawnCrossTraffic: () => [
      makePed(W / 2 - 40, H / 2 - 80, 55, 'right'),
      makePed(W / 2 + 40, H / 2 + 80, 55, 'left'),
    ],
  },
  {
    title: '4-Way Stop',
    law: 'Simultaneous arrival — yield to the vehicle on your RIGHT.',
    description: 'All vehicles arrived at same time. Yield to right.',
    spawnCrossTraffic: () => [
      makeCar(W / 2 + 100, H / 2, 90, 'left', true),
    ],
  },
  {
    title: 'Emergency Vehicle',
    law: 'Always yield to emergency vehicles — pull over and stop.',
    description: 'Emergency vehicle approaching. Must yield.',
    spawnCrossTraffic: () => [
      makeEmergency(W / 2, H / 2 - 120, 180, 'down'),
    ],
  },
  {
    title: 'T-Intersection',
    law: 'Through-road traffic has right-of-way over entering vehicles.',
    description: 'You are on main road. Side traffic must yield.',
    spawnCrossTraffic: () => [
      makeCar(W / 2 - 120, H / 2, 120, 'right', true),
      makeCar(W / 2 + 120, H / 2, 110, 'left', true),
    ],
  },
  {
    title: 'Roundabout Entry',
    law: 'Yield to all vehicles already circulating inside the roundabout.',
    description: 'Traffic inside roundabout has ROW.',
    spawnCrossTraffic: () => [
      makeCar(W / 2 - 40, H / 2 - 80, 100, 'down', true),
    ],
  },
  {
    title: 'Driveway Exit',
    law: 'Yield to ALL road traffic and pedestrians when exiting a driveway.',
    description: 'You are exiting. All road traffic has ROW.',
    spawnCrossTraffic: () => [
      makeCar(W / 2 - 80, H / 2 - 40, 130, 'down', true),
      makeCar(W / 2 + 80, H / 2 - 40, 120, 'down', true),
    ],
  },
  {
    title: 'Green Light Left Turn',
    law: 'Green light does NOT give left-turners priority. Yield to oncoming straight traffic.',
    description: 'Turning left on green. Oncoming straight traffic has ROW.',
    spawnCrossTraffic: () => [
      makeCar(W / 2 + 90, H / 2 - 50, 150, 'up', true),
      makeCar(W / 2 + 90, H / 2 - 140, 140, 'up', true),
    ],
  },
];

// ─── Drawing ──────────────────────────────────────────────────────────────────
function drawRoad(ctx: CanvasRenderingContext2D, offsetY: number) {
  // Background
  ctx.fillStyle = '#14532d';
  ctx.fillRect(0, 0, W, H);

  // Main road (vertical)
  ctx.fillStyle = '#1c2526';
  ctx.fillRect(W / 2 - ROAD_W / 2, 0, ROAD_W, H);

  // Road texture
  ctx.fillStyle = 'rgba(255,255,255,0.015)';
  for (let y = 0; y < H; y += 8) {
    ctx.fillRect(W / 2 - ROAD_W / 2, y, ROAD_W, 3);
  }

  // Center dashes
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([30, 30]);
  ctx.lineDashOffset = -offsetY;
  ctx.beginPath();
  ctx.moveTo(W / 2, 0);
  ctx.lineTo(W / 2, H);
  ctx.stroke();
  ctx.setLineDash([]);

  // Edge lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - ROAD_W / 2 + 8, 0);
  ctx.lineTo(W / 2 - ROAD_W / 2 + 8, H);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W / 2 + ROAD_W / 2 - 8, 0);
  ctx.lineTo(W / 2 + ROAD_W / 2 - 8, H);
  ctx.stroke();

  // Rumble strips
  const rumbleW = 8;
  for (let y = 0; y < H; y += 20) {
    ctx.fillStyle = y % 40 < 20 ? '#fbbf24' : '#1c2526';
    ctx.fillRect(W / 2 - ROAD_W / 2, y, rumbleW, 20);
    ctx.fillRect(W / 2 + ROAD_W / 2 - rumbleW, y, rumbleW, 20);
  }
}

function drawIntersection(ctx: CanvasRenderingContext2D, progress: number) {
  // progress: 0 = intersection at bottom of screen, 1 = at top
  const intersectionY = H - progress * (H + ROAD_H);

  // Cross road (horizontal)
  ctx.fillStyle = '#1c2526';
  ctx.fillRect(0, intersectionY - ROAD_H / 2, W, ROAD_H);

  // Cross road texture
  ctx.fillStyle = 'rgba(255,255,255,0.015)';
  for (let x = 0; x < W; x += 8) {
    ctx.fillRect(x, intersectionY - ROAD_H / 2, 3, ROAD_H);
  }

  // Cross road center dashes
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([30, 30]);
  ctx.beginPath();
  ctx.moveTo(0, intersectionY);
  ctx.lineTo(W, intersectionY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Cross road edge lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, intersectionY - ROAD_H / 2 + 8);
  ctx.lineTo(W, intersectionY - ROAD_H / 2 + 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, intersectionY + ROAD_H / 2 - 8);
  ctx.lineTo(W, intersectionY + ROAD_H / 2 - 8);
  ctx.stroke();

  // Intersection box (highlight)
  ctx.strokeStyle = 'rgba(251,191,36,0.3)';
  ctx.lineWidth = 3;
  ctx.strokeRect(W / 2 - ROAD_W / 2, intersectionY - ROAD_H / 2, ROAD_W, ROAD_H);
}

function drawCar(ctx: CanvasRenderingContext2D, car: Car) {
  ctx.save();
  ctx.translate(car.x, car.y);

  // Rotate based on direction
  if (car.direction === 'left') ctx.rotate(Math.PI);
  else if (car.direction === 'right') ctx.rotate(0);
  else if (car.direction === 'down') ctx.rotate(Math.PI / 2);
  else if (car.direction === 'up') ctx.rotate(-Math.PI / 2);

  const hw = car.w / 2, hh = car.h / 2;

  if (car.isPed) {
    ctx.fillStyle = '#bbf7d0';
    ctx.beginPath();
    ctx.arc(0, -hh + 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = car.color;
    ctx.fillRect(-2.5, -hh + 8, 5, 10);
    ctx.fillRect(-5, -hh + 18, 4, 7);
    ctx.fillRect(1, -hh + 18, 4, 7);
    ctx.restore();
    if (car.hasROW) {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(car.x + 10, car.y - 10, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 5.5px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('ROW', car.x + 10, car.y - 8);
    }
    return;
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(3, hh + 4, hw * 0.8, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = car.color;
  ctx.beginPath();
  ctx.moveTo(-hw + 6, -hh);
  ctx.lineTo(hw - 6, -hh);
  ctx.quadraticCurveTo(hw, -hh, hw, -hh + 6);
  ctx.lineTo(hw, hh - 6);
  ctx.quadraticCurveTo(hw, hh, hw - 6, hh);
  ctx.lineTo(-hw + 6, hh);
  ctx.quadraticCurveTo(-hw, hh, -hw, hh - 6);
  ctx.lineTo(-hw, -hh + 6);
  ctx.quadraticCurveTo(-hw, -hh, -hw + 6, -hh);
  ctx.fill();

  // Roof
  ctx.fillStyle = car.roofColor;
  ctx.beginPath();
  ctx.moveTo(-hw + 4, -hh + car.h * 0.22);
  ctx.lineTo(hw - 4, -hh + car.h * 0.22);
  ctx.lineTo(hw - 4, -hh + car.h * 0.58);
  ctx.lineTo(-hw + 4, -hh + car.h * 0.58);
  ctx.fill();

  // Windshield
  ctx.fillStyle = car.windowColor;
  ctx.globalAlpha = 0.7;
  ctx.fillRect(-hw + 3, -hh + 3, car.w - 6, 10);
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
  ctx.fillRect(-hw + 2, -hh + 2, 6, 4);
  ctx.fillRect(hw - 8, -hh + 2, 6, 4);
  ctx.shadowBlur = 0;

  // Taillights
  ctx.fillStyle = '#ef4444';
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 5;
  ctx.fillRect(-hw + 2, hh - 6, 6, 4);
  ctx.fillRect(hw - 8, hh - 6, 6, 4);
  ctx.shadowBlur = 0;

  ctx.restore();

  // ROW badge
  if (car.hasROW) {
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(car.x + 10, car.y - 10, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 5.5px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ROW', car.x + 10, car.y - 8);
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, turning: 'none' | 'left' | 'right', crashed: boolean) {
  const px = W / 2;
  const py = H - 80;
  const pw = 32;
  const ph = 50;
  const hw = pw / 2, hh = ph / 2;

  ctx.save();
  ctx.translate(px, py);

  // Tilt based on turning
  if (turning === 'left') ctx.rotate(-0.15);
  else if (turning === 'right') ctx.rotate(0.15);

  const body = crashed ? '#7f1d1d' : '#14532d';
  const roof = crashed ? '#450a0a' : '#052e16';
  const win = crashed ? '#fca5a5' : '#86efac';

  ctx.shadowColor = crashed ? '#ef4444' : '#22c55e';
  ctx.shadowBlur = crashed ? 20 : 12;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(3, hh + 4, hw * 0.8, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-hw + 6, -hh);
  ctx.lineTo(hw - 6, -hh);
  ctx.quadraticCurveTo(hw, -hh, hw, -hh + 6);
  ctx.lineTo(hw, hh - 6);
  ctx.quadraticCurveTo(hw, hh, hw - 6, hh);
  ctx.lineTo(-hw + 6, hh);
  ctx.quadraticCurveTo(-hw, hh, -hw, hh - 6);
  ctx.lineTo(-hw, -hh + 6);
  ctx.quadraticCurveTo(-hw, -hh, -hw + 6, -hh);
  ctx.fill();

  // Roof
  ctx.fillStyle = roof;
  ctx.fillRect(-hw + 4, -hh + ph * 0.22, pw - 8, ph * 0.36);

  // Windshield
  ctx.fillStyle = win;
  ctx.globalAlpha = 0.75;
  ctx.fillRect(-hw + 3, -hh + 3, pw - 6, 10);
  ctx.globalAlpha = 1;

  // Headlights
  ctx.fillStyle = '#fef9c3';
  ctx.shadowColor = '#fef9c3';
  ctx.shadowBlur = 8;
  ctx.fillRect(-hw + 2, -hh + 2, 6, 4);
  ctx.fillRect(hw - 8, -hh + 2, 6, 4);
  ctx.shadowBlur = 0;

  // Taillights
  ctx.fillStyle = '#ef4444';
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 6;
  ctx.fillRect(-hw + 2, hh - 6, 6, 4);
  ctx.fillRect(hw - 8, hh - 6, 6, 4);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 7px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('YOU', 0, 3);

  if (crashed) {
    ctx.font = 'bold 22px Arial';
    ctx.fillText('💥', 0, -hh - 14);
  }

  ctx.restore();
}

function drawHUD(ctx: CanvasRenderingContext2D, score: number, distance: number, timeLeft: number, scenario: Scenario | null) {
  // Top HUD bar
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, W, 38);

  // Time meter
  const mW = 100, mX = 8, mY = 10, mH = 16;
  const pct = Math.max(0, timeLeft / LEVEL_TIME);
  const mColor = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#fbbf24' : '#ef4444';
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(mX, mY, mW, mH);
  ctx.fillStyle = mColor;
  ctx.shadowColor = mColor;
  ctx.shadowBlur = 6;
  ctx.fillRect(mX, mY, mW * pct, mH);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(mX, mY, mW, mH);
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

  // Scenario info
  if (scenario) {
    ctx.fillStyle = 'rgba(15,23,42,0.85)';
    ctx.fillRect(0, 38, W, 28);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`⚠ ${scenario.title}`, W / 2, 50);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px Arial';
    let t = scenario.law;
    while (ctx.measureText(t).width > W - 16 && t.length > 10) t = t.slice(0, -4) + '…';
    ctx.fillText(t, W / 2, 62);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props { onScoreUpdate?: (s: number) => void; }

export default function TrafficRunnerGame({ onScoreUpdate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>({
    phase: 'idle', score: 0, distance: 0, streak: 0, level: 0,
    timeLeft: LEVEL_TIME, currentIntersection: null, intersectionVisible: false, playerTurning: 'none',
  });
  const carsRef = useRef<Car[]>([]);
  const roadOffsetRef = useRef(0);
  const lastTRef = useRef(0);
  const rafRef = useRef(0);
  const nextIntersectionRef = useRef(INTERSECTION_INTERVAL);
  const scenarioQueueRef = useRef<Scenario[]>([]);
  const [disp, setDisp] = useState({ ...stateRef.current });
  const [levelIdx, setLevelIdx] = useState(0);
  const LEVEL_NAMES = ['Suburban Streets', 'Downtown Grid', 'Highway Approach'];

  const gameLoop = useCallback((ts: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;
    if (s.phase !== 'playing') return;

    const dt = Math.min((ts - lastTRef.current) / 1000, 0.05);
    lastTRef.current = ts;
    const lv = s.level;
    const baseSpeed = 120 + lv * 40; // pixels per second

    // ── Road scroll ──────────────────────────────────────────────────────────
    roadOffsetRef.current = (roadOffsetRef.current + baseSpeed * dt) % 60;

    // ── Distance / intersection logic ────────────────────────────────────────
    let newDist = s.distance + baseSpeed * dt * 0.05; // convert pixels to meters
    let newScore = s.score + Math.floor(baseSpeed * dt * 0.1);
    let newIntersection = s.currentIntersection;
    let intersectionVisible = s.intersectionVisible;

    // Check if we should spawn a new intersection
    if (newDist >= nextIntersectionRef.current) {
      if (scenarioQueueRef.current.length === 0) {
        scenarioQueueRef.current = [...SCENARIOS].sort(() => Math.random() - 0.5);
      }
      const scenario = scenarioQueueRef.current.shift()!;
      const turnDir = Math.random() > 0.5 ? 'left' : 'right';
      newIntersection = {
        id: uid++,
        distanceMeters: nextIntersectionRef.current,
        scenario,
        turnDir,
        crossTraffic: scenario.spawnCrossTraffic(),
        playerHasROW: false,
      };
      intersectionVisible = true;
      nextIntersectionRef.current += INTERSECTION_INTERVAL;
    }

    // Update intersection visibility based on distance
    if (newIntersection) {
      const distToIntersection = newIntersection.distanceMeters - newDist;
      intersectionVisible = distToIntersection > -30 && distToIntersection < 80;

      // Check if player passed intersection
      if (distToIntersection < -30) {
        newScore += 100; // bonus for clearing intersection
        newIntersection = null;
        intersectionVisible = false;
      }
    }

    // ── Move cross-traffic ───────────────────────────────────────────────────
    if (newIntersection) {
      for (const car of newIntersection.crossTraffic) {
        if (car.direction === 'up') car.y -= car.speed * dt;
        else if (car.direction === 'down') car.y += car.speed * dt;
        else if (car.direction === 'left') car.x -= car.speed * dt;
        else if (car.direction === 'right') car.x += car.speed * dt;
      }
      newIntersection.crossTraffic = newIntersection.crossTraffic.filter(c => {
        if (c.direction === 'up' || c.direction === 'down') return c.y > -100 && c.y < H + 100;
        return c.x > -100 && c.x < W + 100;
      });
    }

    // ── Collision detection (at intersection) ────────────────────────────────
    let crashed = false;
    if (newIntersection && intersectionVisible) {
      const px = W / 2;
      const py = H - 80;
      const pw = 32;
      const ph = 50;

      // Check collision with cross-traffic
      for (const car of newIntersection.crossTraffic) {
        const dx = Math.abs(px - car.x);
        const dy = Math.abs(py - car.y);
        if (dx < (pw + car.w) / 2 && dy < (ph + car.h) / 2) {
          crashed = true;
          break;
        }
      }
    }

    if (crashed) {
      stateRef.current = { ...s, phase: 'crashed', score: newScore, distance: newDist };
      setDisp({ ...stateRef.current });
      renderFrame(ctx, s.playerTurning, true, stateRef.current);
      onScoreUpdate?.(newScore);
      return;
    }

    // ── Timer ────────────────────────────────────────────────────────────────
    const newTime = s.timeLeft - dt;
    if (newTime <= 0) {
      stateRef.current = { ...s, phase: 'timeout', timeLeft: 0, score: newScore, distance: newDist };
      setDisp({ ...stateRef.current });
      renderFrame(ctx, s.playerTurning, false, stateRef.current);
      onScoreUpdate?.(newScore);
      return;
    }

    // ── Level complete ───────────────────────────────────────────────────────
    if (newDist >= 500) {
      stateRef.current = { ...s, phase: 'levelComplete', score: newScore, distance: newDist, streak: s.streak + 1 };
      setDisp({ ...stateRef.current });
      renderFrame(ctx, s.playerTurning, false, stateRef.current);
      onScoreUpdate?.(newScore);
      return;
    }

    stateRef.current = { ...s, score: newScore, distance: newDist, timeLeft: newTime, currentIntersection: newIntersection, intersectionVisible };
    renderFrame(ctx, s.playerTurning, false, stateRef.current);
    if (ts % 80 < 20) setDisp({ ...stateRef.current });

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [onScoreUpdate]);

  function renderFrame(ctx: CanvasRenderingContext2D, turning: 'none' | 'left' | 'right', crashed: boolean, s: GameState) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    drawRoad(ctx, roadOffsetRef.current);

    if (s.currentIntersection && s.intersectionVisible) {
      const distToIntersection = s.currentIntersection.distanceMeters - s.distance;
      const progress = Math.max(0, Math.min(1, (80 - distToIntersection) / 80));
      drawIntersection(ctx, progress);

      // Draw cross-traffic
      for (const car of s.currentIntersection.crossTraffic) {
        drawCar(ctx, car);
      }
    }

    drawPlayer(ctx, turning, crashed);
    drawHUD(ctx, s.score, s.distance, s.timeLeft, s.currentIntersection?.scenario || null);

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
    roadOffsetRef.current = 0;
    nextIntersectionRef.current = INTERSECTION_INTERVAL;
    scenarioQueueRef.current = [...SCENARIOS].sort(() => Math.random() - 0.5);
    const ns: GameState = {
      phase: 'playing', score: 0, distance: 0,
      streak: stateRef.current.streak, level: lv,
      timeLeft: LEVEL_TIME, currentIntersection: null, intersectionVisible: false, playerTurning: 'none',
    };
    stateRef.current = ns;
    setDisp(ns);
    lastTRef.current = performance.now();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  const handleTurn = useCallback((dir: 'left' | 'right') => {
    if (stateRef.current.phase === 'playing') {
      stateRef.current.playerTurning = dir;
    }
  }, []);

  const handleRelease = useCallback(() => {
    stateRef.current.playerTurning = 'none';
  }, []);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') { e.preventDefault(); handleTurn('left'); }
      if (e.code === 'ArrowRight') { e.preventDefault(); handleTurn('right'); }
    };
    const ku = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { e.preventDefault(); handleRelease(); }
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, [handleTurn, handleRelease]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // Idle screen
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);
    drawRoad(ctx, 0);
    drawPlayer(ctx, 'none', false);
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
    ctx.fillText('Use ← → arrows to turn', W / 2, H / 2 - 10);
    ctx.fillText('Navigate intersections safely', W / 2, H / 2 + 8);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('8 DMV Right-of-Way Scenarios', W / 2, H / 2 + 28);
    ctx.fillStyle = '#f87171';
    ctx.font = '9px Arial';
    ctx.fillText('🔴 ROW = that vehicle has right of way', W / 2, H / 2 + 44);
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

        {/* Controls overlaid */}
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
            <div className="flex gap-2">
              <button
                onMouseDown={() => handleTurn('left')}
                onMouseUp={handleRelease}
                onMouseLeave={handleRelease}
                onTouchStart={(e) => { e.preventDefault(); handleTurn('left'); }}
                onTouchEnd={(e) => { e.preventDefault(); handleRelease(); }}
                onTouchCancel={(e) => { e.preventDefault(); handleRelease(); }}
                className="flex-1 bg-blue-700 active:bg-blue-900 text-white font-extrabold py-4 rounded-lg shadow-xl text-lg border border-blue-400 touch-none"
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
              >← TURN LEFT</button>
              <button
                onMouseDown={() => handleTurn('right')}
                onMouseUp={handleRelease}
                onMouseLeave={handleRelease}
                onTouchStart={(e) => { e.preventDefault(); handleTurn('right'); }}
                onTouchEnd={(e) => { e.preventDefault(); handleRelease(); }}
                onTouchCancel={(e) => { e.preventDefault(); handleRelease(); }}
                className="flex-1 bg-blue-700 active:bg-blue-900 text-white font-extrabold py-4 rounded-lg shadow-xl text-lg border border-blue-400 touch-none"
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
              >TURN RIGHT →</button>
            </div>
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
