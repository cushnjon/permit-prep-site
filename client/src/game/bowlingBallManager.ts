import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { GlowLayer } from "@babylonjs/core/Layers/glowLayer";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";

interface BowlingBall {
  mesh: Mesh;
  velocity: Vector3;
  label: string;
}

export class BowlingBallManager {
  private scene: Scene;
  private canvas: HTMLCanvasElement;
  private glow: GlowLayer;
  private balls: BowlingBall[] = [];
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private selectedBall: BowlingBall | null = null;

  constructor(scene: Scene, canvas: HTMLCanvasElement, glow: GlowLayer) {
    this.scene = scene;
    this.canvas = canvas;
    this.glow = glow;
  }

  async initialize() {
    // Create bowling balls with traffic sign labels
    const ballData = [
      { label: "Stop", color: new Color3(1, 0, 0), x: -20 },
      { label: "Yield", color: new Color3(1, 0, 0), x: -12 },
      { label: "Speed Limit", color: new Color3(1, 1, 0), x: -4 },
      { label: "Left Turn", color: new Color3(1, 1, 0), x: 4 },
      { label: "Pedestrian", color: new Color3(1, 1, 0), x: 12 },
      { label: "No Parking", color: new Color3(1, 0.5, 0), x: 20 },
      { label: "Road Work", color: new Color3(1, 0.5, 0), x: 28 },
    ];

    ballData.forEach((data) => {
      const ball = MeshBuilder.CreateSphere(
        `ball_${data.label}`,
        { diameter: 2, segments: 32 },
        this.scene
      );
      ball.position = new Vector3(data.x, 2, 0);

      const ballMat = new StandardMaterial(`ballMat_${data.label}`, this.scene);
      ballMat.emissiveColor = data.color;
      ball.material = ballMat;

      // Add label texture
      const texture = new DynamicTexture(`ballTexture_${data.label}`, 256, this.scene);
      const ctx = texture.getContext() as CanvasRenderingContext2D;
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = "white";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText(data.label, 128, 128);
      texture.update();

      ballMat.emissiveTexture = texture;

      this.balls.push({
        mesh: ball,
        velocity: Vector3.Zero(),
        label: data.label,
      });

      this.glow.addIncludedOnlyMesh(ball);
    });

    // Add touch/mouse event listeners
    this.canvas.addEventListener("touchstart", (e) => this.onTouchStart(e));
    this.canvas.addEventListener("touchmove", (e) => this.onTouchMove(e));
    this.canvas.addEventListener("touchend", (e) => this.onTouchEnd(e));
    this.canvas.addEventListener("mousedown", (e) => this.onMouseDown(e));
    this.canvas.addEventListener("mousemove", (e) => this.onMouseMove(e));
    this.canvas.addEventListener("mouseup", (e) => this.onMouseUp(e));

    // Physics update loop
    this.scene.registerBeforeRender(() => this.updatePhysics());
  }

  private onTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;

    // Pick ball
    this.selectedBall = this.pickBall(touch.clientX, touch.clientY);
  }

  private onTouchMove(e: TouchEvent) {
    if (!this.selectedBall) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;

    // Tilt the ball
    this.selectedBall.mesh.rotation.x += deltaY * 0.01;
    this.selectedBall.mesh.rotation.z += deltaX * 0.01;
  }

  private onTouchEnd(e: TouchEvent) {
    if (!this.selectedBall) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;

    // Launch the ball
    const force = Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 0.1;
    this.selectedBall.velocity = new Vector3(
      deltaX * 0.05,
      0,
      -deltaY * 0.05
    );

    this.selectedBall = null;
  }

  private onMouseDown(e: MouseEvent) {
    this.touchStartX = e.clientX;
    this.touchStartY = e.clientY;
    this.selectedBall = this.pickBall(e.clientX, e.clientY);
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.selectedBall) return;

    const deltaX = e.clientX - this.touchStartX;
    const deltaY = e.clientY - this.touchStartY;

    this.selectedBall.mesh.rotation.x += deltaY * 0.01;
    this.selectedBall.mesh.rotation.z += deltaX * 0.01;
  }

  private onMouseUp(e: MouseEvent) {
    if (!this.selectedBall) return;

    const deltaX = e.clientX - this.touchStartX;
    const deltaY = e.clientY - this.touchStartY;

    this.selectedBall.velocity = new Vector3(
      deltaX * 0.05,
      0,
      -deltaY * 0.05
    );

    this.selectedBall = null;
  }

  private pickBall(x: number, y: number): BowlingBall | null {
    // Simple pick based on screen position
    // In a real implementation, use Babylon's picking system
    const normalizedX = (x / this.canvas.width) * 2 - 1;
    const normalizedY = (y / this.canvas.height) * 2 - 1;

    for (const ball of this.balls) {
      const screenPos = Vector3.Project(
        ball.mesh.position,
        this.scene.getTransformMatrix(),
        this.scene.activeCamera!.getProjectionMatrix(),
        this.scene.activeCamera!.viewport.toGlobal(this.canvas.width, this.canvas.height)
      );

      const dist = Math.sqrt(
        Math.pow(screenPos.x - x, 2) + Math.pow(screenPos.y - y, 2)
      );

      if (dist < 50) {
        return ball;
      }
    }

    return null;
  }

  private updatePhysics() {
    const deltaTime = this.scene.deltaTime / 1000;

    this.balls.forEach((ball) => {
      // Apply velocity
      ball.mesh.position.addInPlace(
        ball.velocity.scale(deltaTime)
      );

      // Apply gravity
      ball.velocity.y -= 9.81 * deltaTime;

      // Ground collision
      if (ball.mesh.position.y < 1) {
        ball.mesh.position.y = 1;
        ball.velocity.y *= -0.6; // Bounce
        ball.velocity.x *= 0.95; // Friction
        ball.velocity.z *= 0.95;
      }

      // Friction
      ball.velocity.x *= 0.98;
      ball.velocity.z *= 0.98;

      // Rotation from velocity
      if (ball.velocity.length() > 0.1) {
        ball.mesh.rotation.x += ball.velocity.z * 0.01;
        ball.mesh.rotation.z -= ball.velocity.x * 0.01;
      }
    });
  }

  dispose() {
    this.balls.forEach((ball) => {
      ball.mesh.dispose();
    });
    this.balls = [];

    this.canvas.removeEventListener("touchstart", (e) => this.onTouchStart(e));
    this.canvas.removeEventListener("touchmove", (e) => this.onTouchMove(e));
    this.canvas.removeEventListener("touchend", (e) => this.onTouchEnd(e));
    this.canvas.removeEventListener("mousedown", (e) => this.onMouseDown(e));
    this.canvas.removeEventListener("mousemove", (e) => this.onMouseMove(e));
    this.canvas.removeEventListener("mouseup", (e) => this.onMouseUp(e));
  }
}
