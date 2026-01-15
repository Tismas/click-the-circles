import { System } from "../ecs/System";
import { getEntitiesWithComponents, getComponent } from "../ecs/Component";
import { getHealthScale } from "../utils/healthScale";

const BALL_RADIUS = 15;

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

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, displayRadius, 0, Math.PI * 2);

      ctx.fillStyle = circle.color;
      ctx.fill();

      if (circle.outlineWidth > 0) {
        ctx.lineWidth = circle.outlineWidth;
        ctx.strokeStyle = circle.outlineColor;
        ctx.stroke();
      }

      if (health) {
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.max(16, displayRadius * 0.6)}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(Math.ceil(health.current).toString(), pos.x, pos.y);
      }
    }
  }

  private renderBalls(ctx: CanvasRenderingContext2D): void {
    const balls = getEntitiesWithComponents("position", "ball");

    for (const entity of balls) {
      const pos = getComponent(entity, "position");
      if (!pos) continue;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, BALL_RADIUS, 0, Math.PI * 2);

      ctx.fillStyle = "#ffffff";
      ctx.fill();

      ctx.lineWidth = 3;
      ctx.strokeStyle = "#dddddd";
      ctx.stroke();
    }
  }
}
