import type { Position } from "../ecs/Component";
import { createEntity } from "../ecs/Entity";
import {
  addComponent,
  getEntitiesWithComponents,
  getComponent,
} from "../ecs/Component";
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

function doesOverlapCircles(x: number, y: number, radius: number): boolean {
  const circles = getEntitiesWithComponents("position", "circle", "health");
  for (const entity of circles) {
    const pos = getComponent(entity, "position");
    const circle = getComponent(entity, "circle");
    if (!pos || !circle) continue;

    const dx = pos.x - x;
    const dy = pos.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = radius + circle.radius;

    if (distance < minDistance) {
      return true;
    }
  }
  return false;
}

const BALL_BASE_SPEED = 150;
const BALL_RADIUS = 15;

export function spawnBall(canvasWidth: number, canvasHeight: number): void {
  const padding = BALL_RADIUS + 50;
  let x: number;
  let y: number;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    x = padding + Math.random() * (canvasWidth - padding * 2);
    y = padding + Math.random() * (canvasHeight - padding * 2);
    attempts++;
  } while (doesOverlapCircles(x, y, BALL_RADIUS) && attempts < maxAttempts);

  const angle = Math.random() * Math.PI * 2;
  const vx = Math.cos(angle) * BALL_BASE_SPEED;
  const vy = Math.sin(angle) * BALL_BASE_SPEED;

  const entity = createEntity();
  addComponent(entity, "position", { x, y });
  addComponent(entity, "velocity", { x: vx, y: vy });
  addComponent(entity, "ball", { damage: 1 });
}
