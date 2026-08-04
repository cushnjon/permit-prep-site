import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";

interface CrosswordWord {
  id: number;
  direction: "horizontal" | "vertical";
  length: number;
  gridStart: [number, number];
  term: string;
  sentence: string;
  highlightWord: string;
}

interface CrosswordData {
  words: CrosswordWord[];
  gridMetadata: {
    totalWords: number;
    gridDimensions: { maxX: number; maxY: number };
    cellSize: number;
  };
}

export class CrosswordGrid {
  private scene: Scene;
  private data: CrosswordData;
  private gridGroup: Mesh;
  private cellMeshes: Map<string, Mesh> = new Map();
  private cellSize = 1;
  private selectedWordId: number | null = null;
  private wordCellMap: Map<number, string[]> = new Map();

  constructor(scene: Scene, data: CrosswordData) {
    this.scene = scene;
    this.data = data;
    this.cellSize = 1;

    // Create a parent mesh to hold all grid cells
    this.gridGroup = (MeshBuilder as any).CreateBox(
      "gridGroup",
      { size: 0.01 },
      scene
    );
    this.gridGroup.isVisible = false;

    this.createGrid();
  }

  private createGrid() {
    const gridMaterial = new StandardMaterial("gridMaterial", this.scene);
    (gridMaterial as any).diffuse = new Color3(1, 1, 1);
    (gridMaterial as any).specularColor = new Color3(0.5, 0.5, 0.5);
    (gridMaterial as any).emissiveColor = new Color3(0.15, 0.15, 0.15);

    // Create cells for each word
    const cellPositions = new Set<string>();

    for (const word of this.data.words) {
      const positions = this.getWordCellPositions(word);
      const cellKeys: string[] = [];

      for (const pos of positions) {
        const key = `${pos.x},${pos.y}`;
        if (cellPositions.has(key)) {
          cellKeys.push(key);
          continue;
        }
        cellPositions.add(key);
        cellKeys.push(key);

        const cell = (MeshBuilder as any).CreateBox(
          `cell_${pos.x}_${pos.y}`,
          { size: this.cellSize, updatable: false },
          this.scene
        );

        // Position cells in a grid layout
        cell.position = new Vector3(
          (pos.x * this.cellSize) / 2,
          0,
          (pos.y * this.cellSize) / 2
        );

        cell.material = gridMaterial;
        cell.parent = this.gridGroup;

        // Store cell reference
        this.cellMeshes.set(key, cell);

        // Add number label if it's a word start
        if (word.gridStart[0] === pos.x && word.gridStart[1] === pos.y) {
          this.addNumberLabel(cell, word.id);
        }
      }

      this.wordCellMap.set(word.id, cellKeys);
    }

    // Center the grid
    this.centerGrid();
  }

  private getWordCellPositions(
    word: CrosswordWord
  ): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];
    const [startX, startY] = word.gridStart;

    if (word.direction === "horizontal") {
      for (let i = 0; i < word.length; i++) {
        positions.push({ x: startX + i * 3, y: startY });
      }
    } else {
      for (let i = 0; i < word.length; i++) {
        positions.push({ x: startX, y: startY + i });
      }
    }

    return positions;
  }

  private addNumberLabel(cell: Mesh, wordId: number) {
    const texture = new DynamicTexture("labelTexture_" + wordId, 128, this.scene);
    const ctx = texture.getContext();

    ctx.fillStyle = "#1e3a5f";
    ctx.fillRect(0, 0, 128, 128);

    ctx.fillStyle = "white";
    ctx.font = "bold 48px Arial";
    (ctx as any).textAlign = "center";
    (ctx as any).textBaseline = "middle";
    ctx.fillText(wordId.toString(), 64, 64);

    texture.update();

    const labelMaterial = new StandardMaterial(
      "labelMaterial_" + wordId,
      this.scene
    );
    labelMaterial.emissiveTexture = texture;

    // Create a small plane for the label on top of the cell
    const label = (MeshBuilder as any).CreatePlane(
      `label_${wordId}`,
      { size: 0.6 },
      this.scene
    );
    label.position = cell.position.add(new Vector3(0, 0.6, 0));
    label.material = labelMaterial;
    label.parent = this.gridGroup;
  }

  private centerGrid() {
    // Calculate bounding box and center
    const boundingInfo = this.gridGroup.getHierarchyBoundingVectors(true);
    const center = boundingInfo.max.add(boundingInfo.min).scale(0.5);
    this.gridGroup.position = center.scale(-1);
  }

  public selectWord(wordId: number) {
    this.selectedWordId = wordId;

    // Find all cells for this word and highlight them
    const cellKeys = this.wordCellMap.get(wordId);
    if (!cellKeys) return;

    const selectedMaterial = new StandardMaterial(
      `selectedMaterial_${wordId}`,
      this.scene
    );
    (selectedMaterial as any).diffuse = new Color3(1, 1, 0.2);
    (selectedMaterial as any).specularColor = new Color3(0.8, 0.8, 0.4);
    (selectedMaterial as any).emissiveColor = new Color3(0.4, 0.4, 0.1);

    for (const key of cellKeys) {
      const cell = this.cellMeshes.get(key);
      if (cell) {
        cell.material = selectedMaterial;
      }
    }
  }

  public deselectWord(wordId: number) {
    const cellKeys = this.wordCellMap.get(wordId);
    if (!cellKeys) return;

    const defaultMaterial = new StandardMaterial(
      `defaultMaterial_${wordId}`,
      this.scene
    );
    (defaultMaterial as any).diffuse = new Color3(1, 1, 1);
    (defaultMaterial as any).specularColor = new Color3(0.5, 0.5, 0.5);
    (defaultMaterial as any).emissiveColor = new Color3(0.15, 0.15, 0.15);

    for (const key of cellKeys) {
      const cell = this.cellMeshes.get(key);
      if (cell) {
        cell.material = defaultMaterial;
      }
    }
  }

  public getWordById(wordId: number): CrosswordWord | undefined {
    return this.data.words.find((w) => w.id === wordId);
  }

  public getAllWords(): CrosswordWord[] {
    return this.data.words;
  }

  public getGridGroup(): Mesh {
    return this.gridGroup;
  }

  public dispose() {
    this.gridGroup.dispose();
    this.cellMeshes.clear();
    this.wordCellMap.clear();
  }
}
