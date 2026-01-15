import { System } from "../ecs/System";
import { getEntitiesWithComponents, getComponent } from "../ecs/Component";
import { gameState } from "../game/GameState";
import { soundManager } from "../audio/SoundManager";

const BALL_RADIUS = 15;

export class MovementSystem extends System {
  update(dt: number): void {
    const balls = getEntitiesWithComponents("position", "velocity", "ball");

    for (const entity of balls) {
      const pos = getComponent(entity, "position");
      const vel = getComponent(entity, "velocity");

      if (!pos || !vel) continue;

      const dtSeconds = dt / 1000;
      const speedMulti = gameState.ballSpeedMulti;

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
      }
    }
  }
}
