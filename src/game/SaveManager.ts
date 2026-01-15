import { gameState } from "./GameState";
import {
  getAllUpgradeLevels,
  setAllUpgradeLevels,
  getUpgradeLevel,
} from "./Upgrades";
import { spawnCircleWithHealth, spawnBall } from "../utils/spawn";
import { getEntitiesWithComponents, getComponent } from "../ecs/Component";
import { game } from "./gameInstance";
import {
  CURRENT_SAVE_VERSION,
  migrateSaveData,
  type SaveData,
  type CircleHealth,
} from "./SaveMigrations";

const SAVE_KEY = "click-the-circles-save";

function getCircleHealths(): CircleHealth[] {
  const circles = getEntitiesWithComponents("circle", "health");
  const healths: CircleHealth[] = [];
  for (const entity of circles) {
    const health = getComponent(entity, "health");
    if (health) {
      healths.push({ current: health.current, max: health.max });
    }
  }
  return healths;
}

export function saveGame(): void {
  const saveData: SaveData = {
    version: CURRENT_SAVE_VERSION,
    money: gameState.money,
    upgradeLevels: getAllUpgradeLevels(),
    circleHealths: getCircleHealths(),
  };

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch (e) {
    console.error("Failed to save game:", e);
  }
}

export function loadGame(): boolean {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return false;

    const rawData = JSON.parse(saved);
    const saveData = migrateSaveData(rawData);

    if (!saveData) {
      console.warn("Could not migrate save data, starting fresh");
      return false;
    }

    gameState.money = saveData.money;
    setAllUpgradeLevels(saveData.upgradeLevels);
    spawnEntitiesFromSave(saveData.circleHealths);

    return true;
  } catch (e) {
    console.error("Failed to load game:", e);
    return false;
  }
}

function spawnEntitiesFromSave(circleHealths: CircleHealth[]): void {
  const ballCount = getUpgradeLevel("whiteBall");

  for (const health of circleHealths) {
    spawnCircleWithHealth(
      game.canvas.width,
      game.canvas.height,
      health.current,
      health.max
    );
  }
  for (let i = 0; i < ballCount; i++) {
    spawnBall(game.canvas.width, game.canvas.height);
  }
}

export function spawnEntities(): void {
  const circleCount = 1 + getUpgradeLevel("moreCircles");
  const ballCount = getUpgradeLevel("whiteBall");

  for (let i = 0; i < circleCount; i++) {
    spawnCircleWithHealth(game.canvas.width, game.canvas.height, 10, 10);
  }
  for (let i = 0; i < ballCount; i++) {
    spawnBall(game.canvas.width, game.canvas.height);
  }
}

export function hasSaveData(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function clearSaveData(): void {
  localStorage.removeItem(SAVE_KEY);
}
