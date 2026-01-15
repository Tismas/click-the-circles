import { System } from "../ecs/System";
import { getEntitiesWithComponents, getComponent } from "../ecs/Component";

export class RenderSystem extends System {
  render(): void {
    const ctx = this.game.ctx;

    const entities = getEntitiesWithComponents("position", "circle");

    for (const entity of entities) {
      const pos = getComponent(entity, "position");
      const circle = getComponent(entity, "circle");

      if (!pos || !circle) continue;

      const health = getComponent(entity, "health");
      let displayRadius = circle.radius;

      if (health) {
        const healthPercent = health.current / health.max;
        const minScale = 0.4;
        const maxScale = 1.0;
        const scale = minScale + healthPercent * (maxScale - minScale);
        displayRadius = circle.radius * scale;
      }

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
}
