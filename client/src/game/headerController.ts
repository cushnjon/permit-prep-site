// HeaderController.ts - Manages the DOM header element displaying word context

export interface CrosswordWord {
  id: number;
  direction: string;
  length: number;
  gridStart: [number, number];
  term: string;
  sentence: string;
  highlightWord: string;
}

export class HeaderController {
  private headerElement: HTMLElement | null = null;

  constructor() {
    this.createHeader();
  }

  private createHeader(): void {
    // Check if header already exists
    let header = document.getElementById("crossword-header");
    if (!header) {
      header = document.createElement("div");
      header.id = "crossword-header";
      header.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
        color: white;
        padding: 16px 24px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        z-index: 1000;
        max-height: 120px;
        overflow-y: auto;
      `;
      document.body.appendChild(header);
    }
    this.headerElement = header;
  }

  updateHeader(word: CrosswordWord): void {
    if (!this.headerElement) return;

    const directionLabel = word.direction === "horizontal" ? "Across" : "Down";
    const wordInfo = `Word ${word.id} (${directionLabel}, ${word.length} letters)`;

    // Highlight the specific word in the sentence
    let highlightedSentence = word.sentence;
    if (word.highlightWord) {
      const regex = new RegExp(`(${word.highlightWord})`, "gi");
      highlightedSentence = word.sentence.replace(
        regex,
        '<span style="background-color: #FFD700; color: #000; padding: 2px 4px; border-radius: 2px; font-weight: bold;">$1</span>'
      );
    }

    this.headerElement.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: 600; color: #FFD700;">${wordInfo}</div>
      <div style="font-size: 13px; line-height: 1.5;">${highlightedSentence}</div>
    `;
  }

  dispose(): void {
    if (this.headerElement && this.headerElement.parentNode) {
      this.headerElement.parentNode.removeChild(this.headerElement);
      this.headerElement = null;
    }
  }
}
