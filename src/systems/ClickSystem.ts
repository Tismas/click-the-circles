import { System } from "../ecs/System";
import { getEntitiesWithComponents, getComponent } from "../ecs/Component";
import type { Entity } from "../ecs/Entity";
import type { Game } from "../game/Game";
import { gameState } from "../game/GameState";
import { spawnFloatingText } from "./FloatingTextSystem";

export class ClickSystem extends System {
  private clickX: number = 0;
  private clickY: number = 0;
  private hasClick: boolean = false;
  isHoveringCircle: boolean = false;

  constructor(game: Game) {
    super(game);
    this.game.canvas.addEventListener("click", this.handleClick);
    this.game.canvas.addEventListener("mousemove", this.handleMouseMove);
  }

  private handleClick = (e: MouseEvent): void => {
    this.clickX = e.clientX;
    this.clickY = e.clientY;
    this.hasClick = true;
  };

  private handleMouseMove = (e: MouseEvent): void => {
    const hovered = this.getHoveredEntities(e.clientX, e.clientY);
    this.isHoveringCircle = hovered.length > 0;
  };

  update(_dt: number): void {
    if (!this.hasClick) return;
    this.hasClick = false;

    const clickedEntities = this.getHoveredEntities(this.clickX, this.clickY);

    for (const entity of clickedEntities) {
      const health = getComponent(entity, "health");
      const pos = getComponent(entity, "position");
      if (!health || !pos) continue;

      const damage = Math.min(gameState.clickDamage, health.current);
      health.current = Math.max(0, health.current - damage);

      if (damage > 0) {
        gameState.money += damage;
        spawnFloatingText(pos.x, pos.y, `+$${damage}`, "#ffd700");
      }
    }
  }

  private getHoveredEntities(x: number, y: number): Entity[] {
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
