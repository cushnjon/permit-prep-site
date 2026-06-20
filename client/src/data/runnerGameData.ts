export interface TrafficObstacle {
  id: string;
  type: 'car' | 'truck' | 'pedestrian' | 'stop_sign' | 'traffic_light';
  position: number; // Distance from start (0-1000)
  width: number;
  hasRightOfWay: boolean;
  direction: 'left' | 'right' | 'down' | 'stationary';
  speed: number;
  color: string;
  label: string;
}

export interface RunnerLevel {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  obstacles: TrafficObstacle[];
  safeZones: Array<{ start: number; end: number; description: string }>;
  totalDistance: number;
  timeLimit: number;
}

export const runnerLevels: RunnerLevel[] = [
  {
    id: 'level_1',
    name: 'Suburban Streets',
    description: 'Navigate through quiet residential streets with occasional traffic',
    difficulty: 'easy',
    totalDistance: 1000,
    timeLimit: 60,
    obstacles: [
      {
        id: 'car_1',
        type: 'car',
        position: 150,
        width: 80,
        hasRightOfWay: true,
        direction: 'right',
        speed: 3,
        color: '#FF6B6B',
        label: 'Red Car'
      },
      {
        id: 'safe_1',
        type: 'stop_sign',
        position: 250,
        width: 40,
        hasRightOfWay: false,
        direction: 'stationary',
        speed: 0,
        color: '#FF0000',
        label: 'Stop Sign'
      },
      {
        id: 'car_2',
        type: 'car',
        position: 400,
        width: 80,
        hasRightOfWay: false,
        direction: 'left',
        speed: 2,
        color: '#4ECDC4',
        label: 'Teal Car'
      },
      {
        id: 'pedestrian_1',
        type: 'pedestrian',
        position: 550,
        width: 30,
        hasRightOfWay: true,
        direction: 'down',
        speed: 1.5,
        color: '#FFD93D',
        label: 'Pedestrian'
      },
      {
        id: 'car_3',
        type: 'car',
        position: 700,
        width: 80,
        hasRightOfWay: true,
        direction: 'right',
        speed: 2.5,
        color: '#6BCB77',
        label: 'Green Car'
      },
      {
        id: 'truck_1',
        type: 'truck',
        position: 850,
        width: 100,
        hasRightOfWay: false,
        direction: 'left',
        speed: 2,
        color: '#FF8C42',
        label: 'Orange Truck'
      }
    ],
    safeZones: [
      { start: 0, end: 120, description: 'Safe start zone' },
      { start: 260, end: 380, description: 'After stop sign' },
      { start: 560, end: 680, description: 'After pedestrian crossing' },
      { start: 900, end: 1000, description: 'Finish line' }
    ]
  },
  {
    id: 'level_2',
    name: 'Busy Intersection',
    description: 'Navigate a complex intersection with multiple traffic flows',
    difficulty: 'medium',
    totalDistance: 1200,
    timeLimit: 75,
    obstacles: [
      {
        id: 'car_1',
        type: 'car',
        position: 100,
        width: 80,
        hasRightOfWay: false,
        direction: 'right',
        speed: 3.5,
        color: '#FF6B6B',
        label: 'Red Car'
      },
      {
        id: 'car_2',
        type: 'car',
        position: 200,
        width: 80,
        hasRightOfWay: true,
        direction: 'left',
        speed: 3,
        color: '#4ECDC4',
        label: 'Teal Car'
      },
      {
        id: 'pedestrian_1',
        type: 'pedestrian',
        position: 350,
        width: 30,
        hasRightOfWay: true,
        direction: 'down',
        speed: 2,
        color: '#FFD93D',
        label: 'Pedestrian'
      },
      {
        id: 'truck_1',
        type: 'truck',
        position: 500,
        width: 100,
        hasRightOfWay: true,
        direction: 'right',
        speed: 2.5,
        color: '#FF8C42',
        label: 'Orange Truck'
      },
      {
        id: 'car_3',
        type: 'car',
        position: 650,
        width: 80,
        hasRightOfWay: false,
        direction: 'left',
        speed: 3.5,
        color: '#6BCB77',
        label: 'Green Car'
      },
      {
        id: 'pedestrian_2',
        type: 'pedestrian',
        position: 800,
        width: 30,
        hasRightOfWay: true,
        direction: 'down',
        speed: 1.5,
        color: '#FFD93D',
        label: 'Pedestrian'
      },
      {
        id: 'car_4',
        type: 'car',
        position: 950,
        width: 80,
        hasRightOfWay: true,
        direction: 'right',
        speed: 3,
        color: '#95E1D3',
        label: 'Mint Car'
      },
      {
        id: 'truck_2',
        type: 'truck',
        position: 1100,
        width: 100,
        hasRightOfWay: false,
        direction: 'left',
        speed: 2.5,
        color: '#C7CEEA',
        label: 'Purple Truck'
      }
    ],
    safeZones: [
      { start: 0, end: 80, description: 'Safe start zone' },
      { start: 220, end: 320, description: 'Between cars' },
      { start: 370, end: 480, description: 'After pedestrian' },
      { start: 670, end: 780, description: 'Safe passage' },
      { start: 1200, end: 1200, description: 'Finish line' }
    ]
  },
  {
    id: 'level_3',
    name: 'Highway Chaos',
    description: 'High-speed highway with rapid traffic changes',
    difficulty: 'hard',
    totalDistance: 1500,
    timeLimit: 90,
    obstacles: [
      {
        id: 'car_1',
        type: 'car',
        position: 80,
        width: 80,
        hasRightOfWay: true,
        direction: 'right',
        speed: 4.5,
        color: '#FF6B6B',
        label: 'Red Car'
      },
      {
        id: 'truck_1',
        type: 'truck',
        position: 180,
        width: 100,
        hasRightOfWay: false,
        direction: 'left',
        speed: 3.5,
        color: '#FF8C42',
        label: 'Orange Truck'
      },
      {
        id: 'car_2',
        type: 'car',
        position: 280,
        width: 80,
        hasRightOfWay: true,
        direction: 'right',
        speed: 4,
        color: '#4ECDC4',
        label: 'Teal Car'
      },
      {
        id: 'car_3',
        type: 'car',
        position: 380,
        width: 80,
        hasRightOfWay: false,
        direction: 'left',
        speed: 4.5,
        color: '#6BCB77',
        label: 'Green Car'
      },
      {
        id: 'truck_2',
        type: 'truck',
        position: 520,
        width: 100,
        hasRightOfWay: true,
        direction: 'right',
        speed: 3.5,
        color: '#C7CEEA',
        label: 'Purple Truck'
      },
      {
        id: 'car_4',
        type: 'car',
        position: 680,
        width: 80,
        hasRightOfWay: true,
        direction: 'left',
        speed: 4,
        color: '#95E1D3',
        label: 'Mint Car'
      },
      {
        id: 'car_5',
        type: 'car',
        position: 800,
        width: 80,
        hasRightOfWay: false,
        direction: 'right',
        speed: 4.5,
        color: '#FFD93D',
        label: 'Yellow Car'
      },
      {
        id: 'truck_3',
        type: 'truck',
        position: 950,
        width: 100,
        hasRightOfWay: true,
        direction: 'left',
        speed: 3.5,
        color: '#F38181',
        label: 'Pink Truck'
      },
      {
        id: 'car_6',
        type: 'car',
        position: 1100,
        width: 80,
        hasRightOfWay: false,
        direction: 'right',
        speed: 4.5,
        color: '#AA96DA',
        label: 'Lavender Car'
      },
      {
        id: 'truck_4',
        type: 'truck',
        position: 1300,
        width: 100,
        hasRightOfWay: true,
        direction: 'left',
        speed: 3.5,
        color: '#FCBAD3',
        label: 'Rose Truck'
      }
    ],
    safeZones: [
      { start: 0, end: 60, description: 'Safe start zone' },
      { start: 200, end: 260, description: 'Between traffic' },
      { start: 400, end: 500, description: 'Safe passage' },
      { start: 700, end: 780, description: 'Between cars' },
      { start: 1500, end: 1500, description: 'Finish line' }
    ]
  }
];
