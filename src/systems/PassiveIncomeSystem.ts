import { System } from "../ecs/System";
import { gameState } from "../game/GameState";
import { getUpgradeLevel, getMiningMultiplier } from "../game/Upgrades";

export class PassiveIncomeSystem extends System {
  private tickCounter: number = 0;

  fixedUpdate(): void {
    const droneLevel = getUpgradeLevel("miningDrone");
    if (droneLevel === 0) return;

    const tickSpeedLevel =
      getUpgradeLevel("tickSpeed") + getUpgradeLevel("tickSpeed2");
    const valueLevel =
      getUpgradeLevel("valueUpgrade") + getUpgradeLevel("valueUpgrade2");

    const baseCooldown = 20;
    const cooldown = Math.max(1, baseCooldown - tickSpeedLevel);
    const baseIncome = droneLevel + valueLevel;
    const incomePerTick = baseIncome * getMiningMultiplier();

    this.tickCounter++;
    if (this.tickCounter >= cooldown) {
      this.tickCounter = 0;
      gameState.money += incomePerTick;
    }
  }
}
