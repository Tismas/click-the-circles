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

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, circle.radius, 0, Math.PI * 2);

      ctx.fillStyle = circle.color;
      ctx.fill();

      if (circle.outlineWidth > 0) {
        ctx.lineWidth = circle.outlineWidth;
        ctx.strokeStyle = circle.outlineColor;
        ctx.stroke();
      }
    }
  }
}
