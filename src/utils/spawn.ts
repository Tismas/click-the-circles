import type { Position } from "../ecs/Component";

export function getRandomCirclePosition(
  canvasWidth: number,
  canvasHeight: number,
  radius: number
): Position {
  const padding = radius + 20;
  return {
    x: padding + Math.random() * (canvasWidth - padding * 2),
    y: padding + Math.random() * (canvasHeight - padding * 2),
  };
}
