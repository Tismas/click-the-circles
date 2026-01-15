import type { Position } from "../ecs/Component";
import { createEntity } from "../ecs/Entity";
import { addComponent } from "../ecs/Component";
import { randomElement } from "./random";

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

const CIRCLE_COLORS = [
  "#ff6b6b",
  "#4ecdc4",
  "#ffe66d",
  "#95e1d3",
  "#f38181",
  "#aa96da",
  "#fcbad3",
] as const;

export function spawnCircle(canvasWidth: number, canvasHeight: number): void {
  const radius = 60;
  const pos = getRandomCirclePosition(canvasWidth, canvasHeight, radius);
  const color = randomElement(CIRCLE_COLORS);

  const entity = createEntity();
  addComponent(entity, "position", pos);
  addComponent(entity, "circle", {
    radius,
    color,
    outlineColor: "#ffffff",
    outlineWidth: 4,
  });
  addComponent(entity, "health", {
    current: 10,
    max: 10,
  });
  addComponent(entity, "clickable", {
    radius,
  });
}
