import { System } from "../ecs/System";
import { getEntitiesWithComponents, getComponent } from "../ecs/Component";
import { gameState } from "../game/GameState";
import { soundManager } from "../audio/SoundManager";
import { getRandomCirclePosition } from "../utils/spawn";
import { getUpgradeLevel } from "../game/Upgrades";
import { eventBus } from "../events/EventBus";

export class CircleLifecycleSystem extends System {
  update(_dt: number): void {
    const entities = getEntitiesWithComponents(
      "position",
      "circle",
      "health",
      "clickable"
    );

    for (const entity of entities) {
      const health = getComponent(entity, "health");
      const pos = getComponent(entity, "position");
      const circle = getComponent(entity, "circle");

      if (!health || !pos) continue;

      if (health.current <= 0) {
        const killBonusLevel = getUpgradeLevel("killBonus");
        const bonusPercent = killBonusLevel * 0.1;
        const bonusMoney = Math.floor(health.max * bonusPercent);
        
        if (bonusMoney > 0) {
          gameState.money += bonusMoney;
        }

        if (circle) {
          eventBus.emit("circleKilled", { x: pos.x, y: pos.y, color: circle.color, bonusMoney });
        }
        soundManager.play("death");

        const newMax = Math.floor(health.max * 1.1);
        health.max = newMax;
        health.current = newMax;

        if (circle) {
          const newPos = getRandomCirclePosition(
            this.game.canvas.width,
            this.game.canvas.height,
            circle.radius
          );
          pos.x = newPos.x;
          pos.y = newPos.y;
        }
      }
    }
  }
}
