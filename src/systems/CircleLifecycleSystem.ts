import { System } from "../ecs/System";
import { getEntitiesWithComponents, getComponent } from "../ecs/Component";
import { gameState } from "../game/GameState";
import { spawnFloatingText } from "./FloatingTextSystem";
import { getRandomCirclePosition } from "../utils/spawn";
import { getUpgradeLevel } from "../game/Upgrades";

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

      if (!health || !pos) continue;

      if (health.current <= 0) {
        const killBonusLevel = getUpgradeLevel("killBonus");
        const bonusPercent = killBonusLevel * 0.1;
        const bonusMoney = Math.floor(health.max * bonusPercent);
        
        if (bonusMoney > 0) {
          gameState.money += bonusMoney;
          spawnFloatingText(
            pos.x,
            pos.y - 40,
            `+$${bonusMoney} BONUS!`,
            "#00ff88"
          );
        }

        const newMax = Math.floor(health.max * 1.1);
        health.max = newMax;
        health.current = newMax;

        const circle = getComponent(entity, "circle");
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
