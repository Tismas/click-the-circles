import { System } from "../ecs/System";
import { getEntitiesWithComponents, getComponent } from "../ecs/Component";
import type { Entity } from "../ecs/Entity";
import { gameState } from "../game/GameState";
import {
  getBallDamage,
  getBlueBallDamage,
  getGreenBallDamage,
  getGreenBallSpeedMulti,
  getUpgradeLevel,
} from "../game/Upgrades";
import { soundManager } from "../audio/SoundManager";
import { getHealthScale } from "../utils/healthScale";
import { eventBus } from "../events/EventBus";
import { spawnSpike } from "../utils/spawn";

const BALL_RADIUS = 15;
const SPIKE_COUNT = 8;
const SPIKE_BASE_SPEED = 300;

export class CollisionSystem extends System {
  private collidedPairs = new Set<string>();

  private getPairKey(ballEntity: Entity, circleEntity: Entity): string {
    return `${ballEntity}-${circleEntity}`;
  }

  update(): void {
    const balls = getEntitiesWithComponents("position", "velocity", "ball");
    const circles = getEntitiesWithComponents(
      "position",
      "circle",
      "health",
      "clickable"
    );

    const currentCollisions = new Set<string>();

    for (const ballEntity of balls) {
      const ballPos = getComponent(ballEntity, "position");
      const ballVel = getComponent(ballEntity, "velocity");
      const ball = getComponent(ballEntity, "ball");

      if (!ballPos || !ballVel || !ball) continue;

      for (const circleEntity of circles) {
        const circlePos = getComponent(circleEntity, "position");
        const circle = getComponent(circleEntity, "circle");
        const health = getComponent(circleEntity, "health");

        if (!circlePos || !circle || !health) continue;

        const scale = getHealthScale(health);
        const circleRadius = circle.radius * scale;

        const dx = ballPos.x - circlePos.x;
        const dy = ballPos.y - circlePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = BALL_RADIUS + circleRadius;

        const pairKey = this.getPairKey(ballEntity, circleEntity);

        if (distance < minDistance) {
          currentCollisions.add(pairKey);

          if (!this.collidedPairs.has(pairKey)) {
            let damage: number;
            switch (ball.ballType) {
              case "blue":
                damage = getBlueBallDamage();
                break;
              case "green":
                damage = getGreenBallDamage();
                break;
              default:
                damage = getBallDamage();
            }

            health.current -= damage;
            gameState.money += damage;

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
              damage,
            });
            soundManager.play("ballHit");

            const dotProduct = ballVel.x * nx + ballVel.y * ny;

            ballVel.x -= 2 * dotProduct * nx;
            ballVel.y -= 2 * dotProduct * ny;

            const overlap = minDistance - distance;
            ballPos.x += nx * overlap;
            ballPos.y += ny * overlap;

            if (
              ball.ballType === "green" &&
              getUpgradeLevel("greenBallSpikes") > 0
            ) {
              this.spawnSpikeRing(circlePos.x, circlePos.y, circleRadius);
            }
          }
        }
      }
    }

    this.collidedPairs = currentCollisions;
  }

  private spawnSpikeRing(
    centerX: number,
    centerY: number,
    circleRadius: number
  ): void {
    const damage = getGreenBallDamage();
    const speedMulti = getGreenBallSpeedMulti();
    const spikeSpeed = SPIKE_BASE_SPEED * speedMulti;
    const spawnOffset = circleRadius + 10;

    for (let i = 0; i < SPIKE_COUNT; i++) {
      const angle = (i / SPIKE_COUNT) * Math.PI * 2;
      const spawnX = centerX + Math.cos(angle) * spawnOffset;
      const spawnY = centerY + Math.sin(angle) * spawnOffset;
      const vx = Math.cos(angle) * spikeSpeed;
      const vy = Math.sin(angle) * spikeSpeed;
      spawnSpike(spawnX, spawnY, vx, vy, damage);
    }
  }
}
