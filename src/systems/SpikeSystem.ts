import { System } from "../ecs/System";
import {
  getEntitiesWithComponents,
  getComponent,
  destroyEntity,
} from "../ecs/Component";
import type { Entity } from "../ecs/Entity";
import { gameState } from "../game/GameState";
import { getHealthScale } from "../utils/healthScale";
import { eventBus } from "../events/EventBus";
import { soundManager } from "../audio/SoundManager";

const SPIKE_RADIUS = 6;

export class SpikeSystem extends System {
  private collidedPairs = new Set<string>();

  private getPairKey(spikeEntity: Entity, circleEntity: Entity): string {
    return `spike-${spikeEntity}-${circleEntity}`;
  }

  update(dt: number): void {
    const spikes = getEntitiesWithComponents("position", "velocity", "spike");
    const circles = getEntitiesWithComponents(
      "position",
      "circle",
      "health",
      "clickable"
    );

    const toDestroy: Entity[] = [];
    const currentCollisions = new Set<string>();
    const dtSeconds = dt / 1000;

    for (const spikeEntity of spikes) {
      const pos = getComponent(spikeEntity, "position");
      const vel = getComponent(spikeEntity, "velocity");
      const spike = getComponent(spikeEntity, "spike");

      if (!pos || !vel || !spike) continue;

      pos.x += vel.x * dtSeconds;
      pos.y += vel.y * dtSeconds;

      spike.lifetime -= dt;
      if (spike.lifetime <= 0) {
        toDestroy.push(spikeEntity);
        continue;
      }

      const canvasWidth = this.game.canvas.width;
      const canvasHeight = this.game.canvas.height;
      if (
        pos.x < -SPIKE_RADIUS ||
        pos.x > canvasWidth + SPIKE_RADIUS ||
        pos.y < -SPIKE_RADIUS ||
        pos.y > canvasHeight + SPIKE_RADIUS
      ) {
        toDestroy.push(spikeEntity);
        continue;
      }

      for (const circleEntity of circles) {
        const circlePos = getComponent(circleEntity, "position");
        const circle = getComponent(circleEntity, "circle");
        const health = getComponent(circleEntity, "health");

        if (!circlePos || !circle || !health) continue;

        const scale = getHealthScale(health);
        const circleRadius = circle.radius * scale;

        const dx = pos.x - circlePos.x;
        const dy = pos.y - circlePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = SPIKE_RADIUS + circleRadius;

        const pairKey = this.getPairKey(spikeEntity, circleEntity);

        if (distance < minDistance) {
          currentCollisions.add(pairKey);

          if (!this.collidedPairs.has(pairKey)) {
            health.current -= spike.damage;
            gameState.money += spike.damage;

            const nx = dx / distance;
            const ny = dy / distance;
            const collisionX = circlePos.x + nx * circleRadius;
            const collisionY = circlePos.y + ny * circleRadius;

            eventBus.emit("circleCollided", {
              circleX: circlePos.x,
              circleY: circlePos.y,
              circleRadius,
              collisionX,
              collisionY,
              damage: spike.damage,
            });
            soundManager.play("ballHit");

            toDestroy.push(spikeEntity);
            break;
          }
        }
      }
    }

    for (const entity of toDestroy) {
      destroyEntity(entity);
    }

    this.collidedPairs = currentCollisions;
  }

  render(): void {
    const ctx = this.game.ctx;
    const spikes = getEntitiesWithComponents("position", "velocity", "spike");

    for (const entity of spikes) {
      const pos = getComponent(entity, "position");
      const vel = getComponent(entity, "velocity");
      const spike = getComponent(entity, "spike");

      if (!pos || !vel || !spike) continue;

      const angle = Math.atan2(vel.y, vel.x);
      const alpha = Math.min(1, spike.lifetime / 500);

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(angle);
      ctx.globalAlpha = alpha;

      ctx.beginPath();
      ctx.moveTo(SPIKE_RADIUS * 2, 0);
      ctx.lineTo(-SPIKE_RADIUS, -SPIKE_RADIUS * 0.6);
      ctx.lineTo(-SPIKE_RADIUS * 0.5, 0);
      ctx.lineTo(-SPIKE_RADIUS, SPIKE_RADIUS * 0.6);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(
        -SPIKE_RADIUS,
        0,
        SPIKE_RADIUS * 2,
        0
      );
      gradient.addColorStop(0, "#2ecc71");
      gradient.addColorStop(0.5, "#27ae60");
      gradient.addColorStop(1, "#1e8449");
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = "#145a32";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }
  }
}
