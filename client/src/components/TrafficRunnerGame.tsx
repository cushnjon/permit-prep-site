/**
 * Traffic Jam Runner — Intersection-Based Turning with Traffic Control
 * - Car can only turn at intersections
 * - Traffic lights (red/green 30s cycle) and stop signs at intersections
 * - Penalty for crossing without pausing
 */
import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const CANVAS_W = 340;
const CANVAS_H = 560;
const MAP_W = 1200;
const MAP_H = 1200;
const LEVEL_TIME = 90;
const CAR_SIZE = 14;
const ROAD_WIDTH = CAR_SIZE * 3; // 42px
const CAR_SPEED = 100; // pixels per second
const COIN_SIZE = 6;
const COIN_COUNT = 20;
const LIGHT_CYCLE = 30; // 30 seconds per cycle (15s red, 15s green)
const INTERSECTION_SIZE = 80; // Size of intersection zone

// Map image URL
const MAP_IMAGE_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663519249570/mm4tLNaBdqm6gYLeDdgBgS/dmv-map-85.jpg';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Coin {
  x: number;
  y: number;
  collected: boolean;
}

interface Intersection {
  x: number;
  y: number;
  type: 'light' | 'stop'; // 'light' = traffic light, 'stop' = stop sign
  allowedTurns: ('left' | 'right' | 'straight')[];
}

interface GameState {
  phase: 'idle' | 'playing' | 'paused' | 'crashed' | 'levelComplete' | 'timeout';
  score: number;
  time: number;
  level: number;
  coinsCollected: number;
  playerPaused: boolean;
}

// ─── DMV Scenarios ────────────────────────────────────────────────────────
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

// ─── Road Network ────────────────────────────────────────────────────────
const ROADS = [
  { name: 'N Lind Ave', points: [[200, 0], [200, 1200]], direction: 'vertical' },
  { name: 'N Rogers Ave', points: [[400, 0], [400, 1200]], direction: 'vertical' },
  { name: 'Foster Ave', points: [[600, 0], [600, 1200]], direction: 'vertical' },
  { name: 'N Lockwood Ave', points: [[800, 0], [800, 1200]], direction: 'vertical' },
  { name: 'N Liano Ave', points: [[1000, 0], [1000, 1200]], direction: 'vertical' },

  { name: 'W Winona St', points: [[0, 200], [1200, 200]], direction: 'horizontal' },
  { name: 'W Foster Ave', points: [[0, 400], [1200, 400]], direction: 'horizontal' },
  { name: 'W Lovejoy Ave', points: [[0, 600], [1200, 600]], direction: 'horizontal' },
  { name: 'W Liano Ave', points: [[0, 800], [1200, 800]], direction: 'horizontal' },
  { name: 'W Carmen Ave', points: [[0, 1000], [1200, 1000]], direction: 'horizontal' },

  { name: 'Diagonal NE', points: [[100, 900], [500, 300]], direction: 'diagonal' },
  { name: 'Diagonal NW', points: [[900, 300], [500, 900]], direction: 'diagonal' },
];

// ─── Intersections with traffic control ────────────────────────────────
const INTERSECTIONS: Intersection[] = [
  { x: 200, y: 200, type: 'light', allowedTurns: ['left', 'right', 'straight'] },
  { x: 200, y: 400, type: 'stop', allowedTurns: ['left', 'right', 'straight'] },
  { x: 200, y: 600, type: 'light', allowedTurns: ['left', 'right', 'straight'] },
  { x: 200, y: 800, type: 'stop', allowedTurns: ['left', 'right', 'straight'] },
  { x: 400, y: 200, type: 'light', allowedTurns: ['left', 'right', 'straight'] },
  { x: 400, y: 400, type: 'stop', allowedTurns: ['left', 'right', 'straight'] },
  { x: 400, y: 600, type: 'light', allowedTurns: ['left', 'right', 'straight'] },
  { x: 400, y: 800, type: 'stop', allowedTurns: ['left', 'right', 'straight'] },
  { x: 600, y: 200, type: 'light', allowedTurns: ['left', 'right', 'straight'] },
  { x: 600, y: 400, type: 'stop', allowedTurns: ['left', 'right', 'straight'] },
  { x: 600, y: 600, type: 'light', allowedTurns: ['left', 'right', 'straight'] },
  { x: 600, y: 800, type: 'stop', allowedTurns: ['left', 'right', 'straight'] },
  { x: 800, y: 200, type: 'light', allowedTurns: ['left', 'right', 'straight'] },
  { x: 800, y: 400, type: 'stop', allowedTurns: ['left', 'right', 'straight'] },
  { x: 800, y: 600, type: 'light', allowedTurns: ['left', 'right', 'straight'] },
  { x: 800, y: 800, type: 'stop', allowedTurns: ['left', 'right', 'straight'] },
  { x: 1000, y: 200, type: 'light', allowedTurns: ['left', 'right', 'straight'] },
  { x: 1000, y: 400, type: 'stop', allowedTurns: ['left', 'right', 'straight'] },
  { x: 1000, y: 600, type: 'light', allowedTurns: ['left', 'right', 'straight'] },
  { x: 1000, y: 800, type: 'stop', allowedTurns: ['left', 'right', 'straight'] },
];

// ─── Helper: Find closest point on any road ────────────────────────────────
function findClosestRoadPoint(x: number, y: number): { x: number; y: number; roadName: string } {
  let closest: { dist: number; x: number; y: number; roadName: string } = { dist: Infinity, x, y, roadName: 'Unknown' };

  ROADS.forEach((road) => {
    for (let i = 0; i < road.points.length - 1; i++) {
      const [x1, y1] = road.points[i];
      const [x2, y2] = road.points[i + 1];

      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;

      let t = ((x - x1) * dx + (y - y1) * dy) / (len * len);
      t = Math.max(0, Math.min(1, t));

      const closestX = x1 + t * dx;
      const closestY = y1 + t * dy;
      const dist = Math.hypot(x - closestX, y - closestY);

      if (dist < closest.dist && dist < ROAD_WIDTH / 2 + 10) {
        closest = { dist, x: closestX, y: closestY, roadName: road.name };
      }
    }
  });

  return closest;
}

// ─── Helper: Check if point is on a road ────────────────────────────────
function isOnRoad(x: number, y: number): boolean {
  const closest = findClosestRoadPoint(x, y);
  return (closest as any).dist < ROAD_WIDTH / 2;
}

// ─── Helper: Find nearest intersection ────────────────────────────────
function findNearestIntersection(x: number, y: number): Intersection | null {
  let nearest: Intersection | null = null;
  let minDist = INTERSECTION_SIZE;

  INTERSECTIONS.forEach((inter) => {
    const dist = Math.hypot(x - inter.x, y - inter.y);
    if (dist < minDist) {
      minDist = dist;
      nearest = inter;
    }
  });

  return nearest;
}

// ─── Helper: Check if light is green ────────────────────────────────
function isLightGreen(time: number): boolean {
  const cycleTime = time % LIGHT_CYCLE;
  return cycleTime >= LIGHT_CYCLE / 2; // Green for second half of cycle
}

// ─── Game Component ────────────────────────────────────────────────────────────
export function TrafficRunnerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapImageRef = useRef<HTMLImageElement | null>(null);
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
  const coinsRef = useRef<Coin[]>([]);
  const lastTRef = useRef(0);
  const rafRef = useRef<number | undefined>(undefined);
  const currentScenarioRef = useRef(0);
  const atIntersectionRef = useRef<Intersection | null>(null);
  const yieldingRef = useRef(false);
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });

  // Load map image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      mapImageRef.current = img;
    };
    img.src = MAP_IMAGE_URL;
  }, []);

  // ─── Spawn coins on roads ────────────────────────────────────────────────────────
  const spawnCoins = useCallback(() => {
    const coins: Coin[] = [];
    let attempts = 0;
    while (coins.length < COIN_COUNT && attempts < 200) {
      const x = Math.random() * MAP_W;
      const y = Math.random() * MAP_H;
      if (isOnRoad(x, y)) {
        coins.push({ x, y, collected: false });
      }
      attempts++;
    }
    coinsRef.current = coins;
  }, []);

  // ─── Draw functions ────────────────────────────────────────────────────────
  const drawMap = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const carScreenX = CANVAS_W / 2;
    const carScreenY = CANVAS_H / 2;

    // Draw map image
    if (mapImageRef.current) {
      const offsetX = carScreenX - (carXRef.current / MAP_W) * mapImageRef.current.width;
      const offsetY = carScreenY - (carYRef.current / MAP_H) * mapImageRef.current.height;
      const scale = CANVAS_W / MAP_W;
      ctx.globalAlpha = 0.3;
      ctx.drawImage(
        mapImageRef.current,
        offsetX,
        offsetY,
        mapImageRef.current.width * scale,
        mapImageRef.current.height * scale
      );
      ctx.globalAlpha = 1;
    }

    // Draw roads
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = ROAD_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ROADS.forEach((road) => {
      ctx.beginPath();
      let first = true;
      road.points.forEach(([x, y]) => {
        const screenX = carScreenX + (x - carXRef.current);
        const screenY = carScreenY + (y - carYRef.current);
        if (first) {
          ctx.moveTo(screenX, screenY);
          first = false;
        } else {
          ctx.lineTo(screenX, screenY);
        }
      });
      ctx.stroke();
    });

    // Draw road markings
    ctx.strokeStyle = '#ffff99';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    ROADS.forEach((road) => {
      ctx.beginPath();
      let first = true;
      road.points.forEach(([x, y]) => {
        const screenX = carScreenX + (x - carXRef.current);
        const screenY = carScreenY + (y - carYRef.current);
        if (first) {
          ctx.moveTo(screenX, screenY);
          first = false;
        } else {
          ctx.lineTo(screenX, screenY);
        }
      });
      ctx.stroke();
    });

    ctx.setLineDash([]);

    // Draw intersections with traffic control
    const s = stateRef.current;
    INTERSECTIONS.forEach((inter) => {
      const screenX = carScreenX + (inter.x - carXRef.current);
      const screenY = carScreenY + (inter.y - carYRef.current);

      if (screenX > -50 && screenX < CANVAS_W + 50 && screenY > -50 && screenY < CANVAS_H + 50) {
        if (inter.type === 'light') {
          // Traffic light
          const isGreen = isLightGreen(s.time);
          ctx.fillStyle = isGreen ? '#22c55e' : '#ef4444';
          ctx.fillRect(screenX - 8, screenY - 20, 16, 40);
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 1;
          ctx.strokeRect(screenX - 8, screenY - 20, 16, 40);
        } else {
          // Stop sign
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = screenX + Math.cos(angle) * 12;
            const y = screenY + Math.sin(angle) * 12;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 8px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('STOP', screenX, screenY);
        }
      }
    });
  }, []);

  const drawCar = useCallback((ctx: CanvasRenderingContext2D) => {
    const carScreenX = CANVAS_W / 2;
    const carScreenY = CANVAS_H / 2;

    ctx.save();
    ctx.translate(carScreenX, carScreenY);
    ctx.rotate((headingRef.current * Math.PI) / 2);

    ctx.fillStyle = '#22c55e';
    ctx.fillRect(-CAR_SIZE / 2, -CAR_SIZE / 2, CAR_SIZE, CAR_SIZE);

    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-CAR_SIZE / 2 + 2, -CAR_SIZE / 2, CAR_SIZE - 4, 4);

    ctx.restore();
  }, []);

  const drawCoins = useCallback((ctx: CanvasRenderingContext2D) => {
    const carScreenX = CANVAS_W / 2;
    const carScreenY = CANVAS_H / 2;

    coinsRef.current.forEach((coin) => {
      if (!coin.collected) {
        const screenX = carScreenX + (coin.x - carXRef.current);
        const screenY = carScreenY + (coin.y - carYRef.current);
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
    ctx.fillStyle = '#333';
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${s.time.toFixed(1)}s`, 8, 12);

    ctx.textAlign = 'right';
    ctx.fillText(`${s.score} pts`, CANVAS_W - 8, 12);

    if (s.phase === 'playing') {
      ctx.fillStyle = '#d97706';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(SCENARIOS[currentScenarioRef.current].title, CANVAS_W / 2, 24);
      ctx.fillStyle = '#666';
      ctx.font = '9px Arial';
      ctx.fillText(SCENARIOS[currentScenarioRef.current].law, CANVAS_W / 2, 34);

      // Show intersection status
      if (atIntersectionRef.current) {
        const inter = atIntersectionRef.current;
        ctx.fillStyle = yieldingRef.current ? '#22c55e' : '#ef4444';
        ctx.font = 'bold 10px Arial';
        ctx.fillText(yieldingRef.current ? '✓ YIELDING' : '⚠ AT INTERSECTION', CANVAS_W / 2, CANVAS_H - 8);
        
        // Show turn instructions
        ctx.fillStyle = '#666';
        ctx.font = '9px Arial';
        if (atIntersectionRef.current?.allowedTurns.includes('left')) {
          ctx.fillText('← LEFT', 20, CANVAS_H - 8);
        }
        if (atIntersectionRef.current?.allowedTurns.includes('right')) {
          ctx.fillText('RIGHT →', CANVAS_W - 50, CANVAS_H - 8);
        }
      }
    }
  }, []);

  // ─── Game loop ────────────────────────────────────────────────────────
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

    // Handle intersection-based turns
    const nearInter = findNearestIntersection(carXRef.current, carYRef.current);
    atIntersectionRef.current = nearInter;
    
    if (nearInter && nearInter.allowedTurns.length > 0) {
      if (keysRef.current.left && nearInter.allowedTurns.includes('left')) {
        headingRef.current = (headingRef.current - 1 + 4) % 4;
        keysRef.current.left = false; // Consume input
      }
      if (keysRef.current.right && nearInter.allowedTurns.includes('right')) {
        headingRef.current = (headingRef.current + 1) % 4;
        keysRef.current.right = false; // Consume input
      }
    }

    // Move car forward (constant movement)
    const moveDistance = CAR_SPEED * deltaTime;
    const dx = [0, moveDistance, 0, -moveDistance][headingRef.current];
    const dy = [-moveDistance, 0, moveDistance, 0][headingRef.current];

    let newX = carXRef.current + dx;
    let newY = carYRef.current + dy;

    // Snap to road if off road
    if (!isOnRoad(newX, newY)) {
      const snapped = findClosestRoadPoint(newX, newY);
      newX = snapped.x;
      newY = snapped.y;
    }

    // Wrap around at edges
    if (newX < 0 || newX > MAP_W || newY < 0 || newY > MAP_H) {
      if (newX < 0) newX = MAP_W - 10;
      if (newX > MAP_W) newX = 10;
      if (newY < 0) newY = MAP_H - 10;
      if (newY > MAP_H) newY = 10;
      const wrapped = findClosestRoadPoint(newX, newY);
      newX = wrapped.x;
      newY = wrapped.y;
    }

    carXRef.current = newX;
    carYRef.current = newY;

    // Check intersection (already found above)
    // nearInter already set from turn handling above

    // Check if crossing intersection without yielding
    if (nearInter && !yieldingRef.current) {
      if (nearInter.type === 'light' && !isLightGreen(newTime)) {
        // Red light — penalty
        stateRef.current = { ...s, score: Math.max(0, s.score - 25), time: newTime };
        setDisp(stateRef.current);
        return;
      }
      if (nearInter.type === 'stop') {
        // Stop sign — penalty
        stateRef.current = { ...s, score: Math.max(0, s.score - 25), time: newTime };
        setDisp(stateRef.current);
        return;
      }
    }

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
      drawMap(ctx);
      // Draw instruction panel BEHIND the car
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
      ctx.fillText('Yield at traffic lights and stop signs', CANVAS_W / 2, CANVAS_H / 2 + 8);
      ctx.fillStyle = '#d97706';
      ctx.font = 'bold 10px Arial';
      ctx.fillText('8 DMV Right-of-Way Scenarios', CANVAS_W / 2, CANVAS_H / 2 + 28);
      // Draw car ON TOP of the instruction panel
      drawCar(ctx);
      return;
    }

    drawMap(ctx);
    drawCoins(ctx);
    drawCar(ctx);
    drawHUD(ctx, s);

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

    const startRoad = findClosestRoadPoint(MAP_W / 2, MAP_H / 2);
    carXRef.current = startRoad.x;
    carYRef.current = startRoad.y;
    headingRef.current = 0;
    currentScenarioRef.current = Math.floor(Math.random() * SCENARIOS.length);
    yieldingRef.current = false;

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
      yieldingRef.current = true;
      stateRef.current.score += 50;
      stateRef.current.phase = 'levelComplete';
      setDisp({ ...stateRef.current });
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
  }, []);

  const turnLeft = useCallback(() => {
    if (atIntersectionRef.current && atIntersectionRef.current.allowedTurns.includes('left')) {
      headingRef.current = (headingRef.current - 1 + 4) % 4;
    }
  }, []);

  const turnRight = useCallback(() => {
    if (atIntersectionRef.current && atIntersectionRef.current.allowedTurns.includes('right')) {
      headingRef.current = (headingRef.current + 1) % 4;
    }
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keysRef.current.left = true;
      if (e.key === 'ArrowRight') keysRef.current.right = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keysRef.current.left = false;
      if (e.key === 'ArrowRight') keysRef.current.right = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const phase = disp.phase;
  const isPlaying = phase === 'playing';

  return (
    <div className="w-full flex flex-col items-center gap-1 select-none">
      <div className="w-full flex items-center justify-between bg-slate-800 text-white rounded-lg px-3 py-1.5 border border-slate-700">
        <button onClick={() => setLevelIdx(i => Math.max(0, i - 1))} className="font-bold text-xl px-2 disabled:opacity-30 text-green-400" disabled={levelIdx === 0}>‹</button>
        <div className="text-center">
          <p className="font-bold text-xs text-green-300">{LEVEL_NAMES[levelIdx]}</p>
          <p className="text-xs text-slate-400">Lv {levelIdx + 1} / {LEVEL_NAMES.length}</p>
        </div>
        <button onClick={() => setLevelIdx(i => Math.min(LEVEL_NAMES.length - 1, i + 1))} className="font-bold text-xl px-2 disabled:opacity-30 text-green-400" disabled={levelIdx === LEVEL_NAMES.length - 1}>›</button>
      </div>

      <div className="relative w-full max-w-sm">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full rounded-t-xl border-2 border-slate-600 touch-none block bg-white"
        />

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

      <div className="w-full max-w-sm grid grid-cols-3 gap-1 text-center">
        {[['Score', disp.score], ['Time', `${disp.time.toFixed(1)}s`], ['Coins', disp.coinsCollected]].map(([l, v]) => (
          <div key={l as string} className="bg-slate-800 rounded-md py-1 border border-slate-700">
            <p className="text-xs text-slate-400">{l}</p>
            <p className="text-sm font-bold text-green-400">{v}</p>
          </div>
        ))}
      </div>

      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300">
        <p className="font-bold text-yellow-400 mb-0.5">How to Play:</p>
        <p className="text-slate-400 text-xs leading-relaxed">Drive on the streets and collect coins. At intersections with traffic lights (green/red 30s cycle) or stop signs, you must yield. Crossing without pausing costs 25 points. Press STOP to yield and complete the level.</p>
      </div>
    </div>
  );
}
