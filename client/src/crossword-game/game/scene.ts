import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { CrosswordGrid } from "./crosswordGrid";
import { InputController } from "./inputController";
import { CameraController } from "./cameraController";
import { HeaderController } from "./headerController";
import crosswordData from "@/crossword-data/crosswordData.json";

export interface GameHandle {
  scene: Scene;
  dispose(): void;
}

export async function createGameScene(
  engine: Engine,
  canvas: HTMLCanvasElement
): Promise<GameHandle> {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.95, 0.95, 0.97, 1);
  scene.collisionsEnabled = true;

  // Setup lighting
  const ambientLight = new HemisphericLight(
    "ambientLight",
    new Vector3(0, 1, 0),
    scene
  );
  ambientLight.intensity = 0.9;

  const pointLight = new PointLight("pointLight", new Vector3(20, 30, 20), scene);
  pointLight.intensity = 0.8;
  pointLight.range = 200;

  // Setup camera
  const camera = new ArcRotateCamera(
    "camera",
    Math.PI / 2,
    Math.PI / 2.5,
    80,
    Vector3.Zero(),
    scene
  );
  camera.attachControl(canvas, true);
  camera.minZ = 0.1;
  camera.wheelPrecision = 50;
  camera.angularSensibilityX = 1000;
  camera.angularSensibilityY = 1000;

  // Initialize game components
  const gridController = new CrosswordGrid(
    scene,
    crosswordData as any
  );
  const headerController = new HeaderController();
  const cameraController = new CameraController(camera, gridController);
  const inputController = new InputController(
    canvas,
    cameraController,
    headerController,
    gridController
  );

  // Setup synchronization: when camera navigates, update header and puzzle
  cameraController.setOnNavigateCallback((wordId: number) => {
    const word = gridController.getWordById(wordId);
    if (word) {
      headerController.updateHeader(word as any);
    }
  });

  // Initialize header with first word
  headerController.updateHeader(crosswordData.words[0] as any);

  // Navigate to first word to set initial camera position
  await cameraController.navigateToWord(1);

  const dispose = () => {
    inputController.dispose();
    cameraController.dispose();
    gridController.dispose();
    scene.dispose();
  };

  return { scene, dispose };
}
