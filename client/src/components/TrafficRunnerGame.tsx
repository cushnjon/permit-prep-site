/**
 * Traffic Jam Runner — Turn Dynamics Edition
 * 
 * Implements official DMV right-of-way laws:
 * 1. Left turn must YIELD to ALL oncoming straight traffic
 * 2. Right turn must YIELD to pedestrians and cyclists crossing
 * 3. 4-way stop: first to arrive goes first; simultaneous = yield to right
 * 4. Roundabout: yield to traffic already inside
 * 5. Emergency vehicles ALWAYS have ROW — pull over
 * 6. T-intersection: through road has ROW over entering road
 * 7. Unprotected left on green: yield to oncoming straight traffic
 * 8. Entering from driveway/parking lot: yield to all road traffic
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type VehicleType = 'sedan' | 'suv' | 'truck' | 'van' | 'pickup' | 'motorcycle' | 'emergency' | 'pedestrian';
type MotorVehicleType = Exclude<VehicleType, 'pedestrian'>;
type Direction = 'straight' | 'left-turn' | 'right-turn' | 'cross-traffic' | 'emergency';
type ScenarioType =
  | 'open-road'
  | 'left-turn-yield'
  | 'right-turn-pedestrian'
  | 'four-way-stop'
  | 'roundabout-yield'
  | 'emergency-pullover'
  | 't-intersection'
  | 'unprotected-left-green'
  | 'driveway-exit';

interface TrafficCar {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  color: string;
  roofColor: string;
  label: string;
  type: VehicleType;
  direction: Direction;
  hasROW: boolean;       // this car has right of way over the player
  lane: 'left' | 'right' | 'center' | 'cross-left' | 'cross-right';
  angle: number;         // degrees, 0 = facing down
  crossX?: number;       // for cross-traffic, target x
  isEmergency?: boolean;
}

interface Scenario {
  type: ScenarioType;
  title: string;
  law: string;
  playerAction: 'stop' | 'go' | 'yield-then-go';
  triggerY: number;     // player Y where scenario activates
}

interface GameState {
  phase: 'idle' | 'playing' | 'crashed' | 'levelComplete';
  score: number;
  distance: number;
  streak: number;
  level: number;
  currentScenario: Scenario | null;
  scenarioActive: boolean;
  playerTurn: 'none' | 'left' | 'right';
  playerAngle: number;  // for turn animation
}

// ─── Constants ────────────────────────────────────────────────────────────────
const W = 360;
const H = 580;
const ROAD_LEFT = 80;
const ROAD_RIGHT = W - 80;
const ROAD_W = ROAD_RIGHT - ROAD_LEFT;
const PLAYER_LANE_X = ROAD_LEFT + ROAD_W * 0.5;
const PLAYER_Y = H - 110;
const PLAYER_W = 34;
const PLAYER_H = 54;
const PLAYER_SPEED = 160;
const STRIPE_H = 36;
const STRIPE_GAP = 36;

// ─── Official ROW Scenarios ───────────────────────────────────────────────────
const SCENARIOS: Scenario[] = [
  {
    type: 'open-road',
    title: 'Open Road',
    law: 'Clear road — proceed normally.',
    playerAction: 'go',
    triggerY: 9999,
  },
  {
    type: 'left-turn-yield',
    title: 'Unprotected Left Turn',
    law: 'DMV Law: Left-turning drivers MUST yield to ALL oncoming straight traffic before turning.',
    playerAction: 'yield-then-go',
    triggerY: 200,
  },
  {
    type: 'right-turn-pedestrian',
    title: 'Right Turn — Pedestrian Crossing',
    law: 'DMV Law: Right-turning drivers MUST yield to pedestrians in the crosswalk.',
    playerAction: 'stop',
    triggerY: 200,
  },
  {
    type: 'four-way-stop',
    title: '4-Way Stop',
    law: 'DMV Law: First to arrive goes first. Simultaneous arrival — yield to the car on your RIGHT.',
    playerAction: 'yield-then-go',
    triggerY: 200,
  },
  {
    type: 'emergency-pullover',
    title: 'Emergency Vehicle',
    law: 'DMV Law: ALWAYS yield to emergency vehicles with active lights/siren. Pull over and stop.',
    playerAction: 'stop',
    triggerY: 200,
  },
  {
    type: 't-intersection',
    title: 'T-Intersection',
    law: 'DMV Law: Traffic on the through road has right-of-way over vehicles entering from a side road.',
    playerAction: 'stop',
    triggerY: 200,
  },
  {
    type: 'unprotected-left-green',
    title: 'Green Light — Left Turn',
    law: 'DMV Law: Green light does NOT give left-turners priority. You must still yield to oncoming straight traffic.',
    playerAction: 'yield-then-go',
    triggerY: 200,
  },
  {
    type: 'driveway-exit',
    title: 'Exiting Driveway / Parking Lot',
    law: 'DMV Law: Drivers exiting a driveway or parking lot MUST yield to ALL road traffic and pedestrians.',
    playerAction: 'stop',
    triggerY: 200,
  },
  {
    type: 'roundabout-yield',
    title: 'Roundabout Entry',
    law: 'DMV Law: Drivers entering a roundabout MUST yield to all vehicles already circulating inside.',
    playerAction: 'stop',
    triggerY: 200,
  },
];

const CAR_DEFS: Record<VehicleType, { w: number; h: number; color: string; roofColor: string; label: string }> = {
  sedan:      { w: 32, h: 50, color: '#3498db', roofColor: '#2471a3', label: 'Sedan' },
  suv:        { w: 36, h: 56, color: '#e67e22', roofColor: '#ca6f1e', label: 'SUV' },
  truck:      { w: 40, h: 68, color: '#8e44ad', roofColor: '#7d3c98', label: 'Truck' },
  van:        { w: 38, h: 62, color: '#16a085', roofColor: '#138d75', label: 'Van' },
  pickup:     { w: 36, h: 58, color: '#c0392b', roofColor: '#a93226', label: 'Pickup' },
  motorcycle: { w: 18, h: 36, color: '#f39c12', roofColor: '#d68910', label: 'Moto' },
  emergency:  { w: 34, h: 56, color: '#e74c3c', roofColor: '#c0392b', label: '🚨 EMRG' },
  pedestrian: { w: 16, h: 28, color: '#27ae60', roofColor: '#1e8449', label: '🚶' },
};

let nextId = 0;

function makeCar(
  type: VehicleType,
  x: number,
  y: number,
  speed: number,
  direction: Direction,
  hasROW: boolean,
  lane: TrafficCar['lane'],
  angle = 0
): TrafficCar {
  const def = CAR_DEFS[type];
  return {
    id: nextId++,
    x, y,
    w: def.w, h: def.h,
    speed,
    color: def.color,
    roofColor: def.roofColor,
    label: def.label,
    type,
    direction,
    hasROW,
    lane,
    angle,
    isEmergency: type === 'emergency',
  };
}

// Spawn cars for a given scenario
function spawnScenarioCars(scenario: Scenario, level: number): TrafficCar[] {
  const baseSpeed = 120 + level * 40;
  const cars: TrafficCar[] = [];
  const types: VehicleType[] = ['sedan', 'suv', 'truck', 'van', 'pickup', 'motorcycle'];
  const rndType = () => types[Math.floor(Math.random() * types.length)];

  switch (scenario.type) {
    case 'open-road':
      // Normal oncoming traffic, no ROW conflict
      cars.push(makeCar(rndType(), ROAD_LEFT + ROAD_W * 0.3, -60, baseSpeed, 'straight', false, 'left'));
      cars.push(makeCar(rndType(), ROAD_LEFT + ROAD_W * 0.7, -120, baseSpeed * 0.8, 'straight', false, 'right'));
      break;

    case 'left-turn-yield':
      // Player wants to turn left — oncoming straight car has ROW
      cars.push(makeCar(rndType(), ROAD_LEFT + ROAD_W * 0.7, -40, baseSpeed, 'straight', true, 'right'));
      cars.push(makeCar(rndType(), ROAD_LEFT + ROAD_W * 0.7, -160, baseSpeed, 'straight', true, 'right'));
      break;

    case 'right-turn-pedestrian':
      // Pedestrian crossing — has ROW over right-turning player
      cars.push(makeCar('pedestrian', ROAD_LEFT - 20, PLAYER_Y - 40, 60, 'cross-traffic', true, 'cross-left'));
      cars.push(makeCar('pedestrian', ROAD_RIGHT + 20, PLAYER_Y - 60, 60, 'cross-traffic', true, 'cross-right'));
      break;

    case 'four-way-stop':
      // Car arriving from the right at the same time — has ROW (yield to right)
      cars.push(makeCar(rndType(), ROAD_RIGHT + 60, PLAYER_Y - 10, baseSpeed * 0.5, 'cross-traffic', true, 'cross-right'));
      break;

    case 'emergency-pullover':
      // Emergency vehicle approaching from behind / oncoming — always has ROW
      cars.push(makeCar('emergency', PLAYER_LANE_X, -80, baseSpeed * 1.6, 'straight', true, 'center', 0));
      break;

    case 't-intersection':
      // Through-road traffic has ROW — player entering from side
      cars.push(makeCar(rndType(), ROAD_LEFT - 80, PLAYER_Y - 20, baseSpeed, 'cross-traffic', true, 'cross-left'));
      cars.push(makeCar(rndType(), ROAD_RIGHT + 80, PLAYER_Y - 40, baseSpeed * 0.9, 'cross-traffic', true, 'cross-right'));
      break;

    case 'unprotected-left-green':
      // Green light but oncoming straight traffic still has ROW over left-turner
      cars.push(makeCar(rndType(), ROAD_LEFT + ROAD_W * 0.7, -30, baseSpeed * 1.1, 'straight', true, 'right'));
      cars.push(makeCar(rndType(), ROAD_LEFT + ROAD_W * 0.7, -140, baseSpeed, 'straight', true, 'right'));
      break;

    case 'driveway-exit':
      // Road traffic has ROW over player exiting driveway
      cars.push(makeCar(rndType(), ROAD_LEFT + ROAD_W * 0.3, -50, baseSpeed * 0.9, 'straight', true, 'left'));
      cars.push(makeCar(rndType(), ROAD_LEFT + ROAD_W * 0.7, -80, baseSpeed, 'straight', true, 'right'));
      break;

    case 'roundabout-yield':
      // Car already in roundabout has ROW
      cars.push(makeCar(rndType(), ROAD_LEFT + ROAD_W * 0.5, PLAYER_Y - 60, baseSpeed * 0.7, 'cross-traffic', true, 'center'));
      break;
  }
  return cars;
}

// ─── Drawing ──────────────────────────────────────────────────────────────────
function drawRoad(ctx: CanvasRenderingContext2D, stripeOffset: number, scenario: Scenario | null) {
  // Sky
  ctx.fillStyle = '#e8f5e9';
  ctx.fillRect(0, 0, W, H);

  // Grass
  ctx.fillStyle = '#81c784';
  ctx.fillRect(0, 0, ROAD_LEFT, H);
  ctx.fillRect(ROAD_RIGHT, 0, W - ROAD_RIGHT, H);

  // Road
  ctx.fillStyle = '#455a64';
  ctx.fillRect(ROAD_LEFT, 0, ROAD_W, H);

  // Edge lines
  ctx.strokeStyle = '#eceff1';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(ROAD_LEFT, 0); ctx.lineTo(ROAD_LEFT, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ROAD_RIGHT, 0); ctx.lineTo(ROAD_RIGHT, H); ctx.stroke();

  // Center dashes (scrolling)
  ctx.strokeStyle = '#ffd54f';
  ctx.lineWidth = 2;
  ctx.setLineDash([STRIPE_H, STRIPE_GAP]);
  ctx.lineDashOffset = -stripeOffset;
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  ctx.setLineDash([]);

  // Crosswalk for pedestrian scenarios
  if (scenario && (scenario.type === 'right-turn-pedestrian' || scenario.type === 'four-way-stop')) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(ROAD_LEFT, PLAYER_Y - 55 + i * 10, ROAD_W, 5);
    }
  }

  // Intersection box for 4-way stop / T-intersection
  if (scenario && (scenario.type === 'four-way-stop' || scenario.type === 't-intersection' || scenario.type === 'roundabout-yield')) {
    ctx.strokeStyle = 'rgba(255,235,59,0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(ROAD_LEFT, PLAYER_Y - 80, ROAD_W, 80);
    ctx.setLineDash([]);
  }

  // Stop line
  if (scenario && scenario.playerAction !== 'go') {
    ctx.strokeStyle = '#ef5350';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(ROAD_LEFT, PLAYER_Y - 65); ctx.lineTo(ROAD_RIGHT, PLAYER_Y - 65); ctx.stroke();
  }
}

function drawVehicle(ctx: CanvasRenderingContext2D, car: TrafficCar) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate((car.angle * Math.PI) / 180);

  const hw = car.w / 2;
  const hh = car.h / 2;

  if (car.type === 'pedestrian') {
    // Draw stick figure
    ctx.fillStyle = car.color;
    ctx.beginPath(); ctx.arc(0, -hh + 5, 5, 0, Math.PI * 2); ctx.fill(); // head
    ctx.fillRect(-3, -hh + 10, 6, 12); // body
    ctx.fillRect(-6, -hh + 22, 5, 8); // left leg
    ctx.fillRect(1, -hh + 22, 5, 8);  // right leg
    ctx.fillRect(-8, -hh + 12, 5, 6); // left arm
    ctx.fillRect(3, -hh + 12, 5, 6);  // right arm
    ctx.restore();
    return;
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(2, hh + 3, hw * 0.85, 5, 0, 0, Math.PI * 2); ctx.fill();

  // Body
  ctx.fillStyle = car.color;
  ctx.beginPath(); ctx.roundRect(-hw, -hh, car.w, car.h, 5); ctx.fill();

  // Roof
  ctx.fillStyle = car.roofColor;
  ctx.beginPath(); ctx.roundRect(-hw + 5, -hh + car.h * 0.2, car.w - 10, car.h * 0.38, 4); ctx.fill();

  // Windshield
  ctx.fillStyle = 'rgba(144,202,249,0.75)';
  ctx.beginPath(); ctx.roundRect(-hw + 4, -hh + 4, car.w - 8, 11, 2); ctx.fill();

  // Headlights
  ctx.fillStyle = car.isEmergency ? '#ff1744' : '#fff9c4';
  ctx.beginPath(); ctx.roundRect(-hw + 2, -hh + 2, 7, 5, 1); ctx.fill();
  ctx.beginPath(); ctx.roundRect(hw - 9, -hh + 2, 7, 5, 1); ctx.fill();

  // Taillights
  ctx.fillStyle = '#ef5350';
  ctx.beginPath(); ctx.roundRect(-hw + 2, hh - 7, 7, 5, 1); ctx.fill();
  ctx.beginPath(); ctx.roundRect(hw - 9, hh - 7, 7, 5, 1); ctx.fill();

  // Emergency lights
  if (car.isEmergency) {
    const t = Date.now() % 400 < 200;
    ctx.fillStyle = t ? '#2196f3' : '#f44336';
    ctx.beginPath(); ctx.roundRect(-hw + 3, -hh + 2, car.w - 6, 6, 2); ctx.fill();
  }

  // ROW badge
  if (car.hasROW) {
    ctx.fillStyle = '#d32f2f';
    ctx.beginPath(); ctx.arc(hw - 2, -hh - 2, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 6px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ROW', hw - 2, -hh + 1);
  }

  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `bold ${(car.type as string) === 'pedestrian' ? 7 : 8}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillText(car.label, 0, 4);

  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, isMoving: boolean, crashed: boolean, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((angle * Math.PI) / 180);

  const hw = PLAYER_W / 2;
  const hh = PLAYER_H / 2;
  const bodyColor = crashed ? '#e53935' : isMoving ? '#43a047' : '#66bb6a';
  const roofColor = crashed ? '#b71c1c' : '#2e7d32';

  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(2, hh + 4, hw * 0.85, 5, 0, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = bodyColor;
  ctx.beginPath(); ctx.roundRect(-hw, -hh, PLAYER_W, PLAYER_H, 5); ctx.fill();

  ctx.fillStyle = roofColor;
  ctx.beginPath(); ctx.roundRect(-hw + 5, -hh + PLAYER_H * 0.2, PLAYER_W - 10, PLAYER_H * 0.38, 4); ctx.fill();

  ctx.fillStyle = 'rgba(144,202,249,0.8)';
  ctx.beginPath(); ctx.roundRect(-hw + 4, -hh + 4, PLAYER_W - 8, 11, 2); ctx.fill();

  ctx.fillStyle = '#fff9c4';
  ctx.beginPath(); ctx.roundRect(-hw + 2, -hh + 2, 7, 5, 1); ctx.fill();
  ctx.beginPath(); ctx.roundRect(hw - 9, -hh + 2, 7, 5, 1); ctx.fill();

  ctx.fillStyle = '#ef5350';
  ctx.beginPath(); ctx.roundRect(-hw + 2, hh - 7, 7, 5, 1); ctx.fill();
  ctx.beginPath(); ctx.roundRect(hw - 9, hh - 7, 7, 5, 1); ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = 'bold 8px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('YOU', 0, 4);

  if (crashed) {
    ctx.restore();
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('💥', x, y - hh - 14);
    return;
  }
  ctx.restore();
}

function drawHUD(ctx: CanvasRenderingContext2D, score: number, distance: number, streak: number, hasROW: boolean, scenario: Scenario | null) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, 36);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 8, 22);
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.floor(distance)}m`, W / 2, 22);
  ctx.textAlign = 'right';
  ctx.fillText(`Streak: ${streak}`, W - 8, 22);

  // Scenario banner
  if (scenario && scenario.type !== 'open-road') {
    ctx.fillStyle = 'rgba(33,33,33,0.82)';
    ctx.fillRect(0, 36, W, 38);
    ctx.fillStyle = '#ffd54f';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`⚠ ${scenario.title}`, W / 2, 50);
    ctx.fillStyle = '#eeeeee';
    ctx.font = '8.5px Arial';
    const words = scenario.law.split(' ');
    let line = '';
    let lineY = 65;
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > W - 16) {
        ctx.fillText(line.trim(), W / 2, lineY);
        line = word + ' ';
        lineY += 11;
        if (lineY > 90) break;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line.trim(), W / 2, lineY);
  }

  // ROW indicator bar at bottom
  const rowColor = hasROW ? '#43a047' : '#e53935';
  const rowText = hasROW ? '✓ YOU HAVE RIGHT OF WAY — GO' : '✗ YIELD — RELEASE BUTTON';
  ctx.fillStyle = rowColor;
  ctx.fillRect(ROAD_LEFT, H - 40, ROAD_W, 30);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(rowText, W / 2, H - 20);
}

// ─── Component ────────────────────────────────────────────────────────────────
interface TrafficRunnerGameProps {
  onScoreUpdate?: (score: number) => void;
}

export default function TrafficRunnerGame({ onScoreUpdate }: TrafficRunnerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>({
    phase: 'idle', score: 0, distance: 0, streak: 0, level: 0,
    currentScenario: null, scenarioActive: false,
    playerTurn: 'none', playerAngle: 0,
  });
  const carsRef = useRef<TrafficCar[]>([]);
  const stripeOffsetRef = useRef(0);
  const isMovingRef = useRef(false);
  const lastTimeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const scenarioQueueRef = useRef<Scenario[]>([]);
  const nextScenarioDistRef = useRef(80);
  const [displayState, setDisplayState] = useState({ ...stateRef.current });
  const [levelIdx, setLevelIdx] = useState(0);

  const LEVEL_NAMES = ['Suburban Streets', 'Downtown Grid', 'Highway Approach'];

  // ── Collision check ──────────────────────────────────────────────────────────
  const checkCollision = useCallback((cars: TrafficCar[]): boolean => {
    const px = PLAYER_LANE_X - PLAYER_W / 2;
    const py = PLAYER_Y - PLAYER_H / 2;
    for (const car of cars) {
      if (car.type === 'pedestrian') {
        const cx = car.x - car.w / 2;
        const cy = car.y - car.h / 2;
        if (px < cx + car.w && px + PLAYER_W > cx && py < cy + car.h && py + PLAYER_H > cy) return true;
        continue;
      }
      const cx = car.x - car.w / 2;
      const cy = car.y - car.h / 2;
      if (px < cx + car.w && px + PLAYER_W > cx && py < cy + car.h && py + PLAYER_H > cy) return true;
    }
    return false;
  }, []);

  // ── Determine if player currently has right of way ───────────────────────────
  const computePlayerROW = useCallback((cars: TrafficCar[], scenario: Scenario | null): boolean => {
    if (!scenario || scenario.type === 'open-road') return true;

    // Emergency vehicle — player NEVER has ROW
    if (scenario.type === 'emergency-pullover') {
      const emrg = cars.find(c => c.isEmergency);
      if (emrg && emrg.y < PLAYER_Y + 200) return false;
      return true;
    }

    // Check if any ROW car is in the danger zone
    const dangerTop = PLAYER_Y - PLAYER_H / 2 - 180;
    const dangerBottom = PLAYER_Y + PLAYER_H / 2 + 20;

    for (const car of cars) {
      if (!car.hasROW) continue;
      const cy = car.y - car.h / 2;
      const cb = car.y + car.h / 2;
      const cx = car.x - car.w / 2;
      const cr = car.x + car.w / 2;

      // Cross-traffic: check horizontal proximity
      if (car.lane === 'cross-left' || car.lane === 'cross-right') {
        if (cy < dangerBottom && cb > dangerTop) {
          if (cr > ROAD_LEFT - 40 && cx < ROAD_RIGHT + 40) return false;
        }
        continue;
      }

      // Straight oncoming traffic
      if (cy < dangerBottom && cb > dangerTop) {
        if (cr > ROAD_LEFT && cx < ROAD_RIGHT) return false;
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

    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = timestamp;

    const moving = isMovingRef.current;

    // ── Scroll road ──────────────────────────────────────────────────────────
    if (moving) {
      stripeOffsetRef.current = (stripeOffsetRef.current + PLAYER_SPEED * dt) % (STRIPE_H + STRIPE_GAP);
    }

    // ── Move traffic cars ────────────────────────────────────────────────────
    for (const car of carsRef.current) {
      if (car.lane === 'cross-left') {
        car.x += car.speed * dt;
      } else if (car.lane === 'cross-right') {
        car.x -= car.speed * dt;
      } else {
        car.y += car.speed * dt;
      }
    }
    carsRef.current = carsRef.current.filter(c => {
      if (c.lane === 'cross-left') return c.x < W + 60;
      if (c.lane === 'cross-right') return c.x > -60;
      return c.y - c.h / 2 < H + 40;
    });

    // ── Advance distance & score ─────────────────────────────────────────────
    let newDist = state.distance;
    let newScore = state.score;
    if (moving) {
      newDist += PLAYER_SPEED * dt * 0.05;
      newScore += Math.floor(PLAYER_SPEED * dt * 0.08);
    }

    // ── Trigger next scenario ────────────────────────────────────────────────
    let currentScenario = state.currentScenario;
    if (moving && newDist >= nextScenarioDistRef.current && scenarioQueueRef.current.length > 0) {
      currentScenario = scenarioQueueRef.current.shift()!;
      nextScenarioDistRef.current = newDist + 60 + Math.random() * 80;
      carsRef.current = [...carsRef.current, ...spawnScenarioCars(currentScenario, state.level)];
    }

    // ── Compute ROW ──────────────────────────────────────────────────────────
    const hasROW = computePlayerROW(carsRef.current, currentScenario);

    // ── Crash detection ──────────────────────────────────────────────────────
    if (checkCollision(carsRef.current)) {
      stateRef.current = { ...state, phase: 'crashed', distance: newDist, score: newScore, currentScenario };
      setDisplayState({ ...stateRef.current });
      drawFrame(ctx, false, true, hasROW, stateRef.current);
      onScoreUpdate?.(newScore);
      return;
    }
    if (moving && !hasROW) {
      stateRef.current = { ...state, phase: 'crashed', distance: newDist, score: newScore, currentScenario };
      setDisplayState({ ...stateRef.current });
      drawFrame(ctx, moving, true, hasROW, stateRef.current);
      onScoreUpdate?.(newScore);
      return;
    }

    // ── Level complete at 400m ────────────────────────────────────────────────
    if (newDist >= 400) {
      const newStreak = state.streak + 1;
      stateRef.current = { ...state, phase: 'levelComplete', distance: newDist, score: newScore, streak: newStreak, currentScenario };
      setDisplayState({ ...stateRef.current });
      drawFrame(ctx, moving, false, hasROW, stateRef.current);
      onScoreUpdate?.(newScore);
      return;
    }

    stateRef.current = { ...state, distance: newDist, score: newScore, currentScenario };
    drawFrame(ctx, moving, false, hasROW, stateRef.current);

    if (timestamp % 120 < 20) setDisplayState({ ...stateRef.current });

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [checkCollision, computePlayerROW, onScoreUpdate]);

  function drawFrame(ctx: CanvasRenderingContext2D, moving: boolean, crashed: boolean, hasROW: boolean, state: GameState) {
    drawRoad(ctx, stripeOffsetRef.current, state.currentScenario);
    for (const car of carsRef.current) drawVehicle(ctx, car);
    drawPlayer(ctx, PLAYER_LANE_X, PLAYER_Y, moving, crashed, state.playerAngle);
    drawHUD(ctx, state.score, state.distance, state.streak, hasROW, state.currentScenario);

    if (crashed) {
      ctx.fillStyle = 'rgba(211,47,47,0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 34px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CRASH!', W / 2, H / 2 - 24);
      ctx.font = '13px Arial';
      const law = state.currentScenario?.law ?? 'You moved without right of way!';
      const words = law.split(' ');
      let line = '';
      let ly = H / 2 + 10;
      for (const w of words) {
        const test = line + w + ' ';
        if (ctx.measureText(test).width > W - 32) {
          ctx.fillText(line.trim(), W / 2, ly);
          line = w + ' '; ly += 16;
        } else { line = test; }
      }
      if (line) ctx.fillText(line.trim(), W / 2, ly);
    }
  }

  // ── Build scenario queue ──────────────────────────────────────────────────────
  function buildQueue(level: number): Scenario[] {
    const pool = SCENARIOS.filter(s => s.type !== 'open-road');
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const queue: Scenario[] = [];
    // Interleave open-road with scenarios
    for (let i = 0; i < shuffled.length; i++) {
      if (i % 2 === 0) queue.push(SCENARIOS[0]); // open-road
      queue.push(shuffled[i]);
    }
    return queue;
  }

  // ── Start game ────────────────────────────────────────────────────────────────
  const startGame = useCallback((level: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    carsRef.current = [];
    stripeOffsetRef.current = 0;
    isMovingRef.current = false;
    scenarioQueueRef.current = buildQueue(level);
    nextScenarioDistRef.current = 60;
    const newState: GameState = {
      phase: 'playing', score: 0, distance: 0,
      streak: stateRef.current.streak, level,
      currentScenario: SCENARIOS[0], scenarioActive: false,
      playerTurn: 'none', playerAngle: 0,
    };
    stateRef.current = newState;
    setDisplayState(newState);
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  // ── Input ─────────────────────────────────────────────────────────────────────
  const pressStart = useCallback(() => { if (stateRef.current.phase === 'playing') isMovingRef.current = true; }, []);
  const pressEnd = useCallback(() => { isMovingRef.current = false; }, []);

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
    drawRoad(ctx, 0, null);
    drawPlayer(ctx, PLAYER_LANE_X, PLAYER_Y, false, false, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(0, H / 2 - 72, W, 120);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Traffic Jam Runner', W / 2, H / 2 - 38);
    ctx.font = '12px Arial';
    ctx.fillText('Hold button to drive', W / 2, H / 2 - 12);
    ctx.fillText('Release when you DON\'T have right of way', W / 2, H / 2 + 8);
    ctx.fillStyle = '#ffd54f';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('9 official DMV right-of-way scenarios', W / 2, H / 2 + 30);
    ctx.fillStyle = '#ef9a9a';
    ctx.font = '9px Arial';
    ctx.fillText('🔴 ROW badge = that vehicle has right of way', W / 2, H / 2 + 46);
  }, []);

  return (
    <div className="w-full flex flex-col items-center gap-3 select-none">
      {/* Level selector */}
      <div className="w-full flex items-center justify-between bg-green-600 text-white rounded-lg px-4 py-2">
        <button onClick={() => setLevelIdx(i => Math.max(0, i - 1))} className="font-bold text-xl px-2 disabled:opacity-40" disabled={levelIdx === 0}>‹</button>
        <div className="text-center">
          <p className="font-bold text-sm">{LEVEL_NAMES[levelIdx]}</p>
          <p className="text-xs opacity-80">Level {levelIdx + 1} of {LEVEL_NAMES.length}</p>
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

      {/* Stats */}
      <div className="w-full max-w-sm grid grid-cols-3 gap-2 text-center">
        {[['Score', displayState.score], ['Distance', `${Math.floor(displayState.distance)}m`], ['Streak', displayState.streak]].map(([label, val]) => (
          <div key={label as string} className="bg-white rounded-lg py-2 shadow-sm border border-green-100">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-lg font-bold text-green-600">{val}</p>
          </div>
        ))}
      </div>

      {/* Status */}
      <div className={`w-full max-w-sm rounded-lg px-4 py-2 text-sm font-semibold text-center
        ${displayState.phase === 'crashed' ? 'bg-red-100 text-red-700 border border-red-300'
          : displayState.phase === 'levelComplete' ? 'bg-green-100 text-green-700 border border-green-300'
          : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
        {displayState.phase === 'idle' && 'Press Start — 9 official DMV right-of-way scenarios await!'}
        {displayState.phase === 'playing' && (displayState.currentScenario?.type !== 'open-road'
          ? `⚠ ${displayState.currentScenario?.title} — ${displayState.currentScenario?.playerAction === 'stop' ? 'RELEASE to stop!' : 'Yield then proceed'}`
          : 'Hold button to drive forward')}
        {displayState.phase === 'crashed' && '💥 Crash! Check the law displayed on screen.'}
        {displayState.phase === 'levelComplete' && `✅ Level complete! ${Math.floor(displayState.distance)}m driven safely.`}
      </div>

      {/* Controls */}
      <div className="w-full max-w-sm flex gap-3">
        {displayState.phase !== 'playing' ? (
          <>
            <button
              onClick={() => startGame(levelIdx)}
              className="flex-1 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold py-3 rounded-xl shadow-md transition-all"
            >
              {displayState.phase === 'crashed' ? '🔄 Retry' : displayState.phase === 'levelComplete' ? '▶ Play Again' : '▶ Start'}
            </button>
            {displayState.phase === 'levelComplete' && levelIdx < LEVEL_NAMES.length - 1 && (
              <button
                onClick={() => { const next = levelIdx + 1; setLevelIdx(next); startGame(next); }}
                className="flex-1 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold py-3 rounded-xl shadow-md transition-all"
              >Next Level ›</button>
            )}
          </>
        ) : (
          <button
            onMouseDown={pressStart}
            onMouseUp={pressEnd}
            onMouseLeave={pressEnd}
            onTouchStart={(e) => { e.preventDefault(); pressStart(); }}
            onTouchEnd={(e) => { e.preventDefault(); pressEnd(); }}
            onTouchCancel={(e) => { e.preventDefault(); pressEnd(); }}
            className="flex-1 bg-blue-600 active:bg-blue-900 text-white font-extrabold py-5 rounded-xl shadow-xl text-xl transition-colors duration-75 touch-none"
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          >🚗 HOLD TO DRIVE</button>
        )}
      </div>

      {/* ROW Law Reference */}
      <div className="w-full max-w-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-900 space-y-1">
        <p className="font-bold">Official DMV Right-of-Way Laws:</p>
        <p>• <b>Left turn:</b> Yield to ALL oncoming straight traffic</p>
        <p>• <b>Right turn:</b> Yield to pedestrians in crosswalk</p>
        <p>• <b>4-way stop:</b> First to arrive goes first; tie = yield to right</p>
        <p>• <b>Emergency vehicles:</b> Always yield — pull over and stop</p>
        <p>• <b>T-intersection:</b> Through road has ROW over entering road</p>
        <p>• <b>Roundabout:</b> Yield to vehicles already inside</p>
        <p>• <b>Driveway exit:</b> Yield to all road traffic</p>
        <p>• <b>Green light left turn:</b> Still yield to oncoming straight traffic</p>
      </div>
    </div>
  );
}
