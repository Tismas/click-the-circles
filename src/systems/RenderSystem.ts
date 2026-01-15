import { System } from "../ecs/System";
import { getEntitiesWithComponents, getComponent } from "../ecs/Component";
import type { BallType } from "../ecs/Component";
import { getHealthScale } from "../utils/healthScale";

const BALL_RADIUS = 15;

type BallColors = {
  light: string;
  mid: string;
  dark: string;
  stroke: string;
};

const BALL_COLOR_MAP: Record<BallType, BallColors> = {
  white: {
    light: "#ffffff",
    mid: "#eeeeee",
    dark: "#cccccc",
    stroke: "#aaaaaa",
  },
  blue: {
    light: "#87ceeb",
    mid: "#4da6ff",
    dark: "#2980b9",
    stroke: "#1a5276",
  },
  green: {
    light: "#90ee90",
    mid: "#2ecc71",
    dark: "#27ae60",
    stroke: "#1e8449",
  },
};

function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r}, ${g}, ${b})`;
}

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `rgb(${r}, ${g}, ${b})`;
}

export class RenderSystem extends System {
  render(): void {
    const ctx = this.game.ctx;

    this.renderCircles(ctx);
    this.renderBalls(ctx);
  }

  private renderCircles(ctx: CanvasRenderingContext2D): void {
    const entities = getEntitiesWithComponents("position", "circle");

    for (const entity of entities) {
      const pos = getComponent(entity, "position");
      const circle = getComponent(entity, "circle");

      if (!pos || !circle) continue;

      const health = getComponent(entity, "health");
      const scale = getHealthScale(health);
      const displayRadius = circle.radius * scale;

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;

      const gradient = ctx.createRadialGradient(
        pos.x - displayRadius * 0.3,
        pos.y - displayRadius * 0.3,
        0,
        pos.x,
        pos.y,
        displayRadius
      );
      gradient.addColorStop(0, lightenColor(circle.color, 60));
      gradient.addColorStop(0.5, circle.color);
      gradient.addColorStop(1, darkenColor(circle.color, 40));

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, displayRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.restore();

      if (circle.outlineWidth > 0) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, displayRadius, 0, Math.PI * 2);
        ctx.lineWidth = circle.outlineWidth;
        ctx.strokeStyle = circle.outlineColor;
        ctx.stroke();
      }

      if (health) {
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.max(16, displayRadius * 0.6)}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 4;
        ctx.fillText(Math.ceil(health.current).toString(), pos.x, pos.y);
        ctx.shadowBlur = 0;
      }
    }
  }

  private renderBalls(ctx: CanvasRenderingContext2D): void {
    const balls = getEntitiesWithComponents("position", "ball");

    for (const entity of balls) {
      const pos = getComponent(entity, "position");
      const ball = getComponent(entity, "ball");
      if (!pos || !ball) continue;

      const colors = BALL_COLOR_MAP[ball.ballType];

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;

      const gradient = ctx.createRadialGradient(
        pos.x - BALL_RADIUS * 0.3,
        pos.y - BALL_RADIUS * 0.3,
        0,
        pos.x,
        pos.y,
        BALL_RADIUS
      );
      gradient.addColorStop(0, colors.light);
      gradient.addColorStop(0.7, colors.mid);
      gradient.addColorStop(1, colors.dark);

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.restore();

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = colors.stroke;
      ctx.stroke();
    }
  }
}
