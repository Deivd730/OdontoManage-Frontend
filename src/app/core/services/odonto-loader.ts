export class OdontoLoader {
  private readonly text = "OdontoManage";
  private readonly fallbackBackground = "#e0e0e0";
  private readonly rootId = "odonto-loader-root";
  private readonly styleId = "odonto-loader-style";
  private readonly visibleClass = "odonto-loader-visible";
  private readonly fps = 15;
  private readonly frameMs = 1000 / this.fps;
  private readonly revealDurationMs = 1600;
  private intervalId: number | null = null;
  private hideTimeoutId: number | null = null;
  private loopRestartTimeoutId: number | null = null;
  private cycleStartAt = 0;
  private hasCompletedFirstCycle = false;
  private hideRequested = false;

  show(): void {
    if (document.getElementById(this.rootId)) {
      return;
    }

    this.clearTimers();
    this.hasCompletedFirstCycle = false;
    this.hideRequested = false;
    this.injectStyle();

    const root = document.createElement("div");
    root.id = this.rootId;
    root.innerHTML = "<div class=\"odonto-loader-stage\"><span class=\"odonto-loader-word\"></span></div>";
    document.body.appendChild(root);

    const wordElement = root.querySelector(".odonto-loader-word") as HTMLSpanElement | null;
    if (!wordElement) {
      return;
    }

    wordElement.textContent = "";

    requestAnimationFrame(() => {
      root.classList.add(this.visibleClass);
    });

    this.cycleStartAt = performance.now();
    this.intervalId = window.setInterval(() => {
      const elapsed = performance.now() - this.cycleStartAt;
      const progress = Math.min(1, elapsed / this.revealDurationMs);
      const eased = this.easeOutCubic(progress);
      const visibleChars = Math.min(this.text.length, Math.ceil(eased * this.text.length));
      wordElement.textContent = this.text.slice(0, visibleChars);

      if (progress >= 1) {
        this.hasCompletedFirstCycle = true;
        if (this.hideRequested) {
          this.finishHide();
          return;
        }

        this.cycleStartAt = performance.now();
        this.loopRestartTimeoutId = window.setTimeout(() => {
          wordElement.textContent = "";
        }, this.frameMs);
      }
    }, this.frameMs);
  }

  hide(): void {
    const root = document.getElementById(this.rootId);
    if (!root) {
      return;
    }

    if (!this.hasCompletedFirstCycle) {
      this.hideRequested = true;
      return;
    }

    this.finishHide();
  }

  private finishHide(): void {
    const root = document.getElementById(this.rootId);
    if (!root) {
      return;
    }

    this.clearTimers();
    root.classList.remove(this.visibleClass);

    this.hideTimeoutId = window.setTimeout(() => {
      root.remove();
      const style = document.getElementById(this.styleId);
      style?.remove();
    }, 280);
  }

  private clearTimers(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.hideTimeoutId !== null) {
      window.clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = null;
    }

    if (this.loopRestartTimeoutId !== null) {
      window.clearTimeout(this.loopRestartTimeoutId);
      this.loopRestartTimeoutId = null;
    }
  }

  private easeOutCubic(value: number): number {
    return 1 - Math.pow(1 - value, 3);
  }

  private injectStyle(): void {
    if (document.getElementById(this.styleId)) {
      return;
    }

    const pageBackground = this.getPageBackgroundColor();

    const style = document.createElement("style");
    style.id = this.styleId;
    style.textContent = `
      #${this.rootId} {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${pageBackground};
        opacity: 0;
        transition: opacity 280ms ease;
      }

      #${this.rootId}.${this.visibleClass} {
        opacity: 1;
      }

      #${this.rootId} .odonto-loader-stage {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
      }

      #${this.rootId} .odonto-loader-word {
        color: #000000;
        font-family: "Italiana", "Times New Roman", Georgia, serif;
        font-size: clamp(2rem, 4.2vw, 3.3rem);
        line-height: 1;
        letter-spacing: 0.01em;
        opacity: 1;
        transition: opacity 120ms ease-out;
        user-select: none;
      }
    `;
    document.head.appendChild(style);
  }

  private getPageBackgroundColor(): string {
    const bodyColor = window.getComputedStyle(document.body).backgroundColor;
    const htmlColor = window.getComputedStyle(document.documentElement).backgroundColor;

    if (this.isUsableBackground(bodyColor)) {
      return bodyColor;
    }

    if (this.isUsableBackground(htmlColor)) {
      return htmlColor;
    }

    return this.fallbackBackground;
  }

  private isUsableBackground(value: string): boolean {
    return value !== "" && value !== "transparent" && value !== "rgba(0, 0, 0, 0)";
  }
}