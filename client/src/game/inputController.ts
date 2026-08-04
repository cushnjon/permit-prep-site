import { CameraController } from "./cameraController";
import { HeaderController } from "./headerController";
import { CrosswordGrid } from "./crosswordGrid";

export class InputController {
  private canvas: HTMLCanvasElement;
  private cameraController: CameraController;
  private headerController: HeaderController;
  private gridController: CrosswordGrid;
  private touchStartY: number = 0;
  private scrollAccumulator: number = 0;
  private scrollThreshold: number = 50;

  constructor(
    canvas: HTMLCanvasElement,
    cameraController: CameraController,
    headerController: HeaderController,
    gridController: CrosswordGrid
  ) {
    this.canvas = canvas;
    this.cameraController = cameraController;
    this.headerController = headerController;
    this.gridController = gridController;

    this.setupInputListeners();
  }

  private setupInputListeners() {
    // Scroll wheel navigation
    this.canvas.addEventListener("wheel", (e) => this.handleWheel(e), {
      passive: false,
    });

    // Touch swipe navigation
    this.canvas.addEventListener("touchstart", (e) => this.handleTouchStart(e));
    this.canvas.addEventListener("touchend", (e) => this.handleTouchEnd(e));

    // Keyboard navigation
    document.addEventListener("keydown", (e) => this.handleKeyDown(e));

    // Arrow keys for navigation
    window.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        this.cameraController.previousWord();
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        this.cameraController.nextWord();
      }
    });
  }

  private handleWheel(e: WheelEvent) {
    e.preventDefault();

    // Accumulate scroll delta
    this.scrollAccumulator += e.deltaY;

    if (this.scrollAccumulator > this.scrollThreshold) {
      this.cameraController.nextWord();
      this.scrollAccumulator = 0;
    } else if (this.scrollAccumulator < -this.scrollThreshold) {
      this.cameraController.previousWord();
      this.scrollAccumulator = 0;
    }
  }

  private handleTouchStart(e: TouchEvent) {
    if (e.touches.length > 0) {
      this.touchStartY = e.touches[0].clientY;
    }
  }

  private handleTouchEnd(e: TouchEvent) {
    if (e.changedTouches.length > 0) {
      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = this.touchStartY - touchEndY;

      // Swipe up = next word, swipe down = previous word
      if (deltaY > this.scrollThreshold) {
        this.cameraController.nextWord();
      } else if (deltaY < -this.scrollThreshold) {
        this.cameraController.previousWord();
      }
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    // Number keys 1-9 to jump to specific words
    const keyNum = parseInt(e.key);
    if (keyNum >= 1 && keyNum <= 9) {
      const words = this.gridController.getAllWords();
      if (keyNum <= words.length) {
        this.cameraController.navigateToWord(keyNum);
      }
    }
  }

  public dispose() {
    this.canvas.removeEventListener("wheel", (e) => this.handleWheel(e));
    this.canvas.removeEventListener("touchstart", (e) =>
      this.handleTouchStart(e)
    );
    this.canvas.removeEventListener("touchend", (e) => this.handleTouchEnd(e));
    document.removeEventListener("keydown", (e) => this.handleKeyDown(e));
  }
}
