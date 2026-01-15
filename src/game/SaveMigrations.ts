import type { UpgradeId } from "./Upgrades";

export const CURRENT_SAVE_VERSION = 5;

export interface CircleHealth {
  current: number;
  max: number;
}

export interface SaveData {
  version: number;
  money: number;
  upgradeLevels: Record<UpgradeId, number>;
  circleHealths: CircleHealth[];
  shownHints: string[];
}

interface SaveDataV3 {
  version: 3;
  money: number;
  upgradeLevels: Record<UpgradeId, number>;
}

interface SaveDataV4 {
  version: 4;
  money: number;
  upgradeLevels: Record<UpgradeId, number>;
  circleHealths: CircleHealth[];
}

type MigrationFn = (data: unknown) => unknown;

const migrations: Record<number, MigrationFn> = {
  3: (data: unknown): SaveDataV4 => {
    const oldData = data as SaveDataV3;
    const circleCount = 1 + (oldData.upgradeLevels.moreCircles ?? 0);
    const circleHealths: CircleHealth[] = [];
    for (let i = 0; i < circleCount; i++) {
      circleHealths.push({ current: 10, max: 10 });
    }
    return {
      version: 4,
      money: oldData.money,
      upgradeLevels: oldData.upgradeLevels,
      circleHealths,
    };
  },
  4: (data: unknown): SaveData => {
    const oldData = data as SaveDataV4;
    return {
      version: 5,
      money: oldData.money,
      upgradeLevels: oldData.upgradeLevels,
      circleHealths: oldData.circleHealths,
      shownHints: [],
    };
  },
};

const MIN_SUPPORTED_VERSION = 3;

export function migrateSaveData(rawData: unknown): SaveData | null {
  const data = rawData as { version?: number };

  if (typeof data.version !== "number") {
    return null;
  }

  if (data.version < MIN_SUPPORTED_VERSION) {
    return null;
  }

  if (data.version === CURRENT_SAVE_VERSION) {
    return rawData as SaveData;
  }

  let current = rawData;
  for (let v = data.version; v < CURRENT_SAVE_VERSION; v++) {
    const migrate = migrations[v];
    if (!migrate) {
      console.warn(`No migration for version ${v}`);
      return null;
    }
    current = migrate(current);
  }

  return current as SaveData;
}
