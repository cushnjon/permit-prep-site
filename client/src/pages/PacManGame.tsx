import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Position {
  x: number;
  y: number;
}

interface Obstacle {
  x: number;
  y: number;
  type: 'stop-sign' | 'wall';
}

const GRID_SIZE = 20;
const ROWS = 15;
const COLS = 15;

export default function PacManGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pacmanPos, setPacmanPos] = useState<Position>({ x: 7, y: 7 });
  const [direction, setDirection] = useState<'up' | 'down' | 'left' | 'right'>('right');
  const [nextDirection, setNextDirection] = useState<'up' | 'down' | 'left' | 'right'>('right');
  const [score, setScore] = useState(0);
  const [pellets, setPellets] = useState<Position[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [gameActive, setGameActive] = useState(true);

  // Initialize pellets and obstacles
  useEffect(() => {
    const newPellets: Position[] = [];
    const newObstacles: Obstacle[] = [];

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        // Add pellets everywhere except pacman start position
        if (!(x === 7 && y === 7)) {
          if (Math.random() > 0.8) {
            newPellets.push({ x, y });
          }
        }

        // Add stop signs at intersections (every 4 cells)
        if (x % 4 === 0 && y % 4 === 0 && !(x === 7 && y === 7)) {
          if (Math.random() > 0.6) {
            newObstacles.push({ x, y, type: 'stop-sign' });
          }
        }

        // Add random walls
        if (Math.random() > 0.95 && !(x === 7 && y === 7)) {
          newObstacles.push({ x, y, type: 'wall' });
        }
      }
    }

    setPellets(newPellets);
    setObstacles(newObstacles);
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          setNextDirection('up');
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setNextDirection('down');
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setNextDirection('left');
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setNextDirection('right');
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Game loop
  useEffect(() => {
    if (!gameActive) return;

    const gameLoop = setInterval(() => {
      setPacmanPos((prev) => {
        let newPos = { ...prev };
        let canMove = true;

        // Try to move in the next direction first
        const testPos = { ...prev };
        switch (nextDirection) {
          case 'up':
            testPos.y = (prev.y - 1 + ROWS) % ROWS;
            break;
          case 'down':
            testPos.y = (prev.y + 1) % ROWS;
            break;
          case 'left':
            testPos.x = (prev.x - 1 + COLS) % COLS;
            break;
          case 'right':
            testPos.x = (prev.x + 1) % COLS;
            break;
        }

        // Check collision with obstacles
        const hasObstacle = obstacles.some(obs => obs.x === testPos.x && obs.y === testPos.y);
        if (!hasObstacle) {
          newPos = testPos;
          setDirection(nextDirection);
        } else {
          // Try to continue in current direction
          switch (direction) {
            case 'up':
              testPos.y = (prev.y - 1 + ROWS) % ROWS;
              break;
            case 'down':
              testPos.y = (prev.y + 1) % ROWS;
              break;
            case 'left':
              testPos.x = (prev.x - 1 + COLS) % COLS;
              break;
            case 'right':
              testPos.x = (prev.x + 1) % COLS;
              break;
          }

          const hasObstacle2 = obstacles.some(obs => obs.x === testPos.x && obs.y === testPos.y);
          if (!hasObstacle2) {
            newPos = testPos;
          }
        }

        // Check if pellet eaten
        setPellets((prev) =>
          prev.filter((p) => {
            if (p.x === newPos.x && p.y === newPos.y) {
              setScore((s) => s + 10);
              return false;
            }
            return true;
          })
        );

        return newPos;
      });
    }, 200);

    return () => clearInterval(gameLoop);
  }, [gameActive, direction, nextDirection, obstacles]);

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    for (let i = 0; i <= ROWS; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * GRID_SIZE);
      ctx.lineTo(COLS * GRID_SIZE, i * GRID_SIZE);
      ctx.stroke();
    }
    for (let i = 0; i <= COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * GRID_SIZE, 0);
      ctx.lineTo(i * GRID_SIZE, ROWS * GRID_SIZE);
      ctx.stroke();
    }

    // Draw pellets
    ctx.fillStyle = '#FFD700';
    pellets.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x * GRID_SIZE + GRID_SIZE / 2, p.y * GRID_SIZE + GRID_SIZE / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw obstacles
    obstacles.forEach((obs) => {
      if (obs.type === 'stop-sign') {
        // Draw stop sign
        ctx.fillStyle = '#DC143C';
        ctx.beginPath();
        const cx = obs.x * GRID_SIZE + GRID_SIZE / 2;
        const cy = obs.y * GRID_SIZE + GRID_SIZE / 2;
        const size = GRID_SIZE / 3;
        
        // Octagon
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const x = cx + Math.cos(angle) * size;
          const y = cy + Math.sin(angle) * size;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Draw "STOP" text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('STOP', cx, cy);
      } else {
        // Draw wall
        ctx.fillStyle = '#333';
        ctx.fillRect(obs.x * GRID_SIZE + 2, obs.y * GRID_SIZE + 2, GRID_SIZE - 4, GRID_SIZE - 4);
      }
    });

    // Draw Pac-Man
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    const pacX = pacmanPos.x * GRID_SIZE + GRID_SIZE / 2;
    const pacY = pacmanPos.y * GRID_SIZE + GRID_SIZE / 2;
    const mouthAngle = 0.3;
    
    let startAngle = 0;
    let endAngle = Math.PI * 2;
    
    switch (direction) {
      case 'right':
        startAngle = mouthAngle;
        endAngle = Math.PI * 2 - mouthAngle;
        break;
      case 'left':
        startAngle = Math.PI + mouthAngle;
        endAngle = Math.PI - mouthAngle;
        break;
      case 'up':
        startAngle = Math.PI * 1.5 + mouthAngle;
        endAngle = Math.PI * 0.5 - mouthAngle;
        break;
      case 'down':
        startAngle = Math.PI * 0.5 + mouthAngle;
        endAngle = Math.PI * 1.5 - mouthAngle;
        break;
    }
    
    ctx.arc(pacX, pacY, GRID_SIZE / 2 - 2, startAngle, endAngle);
    ctx.lineTo(pacX, pacY);
    ctx.closePath();
    ctx.fill();
  }, [pacmanPos, pellets, obstacles, direction]);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Suburban Road Pac-Man</h2>
        <div className="text-lg font-semibold">Score: {score}</div>
      </div>
      
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={COLS * GRID_SIZE}
          height={ROWS * GRID_SIZE}
          className="border-2 border-gray-300 rounded-lg shadow-lg bg-white"
        />
      </div>

      <div className="text-center text-sm text-gray-600 space-y-2">
        <p>Use arrow keys or WASD to move Pac-Man</p>
        <p>Collect all pellets while avoiding stop signs and walls</p>
        <p className="font-semibold">Pellets collected: {Math.floor(score / 10)}</p>
      </div>
    </div>
  );
}
