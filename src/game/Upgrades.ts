import { game } from "./gameInstance";
import {
  spawnCircle,
  spawnWhiteBall,
  spawnBlueBall,
  spawnGreenBall,
} from "../utils/spawn";

export type UpgradeId =
  | "clickDamage"
  | "killBonus"
  | "clickRadius"
  | "moreCircles"
  | "moreCircles2"
  | "moreCircles3"
  | "moreCircles4"
  | "whiteBall"
  | "whiteBallCount"
  | "ballDamage"
  | "ballSpeed"
  | "blueBall"
  | "blueBallTargeting"
  | "blueBallDamage"
  | "blueBallSpeed"
  | "greenBall"
  | "greenBallSpikes"
  | "greenBallDamage"
  | "greenBallSpeed"
  | "chainLightning"
  | "chainLightningCount"
  | "chainLightningDamage"
  | "miningDrone"
  | "tickSpeed"
  | "valueUpgrade"
  | "tickSpeed2"
  | "valueUpgrade2"
  | "doubleMining"
  | "clickHold"
  | "holdSpeed"
  | "clickDamage2"
  | "killBonus2";

export type UpgradeBranch = "left" | "top" | "right" | "bottom";

interface UpgradeInput {
  id: UpgradeId;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  baseCost: number;
  branch: UpgradeBranch;
  parent?: UpgradeId;
  onPurchase?: () => void;
}

export interface UpgradeDefinition extends UpgradeInput {
  position: number;
  subPosition: number;
}

export interface UpgradeState {
  level: number;
}

const upgradeStates = new Map<UpgradeId, UpgradeState>();

export function getUpgradeLevel(id: UpgradeId): number {
  return upgradeStates.get(id)?.level ?? 0;
}

export function getClickDamage(): number {
  return 1 + getUpgradeLevel("clickDamage") + getUpgradeLevel("clickDamage2");
}

export function getKillBonusPercent(): number {
  return (getUpgradeLevel("killBonus") + getUpgradeLevel("killBonus2")) * 0.1;
}

export function getRadiusMulti(): number {
  return 1 + getUpgradeLevel("clickRadius") * 0.5;
}

export function getBallDamage(): number {
  return 1 + getUpgradeLevel("ballDamage");
}

export function getBallSpeedMulti(): number {
  return 1 + getUpgradeLevel("ballSpeed") * 0.15;
}

export function getBlueBallDamage(): number {
  return 1 + getUpgradeLevel("blueBallDamage");
}

export function getBlueBallSpeedMulti(): number {
  return 1 + getUpgradeLevel("blueBallSpeed") * 0.15;
}

export function getGreenBallDamage(): number {
  return 1 + getUpgradeLevel("greenBallDamage");
}

export function getGreenBallSpeedMulti(): number {
  return 1 + getUpgradeLevel("greenBallSpeed") * 0.15;
}

export function getChainLightningCount(): number {
  return 1 + getUpgradeLevel("chainLightningCount");
}

export function getChainLightningDamagePercent(): number {
  return 0.1 + getUpgradeLevel("chainLightningDamage") * 0.1;
}

export function getMiningMultiplier(): number {
  return getUpgradeLevel("doubleMining") > 0 ? 2 : 1;
}

export function isUpgradeMaxed(id: UpgradeId): boolean {
  const def = upgradeDefinitions.find((u) => u.id === id);
  if (!def) return false;
  return getUpgradeLevel(id) >= def.maxLevel;
}

export function isUpgradeUnlocked(id: UpgradeId): boolean {
  const def = upgradeDefinitions.find((u) => u.id === id);
  if (!def) return false;
  if (!def.parent) return true;
  return isUpgradeMaxed(def.parent);
}

const COST_SCALE_FACTOR = 1.5;

export function getUpgradeCost(id: UpgradeId): number {
  const def = upgradeDefinitions.find((u) => u.id === id);
  if (!def) return Infinity;
  const level = getUpgradeLevel(id);
  return Math.floor(def.baseCost * Math.pow(COST_SCALE_FACTOR, level));
}

export function canAffordUpgrade(id: UpgradeId, money: number): boolean {
  return money >= getUpgradeCost(id);
}

export function purchaseUpgrade(
  id: UpgradeId,
  money: number
): { success: boolean; cost: number } {
  const def = upgradeDefinitions.find((u) => u.id === id);
  if (!def) return { success: false, cost: 0 };

  if (isUpgradeMaxed(id)) return { success: false, cost: 0 };
  if (!isUpgradeUnlocked(id)) return { success: false, cost: 0 };

  const cost = getUpgradeCost(id);
  if (money < cost) return { success: false, cost: 0 };

  const state = upgradeStates.get(id) ?? { level: 0 };
  state.level++;
  upgradeStates.set(id, state);

  if (def.onPurchase) {
    def.onPurchase();
  }

  return { success: true, cost };
}

export function initializeUpgrades(): void {
  upgradeStates.clear();
  for (const def of upgradeDefinitions) {
    upgradeStates.set(def.id, { level: 0 });
  }
}

export function getAllUpgradeLevels(): Record<UpgradeId, number> {
  const levels: Partial<Record<UpgradeId, number>> = {};
  for (const [id, state] of upgradeStates) {
    levels[id] = state.level;
  }
  return levels as Record<UpgradeId, number>;
}

export function setAllUpgradeLevels(levels: Record<UpgradeId, number>): void {
  for (const [id, level] of Object.entries(levels)) {
    const state = upgradeStates.get(id as UpgradeId);
    if (state) {
      state.level = level;
    }
  }
}

const upgradeInputs: UpgradeInput[] = [
  // === RIGHT BRANCH (Click upgrades) ===
  {
    id: "clickDamage",
    name: "Click Damage",
    description: "Increases click damage by 1",
    icon: "👆",
    maxLevel: 5,
    baseCost: 10,
    branch: "right",
  },
  {
    id: "killBonus",
    name: "Kill Bonus",
    description: "Gain 10% of circle max HP as bonus on kill",
    icon: "💀",
    maxLevel: 10,
    baseCost: 100,
    branch: "right",
    parent: "clickDamage",
  },
  {
    id: "moreCircles",
    name: "More Circles",
    description: "Spawns an additional circle",
    icon: "➕",
    maxLevel: 5,
    baseCost: 50,
    branch: "right",
    parent: "clickDamage",
    onPurchase: () => {
      spawnCircle(game.canvas.width, game.canvas.height);
    },
  },
  {
    id: "moreCircles2",
    name: "More Circles II",
    description: "Spawns an additional circle",
    icon: "➕",
    maxLevel: 5,
    baseCost: 500,
    branch: "right",
    parent: "moreCircles",
    onPurchase: () => {
      spawnCircle(game.canvas.width, game.canvas.height);
    },
  },
  {
    id: "moreCircles3",
    name: "More Circles III",
    description: "Spawns an additional circle",
    icon: "➕",
    maxLevel: 5,
    baseCost: 2000,
    branch: "right",
    parent: "moreCircles2",
    onPurchase: () => {
      spawnCircle(game.canvas.width, game.canvas.height);
    },
  },
  {
    id: "clickRadius",
    name: "Click Radius",
    description: "Increases click radius by 50%",
    icon: "⭕",
    maxLevel: 5,
    baseCost: 75,
    branch: "right",
    parent: "moreCircles",
  },
  {
    id: "chainLightning",
    name: "Chain Lightning",
    description: "Clicks chain to nearby circles",
    icon: "⚡",
    maxLevel: 1,
    baseCost: 500,
    branch: "right",
    parent: "clickRadius",
  },
  {
    id: "chainLightningCount",
    name: "Chain Count",
    description: "Lightning chains to +1 more target",
    icon: "🔗",
    maxLevel: 5,
    baseCost: 300,
    branch: "right",
    parent: "chainLightning",
  },
  {
    id: "chainLightningDamage",
    name: "Chain Damage",
    description: "Chain deals +10% click damage (10%-120%)",
    icon: "💥",
    maxLevel: 11,
    baseCost: 250,
    branch: "right",
    parent: "chainLightning",
  },
  {
    id: "clickDamage2",
    name: "Click Damage II",
    description: "Increases click damage by 1",
    icon: "👆",
    maxLevel: 10,
    baseCost: 1000,
    branch: "right",
    parent: "chainLightningCount",
  },
  {
    id: "moreCircles4",
    name: "More Circles IV",
    description: "Spawns an additional circle",
    icon: "➕",
    maxLevel: 5,
    baseCost: 5000,
    branch: "right",
    parent: "clickDamage2",
    onPurchase: () => {
      spawnCircle(game.canvas.width, game.canvas.height);
    },
  },
  {
    id: "killBonus2",
    name: "Kill Bonus II",
    description: "Gain 10% of circle max HP as bonus on kill",
    icon: "💀",
    maxLevel: 10,
    baseCost: 2000,
    branch: "right",
    parent: "clickDamage2",
  },

  // === LEFT BRANCH (Ball upgrades) ===
  {
    id: "whiteBall",
    name: "White Ball",
    description: "Spawns a bouncing ball that damages circles",
    icon: "⚪",
    maxLevel: 1,
    baseCost: 200,
    branch: "left",
    onPurchase: () => {
      spawnWhiteBall(game.canvas.width, game.canvas.height);
    },
  },
  {
    id: "whiteBallCount",
    name: "More White Balls",
    description: "Spawns an additional white ball",
    icon: "⚪",
    maxLevel: 5,
    baseCost: 400,
    branch: "left",
    parent: "whiteBall",
    onPurchase: () => {
      spawnWhiteBall(game.canvas.width, game.canvas.height);
    },
  },
  {
    id: "ballDamage",
    name: "Ball Damage",
    description: "Increases white ball damage by 1",
    icon: "💥",
    maxLevel: 10,
    baseCost: 50,
    branch: "left",
    parent: "whiteBall",
  },
  {
    id: "ballSpeed",
    name: "Ball Speed",
    description: "Increases white ball speed by 15%",
    icon: "💨",
    maxLevel: 10,
    baseCost: 50,
    branch: "left",
    parent: "whiteBall",
  },
  {
    id: "blueBall",
    name: "Blue Ball",
    description: "Spawns a blue bouncing ball",
    icon: "🔵",
    maxLevel: 1,
    baseCost: 800,
    branch: "left",
    parent: "ballDamage",
    onPurchase: () => {
      spawnBlueBall(game.canvas.width, game.canvas.height);
    },
  },
  {
    id: "blueBallTargeting",
    name: "Blue Targeting",
    description: "Blue ball targets closest circle on wall bounce",
    icon: "🎯",
    maxLevel: 1,
    baseCost: 600,
    branch: "left",
    parent: "blueBall",
  },
  {
    id: "blueBallDamage",
    name: "Blue Ball Damage",
    description: "Increases blue ball damage by 1",
    icon: "💥",
    maxLevel: 10,
    baseCost: 200,
    branch: "left",
    parent: "blueBall",
  },
  {
    id: "blueBallSpeed",
    name: "Blue Ball Speed",
    description: "Increases blue ball speed by 15%",
    icon: "💨",
    maxLevel: 10,
    baseCost: 200,
    branch: "left",
    parent: "blueBall",
  },
  {
    id: "greenBall",
    name: "Green Ball",
    description: "Spawns a green bouncing ball",
    icon: "🟢",
    maxLevel: 1,
    baseCost: 1500,
    branch: "left",
    parent: "blueBallDamage",
    onPurchase: () => {
      spawnGreenBall(game.canvas.width, game.canvas.height);
    },
  },
  {
    id: "greenBallSpikes",
    name: "Spike Burst",
    description: "Green ball spawns spikes in all directions on hit",
    icon: "💢",
    maxLevel: 1,
    baseCost: 1000,
    branch: "left",
    parent: "greenBall",
  },
  {
    id: "greenBallDamage",
    name: "Green Ball Damage",
    description: "Increases green ball & spike damage by 1",
    icon: "💥",
    maxLevel: 10,
    baseCost: 400,
    branch: "left",
    parent: "greenBall",
  },
  {
    id: "greenBallSpeed",
    name: "Green Ball Speed",
    description: "Increases green ball & spike speed by 15%",
    icon: "💨",
    maxLevel: 10,
    baseCost: 400,
    branch: "left",
    parent: "greenBall",
  },

  // === TOP BRANCH (Passive income) ===
  {
    id: "miningDrone",
    name: "Mining Drone",
    description: "Generates $1/sec passively",
    icon: "⛏️",
    maxLevel: 1,
    baseCost: 150,
    branch: "top",
  },
  {
    id: "tickSpeed",
    name: "Tick Speed",
    description: "Decreases generation cooldown by 1 tick",
    icon: "⏱️",
    maxLevel: 15,
    baseCost: 100,
    branch: "top",
    parent: "miningDrone",
  },
  {
    id: "valueUpgrade",
    name: "Value Upgrade",
    description: "Increases passive income by $1/tick",
    icon: "💰",
    maxLevel: 15,
    baseCost: 100,
    branch: "top",
    parent: "miningDrone",
  },
  {
    id: "tickSpeed2",
    name: "Tick Speed II",
    description: "Decreases generation cooldown by 1 tick",
    icon: "⏱️",
    maxLevel: 4,
    baseCost: 500,
    branch: "top",
    parent: "tickSpeed",
  },
  {
    id: "valueUpgrade2",
    name: "Value Upgrade II",
    description: "Increases passive income by $1/tick",
    icon: "💰",
    maxLevel: 15,
    baseCost: 500,
    branch: "top",
    parent: "valueUpgrade",
  },
  {
    id: "doubleMining",
    name: "Double Mining",
    description: "Doubles all passive mining income",
    icon: "💎",
    maxLevel: 1,
    baseCost: 10000,
    branch: "top",
    parent: "tickSpeed2",
  },

  // === BOTTOM BRANCH (Click hold) ===
  {
    id: "clickHold",
    name: "Click Hold",
    description: "Hold click to auto-damage (1/sec)",
    icon: "✋",
    maxLevel: 1,
    baseCost: 25,
    branch: "bottom",
  },
  {
    id: "holdSpeed",
    name: "Hold Speed",
    description: "Reduces hold interval by 1 tick",
    icon: "🔄",
    maxLevel: 15,
    baseCost: 50,
    branch: "bottom",
    parent: "clickHold",
  },
];

function calculatePositions(inputs: UpgradeInput[]): UpgradeDefinition[] {
  const result: UpgradeDefinition[] = [];
  const positionMap = new Map<UpgradeId, number>();

  for (const input of inputs) {
    let position = 0;
    if (input.parent) {
      const parentPos = positionMap.get(input.parent);
      if (parentPos !== undefined) {
        position = parentPos + 1;
      }
    }
    positionMap.set(input.id, position);
    result.push({ ...input, position, subPosition: 0 });
  }

  const siblingGroups = new Map<string, UpgradeDefinition[]>();
  for (const def of result) {
    const key = `${def.branch}-${def.position}-${def.parent ?? "root"}`;
    const group = siblingGroups.get(key) ?? [];
    group.push(def);
    siblingGroups.set(key, group);
  }

  for (const siblings of siblingGroups.values()) {
    if (siblings.length > 1) {
      const offset = (siblings.length - 1) / 2;
      siblings.forEach((sibling, i) => {
        sibling.subPosition = i - offset;
      });
    }
  }

  return result;
}

export const upgradeDefinitions: UpgradeDefinition[] =
  calculatePositions(upgradeInputs);

export function getUpgradesByBranch(
  branch: UpgradeBranch
): UpgradeDefinition[] {
  return upgradeDefinitions
    .filter((u) => u.branch === branch)
    .sort((a, b) => a.position - b.position);
}
