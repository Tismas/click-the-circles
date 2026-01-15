import { System } from "../ecs/System";
import { getEntitiesWithComponents, getComponent } from "../ecs/Component";
import type { Entity } from "../ecs/Entity";
import { gameState } from "../game/GameState";
import { getBallDamage } from "../game/Upgrades";
import { spawnFloatingText } from "./FloatingTextSystem";
import { spawnBallHitParticles } from "./ParticleSystem";
import { soundManager } from "../audio/SoundManager";
import { getHealthScale } from "../utils/healthScale";

const BALL_RADIUS = 15;

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
            const damage = getBallDamage();
            health.current -= damage;
            gameState.money += damage;

            spawnFloatingText(
              circlePos.x,
              circlePos.y - circleRadius - 10,
              `+$${damage}`,
              "#ffdd44"
            );

            const nx = dx / distance;
            const ny = dy / distance;

            const collisionX = circlePos.x + nx * circleRadius;
            const collisionY = circlePos.y + ny * circleRadius;
            spawnBallHitParticles(collisionX, collisionY);
            soundManager.play("ballHit");

            const dotProduct = ballVel.x * nx + ballVel.y * ny;

            ballVel.x -= 2 * dotProduct * nx;
            ballVel.y -= 2 * dotProduct * ny;

            const overlap = minDistance - distance;
            ballPos.x += nx * overlap;
            ballPos.y += ny * overlap;
          }
        }
      }
    }

    this.collidedPairs = currentCollisions;
  }
}
