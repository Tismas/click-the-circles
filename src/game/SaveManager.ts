import { gameState } from "./GameState";
import {
  getAllUpgradeLevels,
  setAllUpgradeLevels,
  getUpgradeLevel,
  type UpgradeId,
} from "./Upgrades";
import { spawnCircle, spawnBall } from "../utils/spawn";
import { game } from "./gameInstance";

const SAVE_KEY = "click-the-circles-save";
const SAVE_VERSION = 3;

interface SaveData {
  version: number;
  money: number;
  upgradeLevels: Record<UpgradeId, number>;
}

export function saveGame(): void {
  const saveData: SaveData = {
    version: SAVE_VERSION,
    money: gameState.money,
    upgradeLevels: getAllUpgradeLevels(),
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

    const saveData: SaveData = JSON.parse(saved);

    if (saveData.version !== SAVE_VERSION) {
      console.warn("Save version mismatch, starting fresh");
      return false;
    }

    gameState.money = saveData.money;
    setAllUpgradeLevels(saveData.upgradeLevels);
    spawnEntities();

    return true;
  } catch (e) {
    console.error("Failed to load game:", e);
    return false;
  }
}

export function spawnEntities(): void {
  const circleCount = 1 + getUpgradeLevel("moreCircles");
  const ballCount = getUpgradeLevel("whiteBall");

  for (let i = 0; i < circleCount; i++) {
    spawnCircle(game.canvas.width, game.canvas.height);
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
