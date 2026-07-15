import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { GlowLayer } from "@babylonjs/core/Layers/glowLayer";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { TrafficSignManager } from "./trafficSignManager";
import { BowlingBallManager } from "./bowlingBallManager";

export interface GameHandle {
  scene: Scene;
  dispose: () => void;
}

export async function createGameScene(
  engine: Engine,
  canvas: HTMLCanvasElement
): Promise<GameHandle> {
  const scene = new Scene(engine);
  scene.collisionsEnabled = true;
  scene.gravity = new Vector3(0, -9.81, 0);

  // Camera
  const camera = new ArcRotateCamera(
    "camera",
    Math.PI / 2,
    Math.PI / 2.5,
    100,
    new Vector3(0, 0, 0),
    scene
  );
  camera.attachControl(canvas, true);
  camera.minZ = 0.1;

  // Lighting
  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
  light.intensity = 0.8;

  const pointLight = new PointLight("pointLight", new Vector3(0, 50, 0), scene);
  pointLight.intensity = 0.5;

  // Glow layer for cinematic effect
  const glow = new GlowLayer("glow", scene);

  // Create ground
  const ground = MeshBuilder.CreateGround("ground", { width: 200, height: 200 }, scene);
  const groundMat = new StandardMaterial("groundMat", scene);
  groundMat.emissiveColor = new Color3(0.2, 0.2, 0.2);
  ground.material = groundMat;

  // Create sky
  const skybox = MeshBuilder.CreateBox("skybox", { size: 500 }, scene);
  const skyMat = new StandardMaterial("sky", scene);
  skyMat.emissiveColor = new Color3(0.1, 0.2, 0.3);
  skybox.material = skyMat;

  // Traffic Sign Manager (top section with blur-to-opacity animation)
  const signManager = new TrafficSignManager(scene, glow);
  await signManager.initialize();

  // Bowling Ball Manager (bottom section with swipe/tilt controls)
  const ballManager = new BowlingBallManager(scene, canvas, glow);
  await ballManager.initialize();

  // Handle dispose
  const dispose = () => {
    signManager.dispose();
    ballManager.dispose();
    scene.dispose();
  };

  return {
    scene,
    dispose,
  };
}
