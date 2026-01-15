import type { System } from "../ecs/System";

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  private fpsElement: HTMLDivElement;
  private systems: System[] = [];

  private lastTime: number = 0;
  private deltaTime: number = 0;
  private tickAccumulator: number = 0;

  private readonly TICK_RATE: number = 20;
  private readonly TICK_DURATION: number = 1000 / this.TICK_RATE;

  private frameCount: number = 0;
  private fpsAccumulator: number = 0;
  private currentFps: number = 0;

  private tickCount: number = 0;
  private tickDisplayAccumulator: number = 0;
  private ticksPerSecond: number = 0;

  private isRunning: boolean = false;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.id = "gameCanvas";

    const context = this.canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get 2D context");
    }
    this.ctx = context;

    this.fpsElement = document.createElement("div");
    this.fpsElement.id = "fps-counter";
    this.fpsElement.textContent = "FPS: 0";

    const app = document.querySelector<HTMLDivElement>("#app");
    if (!app) {
      throw new Error("Could not find #app element");
    }
    app.innerHTML = "";
    app.appendChild(this.canvas);
    app.appendChild(this.fpsElement);

    this.handleResize();
    window.addEventListener("resize", () => this.handleResize());
  }

  private handleResize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  stop(): void {
    this.isRunning = false;
  }

  private gameLoop = (currentTime: number): void => {
    if (!this.isRunning) return;

    this.deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.frameCount++;
    this.fpsAccumulator += this.deltaTime;
    this.tickDisplayAccumulator += this.deltaTime;

    if (this.fpsAccumulator >= 1000) {
      this.currentFps = this.frameCount;
      this.ticksPerSecond = this.tickCount;
      this.frameCount = 0;
      this.tickCount = 0;
      this.fpsAccumulator -= 1000;
      this.tickDisplayAccumulator = 0;
      this.fpsElement.textContent = `FPS: ${this.currentFps} | Ticks: ${this.ticksPerSecond}/s`;
    }

    this.tickAccumulator += this.deltaTime;
    while (this.tickAccumulator >= this.TICK_DURATION) {
      this.fixedUpdate();
      this.tickAccumulator -= this.TICK_DURATION;
      this.tickCount++;
    }

    this.update(this.deltaTime);
    this.render();

    requestAnimationFrame(this.gameLoop);
  };

  addSystem(system: System): void {
    this.systems.push(system);
  }

  private fixedUpdate(): void {
    for (const system of this.systems) {
      system.fixedUpdate();
    }
  }

  private update(dt: number): void {
    for (const system of this.systems) {
      system.update(dt);
    }
  }

  private render(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(0.5, "#16213e");
    gradient.addColorStop(1, "#0f3460");

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const system of this.systems) {
      system.render();
    }
  }
}
