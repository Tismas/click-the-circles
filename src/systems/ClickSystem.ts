import { System } from "../ecs/System";
import { getEntitiesWithComponents, getComponent } from "../ecs/Component";
import type { Entity } from "../ecs/Entity";
import type { Game } from "../game/Game";
import { gameState } from "../game/GameState";
import { spawnFloatingText } from "./FloatingTextSystem";
import { spawnClickParticles } from "./ParticleSystem";
import { getUpgradeLevel } from "../game/Upgrades";
import { getHealthScale } from "../utils/healthScale";

export class ClickSystem extends System {
  private hasClick: boolean = false;
  isHoveringCircle: boolean = false;
  private isHolding: boolean = false;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private holdTickCounter: number = 0;

  constructor(game: Game) {
    super(game);
    this.game.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.game.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.game.canvas.addEventListener("mouseup", this.handleMouseUp);
    this.game.canvas.addEventListener("mouseleave", this.handleMouseUp);
  }

  private handleMouseMove = (e: MouseEvent): void => {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    const hovered = this.getHoveredEntities(this.mouseX, this.mouseY);
    this.isHoveringCircle = hovered.length > 0;
  };

  private handleMouseDown = (_e: MouseEvent): void => {
    this.hasClick = true;
    this.isHolding = true;
  };

  private handleMouseUp = (): void => {
    this.isHolding = false;
    this.holdTickCounter = 0;
  };

  fixedUpdate(): void {
    const clickHoldLevel = getUpgradeLevel("clickHold");
    if (clickHoldLevel === 0 || !this.isHolding) return;

    const holdSpeedLevel = getUpgradeLevel("holdSpeed");
    const baseCooldown = 20;
    const cooldown = Math.max(1, baseCooldown - holdSpeedLevel);

    this.holdTickCounter++;
    if (this.holdTickCounter >= cooldown) {
      this.holdTickCounter = 0;
      this.applyDamageAt(this.mouseX, this.mouseY);
    }
  }

  update(_dt: number): void {
    if (!this.hasClick) return;
    this.hasClick = false;
    this.applyDamageAt(this.mouseX, this.mouseY);
  }

  private applyDamageAt(x: number, y: number): void {
    const clickedEntities = this.getHoveredEntities(x, y);

    for (const entity of clickedEntities) {
      const health = getComponent(entity, "health");
      const pos = getComponent(entity, "position");
      if (!health || !pos) continue;

      const damage = Math.min(gameState.clickDamage, health.current);
      health.current = Math.max(0, health.current - damage);

      if (damage > 0) {
        gameState.money += damage;
        spawnFloatingText(pos.x, pos.y, `+$${damage}`, "#ffd700");
        spawnClickParticles(x, y);
      }
    }
  }

  private getHoveredEntities(x: number, y: number): Entity[] {
    const entities = getEntitiesWithComponents("position", "clickable");
    const clicked: Entity[] = [];
    const baseClickRadius = 10;
    const clickRadius = baseClickRadius * gameState.radiusMulti;

    for (const entity of entities) {
      const pos = getComponent(entity, "position");
      const clickable = getComponent(entity, "clickable");

      if (!pos || !clickable) continue;

      const health = getComponent(entity, "health");
      const effectiveRadius = clickable.radius * getHealthScale(health);

      const dx = x - pos.x;
      const dy = y - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= effectiveRadius + clickRadius) {
        clicked.push(entity);
      }
    }

    return clicked;
  }
}
