import { gameState } from "./GameState";
import {
  getAllUpgradeLevels,
  setAllUpgradeLevels,
  getUpgradeLevel,
} from "./Upgrades";
import {
  spawnCircleWithHealth,
  spawnWhiteBall,
  spawnBlueBall,
  spawnGreenBall,
} from "../utils/spawn";
import { getEntitiesWithComponents, getComponent } from "../ecs/Component";
import { game } from "./gameInstance";
import {
  CURRENT_SAVE_VERSION,
  migrateSaveData,
  type SaveData,
  type CircleHealth,
} from "./SaveMigrations";

import {
  getShownHints,
  setShownHints,
  clearShownHints,
} from "../systems/TutorialSystem";

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
    shownHints: Array.from(getShownHints()),
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
    setShownHints(saveData.shownHints);
    spawnEntitiesFromSave(saveData.circleHealths);

    return true;
  } catch (e) {
    console.error("Failed to load game:", e);
    return false;
  }
}

function spawnEntitiesFromSave(circleHealths: CircleHealth[]): void {
  const whiteBallCount =
    getUpgradeLevel("whiteBall") + getUpgradeLevel("whiteBallCount");
  const blueBallCount = getUpgradeLevel("blueBall");
  const greenBallCount = getUpgradeLevel("greenBall");

  for (const health of circleHealths) {
    spawnCircleWithHealth(
      game.canvas.width,
      game.canvas.height,
      health.current,
      health.max
    );
  }
  for (let i = 0; i < whiteBallCount; i++) {
    spawnWhiteBall(game.canvas.width, game.canvas.height);
  }
  for (let i = 0; i < blueBallCount; i++) {
    spawnBlueBall(game.canvas.width, game.canvas.height);
  }
  for (let i = 0; i < greenBallCount; i++) {
    spawnGreenBall(game.canvas.width, game.canvas.height);
  }
}

export function spawnEntities(): void {
  const circleCount =
    1 +
    getUpgradeLevel("moreCircles") +
    getUpgradeLevel("moreCircles2") +
    getUpgradeLevel("moreCircles3") +
    getUpgradeLevel("moreCircles4");
  const whiteBallCount =
    getUpgradeLevel("whiteBall") + getUpgradeLevel("whiteBallCount");
  const blueBallCount = getUpgradeLevel("blueBall");
  const greenBallCount = getUpgradeLevel("greenBall");

  for (let i = 0; i < circleCount; i++) {
    spawnCircleWithHealth(game.canvas.width, game.canvas.height, 10, 10);
  }
  for (let i = 0; i < whiteBallCount; i++) {
    spawnWhiteBall(game.canvas.width, game.canvas.height);
  }
  for (let i = 0; i < blueBallCount; i++) {
    spawnBlueBall(game.canvas.width, game.canvas.height);
  }
  for (let i = 0; i < greenBallCount; i++) {
    spawnGreenBall(game.canvas.width, game.canvas.height);
  }
}

export function clearSaveData(): void {
  localStorage.removeItem(SAVE_KEY);
  clearShownHints();
}
