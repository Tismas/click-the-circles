import { System } from "../ecs/System";
import { gameState } from "../game/GameState";
import { getUpgradeLevel } from "../game/Upgrades";

export class PassiveIncomeSystem extends System {
  private tickCounter: number = 0;

  fixedUpdate(): void {
    const droneLevel = getUpgradeLevel("miningDrone");
    if (droneLevel === 0) return;

    const tickSpeedLevel = getUpgradeLevel("tickSpeed");
    const valueLevel = getUpgradeLevel("valueUpgrade");

    const baseCooldown = 20;
    const cooldown = Math.max(1, baseCooldown - tickSpeedLevel);
    const incomePerTick = droneLevel + valueLevel;

    this.tickCounter++;
    if (this.tickCounter >= cooldown) {
      this.tickCounter = 0;
      gameState.money += incomePerTick;
    }
  }
}
