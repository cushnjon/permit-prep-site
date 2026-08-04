import { WordInputPuzzle } from "./wordInputPuzzle";

interface CrosswordWord {
  id: number;
  direction: "horizontal" | "vertical";
  length: number;
  gridStart: [number, number];
  term: string;
  sentence: string;
  highlightWord: string;
}

export class HeaderController {
  private currentWord: CrosswordWord | null = null;
  private headerElement: HTMLElement | null = null;
  private wordInputPuzzle: WordInputPuzzle;
  private onWordClickCallback: ((word: CrosswordWord) => void) | null = null;

  constructor() {
    this.wordInputPuzzle = new WordInputPuzzle();
    this.createHeaderElement();
  }

  private createHeaderElement() {
    // Check if header already exists
    let header = document.getElementById("crossword-header");
    if (!header) {
      header = document.createElement("div");
      header.id = "crossword-header";
      header.className =
        "fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl";
      header.style.cssText = `
        padding: 1.5rem 2rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        border-bottom: 3px solid #ffd700;
        min-height: 120px;
        display: flex;
        align-items: center;
      `;
      document.body.insertBefore(header, document.body.firstChild);
    }
    this.headerElement = header;
  }

  public updateHeader(word: CrosswordWord) {
    this.currentWord = word;

    if (!this.headerElement) {
      this.createHeaderElement();
    }

    // Split sentence and highlight the word
    const sentence = word.sentence;
    const highlightWord = word.highlightWord;

    // Create highlighted HTML with proper escaping and word boundary matching
    const regex = new RegExp(`\\b(${highlightWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, "gi");
    const highlightedSentence = sentence.replace(
      regex,
      '<span style="background-color: #ffd700; color: #1e3a5f; font-weight: bold; padding: 0.3em 0.6em; border-radius: 0.35em; display: inline-block; box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);">$1</span>'
    );

    if (this.headerElement) {
      this.headerElement.innerHTML = `
        <div style="width: 100%; max-width: 1400px; margin: 0 auto;">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem;">
            <div style="
              background-color: #ffd700;
              color: #1e3a5f;
              padding: 0.5rem 1rem;
              border-radius: 0.5rem;
              font-weight: bold;
              font-size: 0.875rem;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              min-width: fit-content;
            ">
              Word ${word.id}
            </div>
            <div style="
              font-size: 0.875rem;
              color: #cbd5e1;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              display: flex;
              gap: 1rem;
            ">
              <span>${word.direction === "horizontal" ? "→ ACROSS" : "↓ DOWN"}</span>
              <span>•</span>
              <span>${word.length} LETTERS</span>
            </div>
          </div>
          <div style="
            font-size: 1.125rem;
            line-height: 1.8;
            color: #f1f5f9;
            letter-spacing: 0.3px;
            font-weight: 500;
            cursor: text;
          ">
            ${highlightedSentence}
          </div>
        </div>
      `;
      
      // Make highlighted words clickable
      const highlightedElements = this.headerElement.querySelectorAll('span[style*="background-color: #ffd700"]');
      highlightedElements.forEach((el) => {
        (el as HTMLElement).style.cursor = "pointer";
        el.addEventListener("click", () => {
          this.wordInputPuzzle.updatePuzzle(word);
          if (this.onWordClickCallback) {
            this.onWordClickCallback(word);
          }
        });
      });
    }
    
    // Also update the puzzle with the current word
    this.wordInputPuzzle.updatePuzzle(word);
  }

  public getCurrentWord(): CrosswordWord | null {
    return this.currentWord;
  }

  public setOnWordClickCallback(callback: (word: CrosswordWord) => void) {
    this.onWordClickCallback = callback;
  }

  public dispose() {
    if (this.headerElement) {
      this.headerElement.remove();
    }
    this.wordInputPuzzle.dispose();
  }
}
