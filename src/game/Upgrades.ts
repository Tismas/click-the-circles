import { game } from "./gameInstance";
import { spawnCircle, spawnBall } from "../utils/spawn";

export type UpgradeId =
  | "clickDamage"
  | "killBonus"
  | "clickRadius"
  | "moreCircles"
  | "whiteBall"
  | "ballDamage"
  | "ballSpeed"
  | "miningDrone"
  | "tickSpeed"
  | "valueUpgrade"
  | "clickHold"
  | "holdSpeed";

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
  return 1 + getUpgradeLevel("clickDamage");
}

export function getRadiusMulti(): number {
  return 1 + getUpgradeLevel("clickRadius") * 0.1;
}

export function getBallDamage(): number {
  return 1 + getUpgradeLevel("ballDamage");
}

export function getBallSpeedMulti(): number {
  return 1 + getUpgradeLevel("ballSpeed") * 0.05;
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

export function getUpgradeCost(id: UpgradeId): number {
  const def = upgradeDefinitions.find((u) => u.id === id);
  if (!def) return Infinity;
  return def.baseCost;
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
  {
    id: "clickDamage",
    name: "Click Damage",
    description: "Increases click damage by 1",
    icon: "👆",
    maxLevel: 5,
    baseCost: 20,
    branch: "right",
  },
  {
    id: "killBonus",
    name: "Kill Bonus",
    description: "Gain 10% of circle max HP as bonus on kill",
    icon: "💀",
    maxLevel: 10,
    baseCost: 500,
    branch: "right",
    parent: "clickDamage",
  },
  {
    id: "moreCircles",
    name: "More Circles",
    description: "Spawns an additional circle",
    icon: "➕",
    maxLevel: 5,
    baseCost: 200,
    branch: "right",
    parent: "clickDamage",
    onPurchase: () => {
      spawnCircle(game.canvas.width, game.canvas.height);
    },
  },
  {
    id: "clickRadius",
    name: "Click Radius",
    description: "Increases click radius by 10%",
    icon: "⭕",
    maxLevel: 5,
    baseCost: 400,
    branch: "right",
    parent: "moreCircles",
  },
  {
    id: "whiteBall",
    name: "White Ball",
    description: "Spawns a bouncing ball that damages circles",
    icon: "⚪",
    maxLevel: 1,
    baseCost: 1000,
    branch: "left",
    onPurchase: () => {
      spawnBall(game.canvas.width, game.canvas.height);
    },
  },
  {
    id: "ballDamage",
    name: "Ball Damage",
    description: "Increases ball damage by 1",
    icon: "💥",
    maxLevel: 10,
    baseCost: 100,
    branch: "left",
    parent: "whiteBall",
  },
  {
    id: "ballSpeed",
    name: "Ball Speed",
    description: "Increases ball speed by 5%",
    icon: "⚡",
    maxLevel: 10,
    baseCost: 100,
    branch: "left",
    parent: "whiteBall",
  },
  {
    id: "miningDrone",
    name: "Mining Drone",
    description: "Generates $1/sec passively",
    icon: "⛏️",
    maxLevel: 1,
    baseCost: 1000,
    branch: "top",
  },
  {
    id: "tickSpeed",
    name: "Tick Speed",
    description: "Decreases generation cooldown by 1 tick",
    icon: "⏱️",
    maxLevel: 15,
    baseCost: 500,
    branch: "top",
    parent: "miningDrone",
  },
  {
    id: "valueUpgrade",
    name: "Value Upgrade",
    description: "Increases passive income by $1/tick",
    icon: "💰",
    maxLevel: 15,
    baseCost: 500,
    branch: "top",
    parent: "miningDrone",
  },
  {
    id: "clickHold",
    name: "Click Hold",
    description: "Hold click to auto-damage (1/sec)",
    icon: "✋",
    maxLevel: 1,
    baseCost: 100,
    branch: "bottom",
  },
  {
    id: "holdSpeed",
    name: "Hold Speed",
    description: "Reduces hold interval by 1 tick",
    icon: "🔄",
    maxLevel: 15,
    baseCost: 250,
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
