import { System } from "../ecs/System";
import { getEntitiesWithComponents, getComponent } from "../ecs/Component";
import type { Entity } from "../ecs/Entity";
import type { Game } from "../game/Game";

export class ClickSystem extends System {
  private clickX: number = 0;
  private clickY: number = 0;
  private hasClick: boolean = false;

  constructor(game: Game) {
    super(game);
    this.game.canvas.addEventListener("click", this.handleClick);
  }

  private handleClick = (e: MouseEvent): void => {
    this.clickX = e.clientX;
    this.clickY = e.clientY;
    this.hasClick = true;
  };

  update(_dt: number): void {
    if (!this.hasClick) return;
    this.hasClick = false;

    const clickedEntities = this.getClickedEntities(this.clickX, this.clickY);

    for (const entity of clickedEntities) {
      const health = getComponent(entity, "health");
      if (!health) continue;

      const damage = 1;
      health.current = Math.max(0, health.current - damage);
    }
  }

  private getClickedEntities(x: number, y: number): Entity[] {
    const entities = getEntitiesWithComponents("position", "clickable");
    const clicked: Entity[] = [];

    for (const entity of entities) {
      const pos = getComponent(entity, "position");
      const clickable = getComponent(entity, "clickable");

      if (!pos || !clickable) continue;

      const dx = x - pos.x;
      const dy = y - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= clickable.radius) {
        clicked.push(entity);
      }
    }

    return clicked;
  }
}
