import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { GlowLayer } from "@babylonjs/core/Layers/glowLayer";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";

export class TrafficSignManager {
  private scene: Scene;
  private glow: GlowLayer;
  private signs: Mesh[] = [];
  private startTime: number = 0;
  private duration: number = 120000; // 2 minutes in milliseconds

  constructor(scene: Scene, glow: GlowLayer) {
    this.scene = scene;
    this.glow = glow;
  }

  async initialize() {
    // Create traffic signs lined up with poles
    const signData = [
      { name: "Stop", color: new Color3(1, 0, 0), x: -40 },
      { name: "Yield", color: new Color3(1, 0, 0), x: -30 },
      { name: "Speed Limit", color: new Color3(1, 1, 1), x: -20 },
      { name: "Do Not Enter", color: new Color3(1, 0, 0), x: -10 },
      { name: "One Way", color: new Color3(1, 1, 1), x: 0 },
      { name: "No Parking", color: new Color3(1, 1, 1), x: 10 },
      { name: "Pedestrian", color: new Color3(1, 1, 0), x: 20 },
      { name: "School Zone", color: new Color3(1, 1, 0), x: 30 },
    ];

    signData.forEach((data) => {
      // Create pole
      const pole = MeshBuilder.CreateCylinder(
        `pole_${data.name}`,
        { height: 15, diameter: 0.5 },
        this.scene
      );
      pole.position = new Vector3(data.x, 7.5, 0);

      const poleMat = new StandardMaterial(`poleMat_${data.name}`, this.scene);
      poleMat.emissiveColor = new Color3(0.3, 0.3, 0.3);
      pole.material = poleMat;

      // Create sign box
      const sign = MeshBuilder.CreateBox(
        `sign_${data.name}`,
        { width: 3, height: 2, depth: 0.1 },
        this.scene
      );
      sign.position = new Vector3(data.x, 12, 0);

      const signMat = new StandardMaterial(`signMat_${data.name}`, this.scene);
      signMat.emissiveColor = data.color;
      sign.material = signMat;

      // Add text to sign
      const texture = new DynamicTexture(`texture_${data.name}`, 512, this.scene);
      const ctx = texture.getContext() as CanvasRenderingContext2D;
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = "white";
      ctx.font = "bold 60px Arial";
      ctx.textAlign = "center";
      (ctx as any).fillText(data.name, 256, 256);
      texture.update();

      signMat.emissiveTexture = texture;

      // Initial blur effect (100% blur) - start more visible
      sign.visibility = 0.3;
      this.signs.push(sign);
      this.glow.addIncludedOnlyMesh(sign);
    });

    // Start the animation
    this.startTime = Date.now();
    this.scene.registerBeforeRender(() => this.updateBlurAnimation());
  }

  private updateBlurAnimation() {
    const elapsed = Date.now() - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);

    // Animate from 0.3 (high blur) to 1 (full opacity)
    const visibility = 0.3 + progress * 0.7;

    this.signs.forEach((sign) => {
      sign.visibility = visibility;
    });
  }

  dispose() {
    this.signs.forEach((sign) => {
      sign.dispose();
    });
    this.signs = [];
  }
}
