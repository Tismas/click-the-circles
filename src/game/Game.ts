import type { System } from "../ecs/System";
import { eventBus } from "../events/EventBus";

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

  private shakeIntensity: number = 0;
  private shakeDuration: number = 0;
  private shakeTime: number = 0;

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
    
    eventBus.on("circleKilled", () => {
      this.shake(8, 200);
    });
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
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
    }

    for (const system of this.systems) {
      system.update(dt);
    }
  }

  shake(intensity: number, duration: number): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTime = duration;
  }

  private render(): void {
    this.ctx.save();

    if (this.shakeTime > 0) {
      const progress = this.shakeTime / this.shakeDuration;
      const currentIntensity = this.shakeIntensity * progress;
      const offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
      const offsetY = (Math.random() - 0.5) * 2 * currentIntensity;
      this.ctx.translate(offsetX, offsetY);
    }

    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(0.5, "#16213e");
    gradient.addColorStop(1, "#0f3460");

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(-10, -10, this.canvas.width + 20, this.canvas.height + 20);

    for (const system of this.systems) {
      system.render();
    }

    this.ctx.restore();
  }
}
