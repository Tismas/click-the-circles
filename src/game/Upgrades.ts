import { gameState } from "./GameState";

export type UpgradeId =
  | "clickDamage"
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
  unlockCondition: () => boolean;
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

export function isUpgradeMaxed(id: UpgradeId): boolean {
  const def = upgradeDefinitions.find((u) => u.id === id);
  if (!def) return false;
  return getUpgradeLevel(id) >= def.maxLevel;
}

export function isUpgradeUnlocked(id: UpgradeId): boolean {
  const def = upgradeDefinitions.find((u) => u.id === id);
  if (!def) return false;
  return def.unlockCondition();
}

export function getUpgradeCost(id: UpgradeId): number {
  const def = upgradeDefinitions.find((u) => u.id === id);
  if (!def) return Infinity;
  return def.baseCost;
}

export function canAffordUpgrade(id: UpgradeId, money: number): boolean {
  return money >= getUpgradeCost(id);
}

export function purchaseUpgrade(id: UpgradeId, money: number): { success: boolean; cost: number } {
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

const upgradeInputs: UpgradeInput[] = [
  {
    id: "clickDamage",
    name: "Click Damage",
    description: "Increases click damage by 1",
    icon: "👆",
    maxLevel: 10,
    baseCost: 20,
    branch: "right",
    unlockCondition: () => true,
    onPurchase: () => {
      gameState.clickDamage += 1;
    },
  },
  {
    id: "clickRadius",
    name: "Click Radius",
    description: "Increases click radius by 10%",
    icon: "⭕",
    maxLevel: 5,
    baseCost: 200,
    branch: "right",
    parent: "clickDamage",
    unlockCondition: () => isUpgradeMaxed("clickDamage"),
  },
  {
    id: "moreCircles",
    name: "More Circles",
    description: "Spawns an additional circle",
    icon: "➕",
    maxLevel: 5,
    baseCost: 1000,
    branch: "right",
    parent: "clickRadius",
    unlockCondition: () => isUpgradeMaxed("clickRadius"),
  },
  {
    id: "whiteBall",
    name: "White Ball",
    description: "Spawns a bouncing ball that damages circles",
    icon: "⚪",
    maxLevel: 1,
    baseCost: 1000,
    branch: "left",
    unlockCondition: () => isUpgradeMaxed("clickDamage"),
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
    unlockCondition: () => getUpgradeLevel("whiteBall") >= 1,
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
    unlockCondition: () => getUpgradeLevel("whiteBall") >= 1,
  },
  {
    id: "miningDrone",
    name: "Mining Drone",
    description: "Generates $1/sec passively",
    icon: "⛏️",
    maxLevel: 10,
    baseCost: 1000,
    branch: "top",
    unlockCondition: () => true,
  },
  {
    id: "tickSpeed",
    name: "Tick Speed",
    description: "Decreases generation cooldown by 1 tick",
    icon: "⏱️",
    maxLevel: 15,
    baseCost: 10000,
    branch: "top",
    parent: "miningDrone",
    unlockCondition: () => getUpgradeLevel("miningDrone") >= 1,
  },
  {
    id: "valueUpgrade",
    name: "Value Upgrade",
    description: "Increases passive income by $1/tick",
    icon: "💰",
    maxLevel: 15,
    baseCost: 10000,
    branch: "top",
    parent: "miningDrone",
    unlockCondition: () => getUpgradeLevel("miningDrone") >= 1,
  },
  {
    id: "clickHold",
    name: "Click Hold",
    description: "Hold click to auto-damage (1/sec)",
    icon: "✋",
    maxLevel: 1,
    baseCost: 500,
    branch: "bottom",
    unlockCondition: () => isUpgradeMaxed("clickDamage"),
  },
  {
    id: "holdSpeed",
    name: "Hold Speed",
    description: "Reduces hold interval by 1 tick",
    icon: "🔄",
    maxLevel: 15,
    baseCost: 2500,
    branch: "bottom",
    parent: "clickHold",
    unlockCondition: () => getUpgradeLevel("clickHold") >= 1,
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
