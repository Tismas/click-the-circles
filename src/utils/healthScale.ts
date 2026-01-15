import type { Health } from "../ecs/Component";

const MIN_SCALE = 0.4;
const MAX_SCALE = 1.0;

export function getHealthScale(health: Health | undefined): number {
  if (!health) return MAX_SCALE;
  const healthPercent = health.current / health.max;
  return MIN_SCALE + healthPercent * (MAX_SCALE - MIN_SCALE);
}
