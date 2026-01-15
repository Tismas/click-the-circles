import { System } from "../ecs/System";
import { getEntitiesWithComponents, getComponent } from "../ecs/Component";
import {
  getBallSpeedMulti,
  getBlueBallSpeedMulti,
  getGreenBallSpeedMulti,
  getUpgradeLevel,
} from "../game/Upgrades";
import { soundManager } from "../audio/SoundManager";

const BALL_RADIUS = 15;

function findClosestCircle(
  ballX: number,
  ballY: number
): { x: number; y: number } | null {
  const circles = getEntitiesWithComponents("position", "circle", "health");
  let closest: { x: number; y: number } | null = null;
  let closestDist = Infinity;

  for (const entity of circles) {
    const pos = getComponent(entity, "position");
    if (!pos) continue;

    const dx = pos.x - ballX;
    const dy = pos.y - ballY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < closestDist) {
      closestDist = dist;
      closest = { x: pos.x, y: pos.y };
    }
  }

  return closest;
}

export class MovementSystem extends System {
  update(dt: number): void {
    const balls = getEntitiesWithComponents("position", "velocity", "ball");

    for (const entity of balls) {
      const pos = getComponent(entity, "position");
      const vel = getComponent(entity, "velocity");
      const ball = getComponent(entity, "ball");

      if (!pos || !vel || !ball) continue;

      const dtSeconds = dt / 1000;
      let speedMulti: number;
      switch (ball.ballType) {
        case "blue":
          speedMulti = getBlueBallSpeedMulti();
          break;
        case "green":
          speedMulti = getGreenBallSpeedMulti();
          break;
        default:
          speedMulti = getBallSpeedMulti();
      }

      pos.x += vel.x * speedMulti * dtSeconds;
      pos.y += vel.y * speedMulti * dtSeconds;

      const canvasWidth = this.game.canvas.width;
      const canvasHeight = this.game.canvas.height;

      let bounced = false;

      if (pos.x - BALL_RADIUS < 0) {
        pos.x = BALL_RADIUS;
        vel.x = Math.abs(vel.x);
        bounced = true;
      } else if (pos.x + BALL_RADIUS > canvasWidth) {
        pos.x = canvasWidth - BALL_RADIUS;
        vel.x = -Math.abs(vel.x);
        bounced = true;
      }

      if (pos.y - BALL_RADIUS < 0) {
        pos.y = BALL_RADIUS;
        vel.y = Math.abs(vel.y);
        bounced = true;
      } else if (pos.y + BALL_RADIUS > canvasHeight) {
        pos.y = canvasHeight - BALL_RADIUS;
        vel.y = -Math.abs(vel.y);
        bounced = true;
      }

      if (bounced) {
        soundManager.play("ballBounce");

        if (
          ball.ballType === "blue" &&
          getUpgradeLevel("blueBallTargeting") > 0
        ) {
          const target = findClosestCircle(pos.x, pos.y);
          if (target) {
            const dx = target.x - pos.x;
            const dy = target.y - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
              const currentSpeed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
              vel.x = (dx / dist) * currentSpeed;
              vel.y = (dy / dist) * currentSpeed;
            }
          }
        }
      }
    }
  }
}
