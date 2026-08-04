import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CrosswordGrid } from "./crosswordGrid";

export class CameraController {
  private camera: ArcRotateCamera;
  private grid: CrosswordGrid;
  private currentWordIndex: number = 0;
  private animationDuration: number = 600; // ms
  private isAnimating: boolean = false;
  private onNavigateCallback: ((wordId: number) => void) | null = null;

  constructor(camera: ArcRotateCamera, grid: CrosswordGrid) {
    this.camera = camera;
    this.grid = grid;
  }

  public async navigateToWord(wordId: number) {
    const word = this.grid.getWordById(wordId);
    if (!word) return;

    // Deselect previous word
    const words = this.grid.getAllWords();
    const previousWord = words[this.currentWordIndex];
    if (previousWord) {
      this.grid.deselectWord(previousWord.id);
    }

    // Select new word
    this.grid.selectWord(wordId);
    
    // Trigger callback to update header and puzzle
    if (this.onNavigateCallback) {
      this.onNavigateCallback(wordId);
    }

    this.currentWordIndex = wordId - 1;
  }

  public async nextWord() {
    const words = this.grid.getAllWords();
    const nextIndex = (this.currentWordIndex + 1) % words.length;
    await this.navigateToWord(words[nextIndex].id);
  }

  public async previousWord() {
    const words = this.grid.getAllWords();
    const prevIndex =
      (this.currentWordIndex - 1 + words.length) % words.length;
    await this.navigateToWord(words[prevIndex].id);
  }



  public getCurrentWordIndex(): number {
    return this.currentWordIndex;
  }

  public setOnNavigateCallback(callback: (wordId: number) => void) {
    this.onNavigateCallback = callback;
  }

  public dispose() {
    // Cleanup if needed
  }
}
