import { System } from "../ecs/System";
import { getEntitiesWithComponents, getComponent } from "../ecs/Component";
import type { Entity } from "../ecs/Entity";
import type { Game } from "../game/Game";
import { gameState } from "../game/GameState";
import {
  getClickDamage,
  getRadiusMulti,
  getUpgradeLevel,
  getChainLightningCount,
  getChainLightningDamagePercent,
} from "../game/Upgrades";
import { soundManager } from "../audio/SoundManager";
import { getHealthScale } from "../utils/healthScale";
import { eventBus } from "../events/EventBus";

export class ClickSystem extends System {
  private hasClick: boolean = false;
  private isHoveringCircle: boolean = false;
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

    this.game.canvas.addEventListener("touchstart", this.handleTouchStart, {
      passive: false,
    });
    this.game.canvas.addEventListener("touchmove", this.handleTouchMove, {
      passive: false,
    });
    this.game.canvas.addEventListener("touchend", this.handleTouchEnd);
  }

  private handleTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    this.mouseX = touch.clientX;
    this.mouseY = touch.clientY;
    this.updateHoverState();
    this.hasClick = true;
    this.isHolding = true;
  };

  private handleTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    this.mouseX = touch.clientX;
    this.mouseY = touch.clientY;
    this.updateHoverState();
  };

  private handleTouchEnd = (): void => {
    this.isHolding = false;
    this.holdTickCounter = 0;
  };

  private handleMouseMove = (e: MouseEvent): void => {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    this.updateHoverState();
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

      const damage = Math.min(getClickDamage(), health.current);
      health.current = Math.max(0, health.current - damage);

      if (damage > 0) {
        gameState.money += damage;
        eventBus.emit("circleClicked", {
          circleX: pos.x,
          circleY: pos.y,
          clickX: x,
          clickY: y,
          damage,
        });
        soundManager.play("click");

        if (getUpgradeLevel("chainLightning") > 0) {
          this.applyChainLightning(entity, pos.x, pos.y);
        }
      }
    }

    this.updateHoverState();
  }

  private applyChainLightning(
    sourceEntity: Entity,
    sourceX: number,
    sourceY: number
  ): void {
    const chainCount = getChainLightningCount();
    const damagePercent = getChainLightningDamagePercent();
    const chainDamage = Math.max(
      1,
      Math.floor(getClickDamage() * damagePercent)
    );

    const hitEntities = new Set<Entity>([sourceEntity]);
    const segments: {
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
    }[] = [];
    let currentX = sourceX;
    let currentY = sourceY;

    for (let i = 0; i < chainCount; i++) {
      const circles = getEntitiesWithComponents(
        "position",
        "circle",
        "health",
        "clickable"
      );

      let closestEntity: Entity | null = null;
      let closestDist = Infinity;
      let closestX = 0;
      let closestY = 0;

      for (const entity of circles) {
        if (hitEntities.has(entity)) continue;

        const pos = getComponent(entity, "position");
        const health = getComponent(entity, "health");
        if (!pos || !health || health.current <= 0) continue;

        const dx = pos.x - currentX;
        const dy = pos.y - currentY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < closestDist) {
          closestDist = dist;
          closestEntity = entity;
          closestX = pos.x;
          closestY = pos.y;
        }
      }

      if (closestEntity === null) break;

      hitEntities.add(closestEntity);
      segments.push({
        fromX: currentX,
        fromY: currentY,
        toX: closestX,
        toY: closestY,
      });

      const health = getComponent(closestEntity, "health");
      if (health) {
        const actualDamage = Math.min(chainDamage, health.current);
        health.current = Math.max(0, health.current - actualDamage);
        if (actualDamage > 0) {
          gameState.money += actualDamage;
        }
      }

      currentX = closestX;
      currentY = closestY;
    }

    if (segments.length > 0) {
      eventBus.emit("chainLightning", { segments });
    }
  }

  private updateHoverState(): void {
    const hovered = this.getHoveredEntities(this.mouseX, this.mouseY);
    const newHoverState = hovered.length > 0;
    if (newHoverState !== this.isHoveringCircle) {
      this.isHoveringCircle = newHoverState;
      eventBus.emit("circleHoverChanged", { isHovering: newHoverState });
    }
  }

  private getHoveredEntities(x: number, y: number): Entity[] {
    const entities = getEntitiesWithComponents("position", "clickable");
    const clicked: Entity[] = [];
    const baseClickRadius = 10;
    const clickRadius = baseClickRadius * getRadiusMulti();

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

  render(): void {
    const baseClickRadius = 10;
    const clickRadius = baseClickRadius * getRadiusMulti();

    const ctx = this.game.ctx;
    ctx.beginPath();
    ctx.arc(this.mouseX, this.mouseY, clickRadius, 0, Math.PI * 2);
    ctx.strokeStyle = this.isHoveringCircle
      ? "rgba(255, 215, 0, 0.6)"
      : "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
