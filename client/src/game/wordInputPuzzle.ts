interface CrosswordWord {
  id: number;
  direction: "horizontal" | "vertical";
  length: number;
  gridStart: [number, number];
  term: string;
  sentence: string;
  highlightWord: string;
}

export class WordInputPuzzle {
  private puzzleContainer: HTMLElement | null = null;
  private currentWord: CrosswordWord | null = null;
  private inputBoxes: HTMLInputElement[] = [];

  constructor() {
    this.createPuzzleContainer();
  }

  private createPuzzleContainer() {
    // Check if puzzle container already exists
    let container = document.getElementById("word-input-puzzle");
    if (!container) {
      container = document.createElement("div");
      container.id = "word-input-puzzle";
      container.style.cssText = `
        position: fixed;
        top: 1.5rem;
        right: 2rem;
        z-index: 50;
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        padding: 1.5rem;
        border-radius: 0.75rem;
        border: 2px solid #ffd700;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        min-width: 300px;
      `;
      document.body.appendChild(container);
    }
    this.puzzleContainer = container;
  }

  public updatePuzzle(word: CrosswordWord) {
    this.currentWord = word;
    this.inputBoxes = [];

    if (!this.puzzleContainer) {
      this.createPuzzleContainer();
    }

    // Clear previous content
    this.puzzleContainer!.innerHTML = "";

    // Create header
    const header = document.createElement("div");
    header.style.cssText = `
      font-size: 0.875rem;
      color: #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
      display: flex;
      gap: 0.5rem;
      align-items: center;
    `;
    header.innerHTML = `
      <span style="background-color: #ffd700; color: #1e3a5f; padding: 0.25rem 0.75rem; border-radius: 0.25rem; font-weight: bold;">
        Word ${word.id}
      </span>
      <span>${word.direction === "horizontal" ? "→ ACROSS" : "↓ DOWN"}</span>
      <span>•</span>
      <span>${word.length} letters</span>
    `;
    this.puzzleContainer!.appendChild(header);

    // Create input boxes container
    const boxesContainer = document.createElement("div");
    boxesContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(2.5rem, 1fr));
      gap: 0.5rem;
      margin-top: 1rem;
    `;

    const correctAnswer = word.term;

    // Create input boxes for each letter
    for (let i = 0; i < word.length; i++) {
      const box = document.createElement("input");
      box.type = "text";
      box.maxLength = 1;
      box.value = "";
      box.dataset.index = i.toString();
      box.dataset.correct = correctAnswer[i].toUpperCase();

      box.style.cssText = `
        width: 100%;
        height: 2.5rem;
        text-align: center;
        font-size: 1.25rem;
        font-weight: bold;
        border: 2px solid #cbd5e1;
        border-radius: 0.375rem;
        background-color: #f8f9fa;
        color: #1e3a5f;
        text-transform: uppercase;
        transition: all 0.2s ease;
        cursor: text;
      `;

      box.addEventListener("input", (e) => this.handleInput(e, box, i, word.length));
      box.addEventListener("keydown", (e) => this.handleKeyDown(e, i, word.length));
      box.addEventListener("focus", () => {
        box.style.borderColor = "#ffd700";
        box.style.boxShadow = "0 0 8px rgba(255, 215, 0, 0.3)";
      });
      box.addEventListener("blur", () => {
        box.style.boxShadow = "none";
        if (!box.value) {
          box.style.borderColor = "#cbd5e1";
        }
      });

      boxesContainer.appendChild(box);
      this.inputBoxes.push(box);
    }

    this.puzzleContainer!.appendChild(boxesContainer);

    // Create reset button
    const resetButton = document.createElement("button");
    resetButton.textContent = "Clear";
    resetButton.style.cssText = `
      margin-top: 1rem;
      width: 100%;
      padding: 0.5rem;
      background-color: #1e3a5f;
      color: white;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      font-weight: bold;
      transition: background-color 0.2s ease;
    `;
    resetButton.addEventListener("mouseover", () => {
      resetButton.style.backgroundColor = "#2c5282";
    });
    resetButton.addEventListener("mouseout", () => {
      resetButton.style.backgroundColor = "#1e3a5f";
    });
    resetButton.addEventListener("click", () => this.clearPuzzle());

    this.puzzleContainer!.appendChild(resetButton);

    // Focus first box
    if (this.inputBoxes.length > 0) {
      this.inputBoxes[0].focus();
    }
  }

  private handleInput(
    e: Event,
    box: HTMLInputElement,
    index: number,
    wordLength: number
  ) {
    const input = e.target as HTMLInputElement;
    const value = input.value.toUpperCase();

    if (value.length > 1) {
      input.value = value.charAt(0);
      return;
    }

    if (value) {
      input.value = value;
      const correctLetter = input.dataset.correct;

      // Check if correct
      if (value === correctLetter) {
        input.style.backgroundColor = "#10b981";
        input.style.borderColor = "#059669";
        input.style.color = "white";
      } else {
        input.style.backgroundColor = "#ef4444";
        input.style.borderColor = "#dc2626";
        input.style.color = "white";
      }

      // Move to next box
      if (index < wordLength - 1) {
        this.inputBoxes[index + 1].focus();
      }
    } else {
      input.style.backgroundColor = "#f8f9fa";
      input.style.borderColor = "#cbd5e1";
      input.style.color = "#1e3a5f";
    }
  }

  private handleKeyDown(e: KeyboardEvent, index: number, wordLength: number) {
    const input = e.target as HTMLInputElement;

    if (e.key === "Backspace") {
      if (input.value === "" && index > 0) {
        e.preventDefault();
        this.inputBoxes[index - 1].focus();
        this.inputBoxes[index - 1].value = "";
        this.inputBoxes[index - 1].style.backgroundColor = "#f8f9fa";
        this.inputBoxes[index - 1].style.borderColor = "#cbd5e1";
        this.inputBoxes[index - 1].style.color = "#1e3a5f";
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      this.inputBoxes[index - 1].focus();
    } else if (e.key === "ArrowRight" && index < wordLength - 1) {
      e.preventDefault();
      this.inputBoxes[index + 1].focus();
    }
  }

  private clearPuzzle() {
    for (const box of this.inputBoxes) {
      box.value = "";
      box.style.backgroundColor = "#f8f9fa";
      box.style.borderColor = "#cbd5e1";
      box.style.color = "#1e3a5f";
    }
    if (this.inputBoxes.length > 0) {
      this.inputBoxes[0].focus();
    }
  }

  public dispose() {
    if (this.puzzleContainer) {
      this.puzzleContainer.remove();
    }
  }
}
