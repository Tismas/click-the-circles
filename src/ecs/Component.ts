import type { Entity } from "./Entity";

const BALL_TYPES = ["white", "blue", "green"] as const;
export type BallType = (typeof BALL_TYPES)[number];

const COMPONENT_TYPES = [
  "position",
  "circle",
  "health",
  "velocity",
  "clickable",
  "ball",
  "spike",
] as const;
export type ComponentType = (typeof COMPONENT_TYPES)[number];

export interface Position {
  x: number;
  y: number;
}

export interface Circle {
  radius: number;
  color: string;
  outlineColor: string;
  outlineWidth: number;
}

export interface Health {
  current: number;
  max: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface Clickable {
  radius: number;
}

export interface Ball {
  damage: number;
  ballType: BallType;
}

export interface Spike {
  damage: number;
  lifetime: number;
}

type ComponentMap = {
  position: Position;
  circle: Circle;
  health: Health;
  velocity: Velocity;
  clickable: Clickable;
  ball: Ball;
  spike: Spike;
};

type ComponentStorage = {
  [K in ComponentType]: Map<Entity, ComponentMap[K]>;
};

const storage: ComponentStorage = {
  position: new Map(),
  circle: new Map(),
  health: new Map(),
  velocity: new Map(),
  clickable: new Map(),
  ball: new Map(),
  spike: new Map(),
};

const allEntities = new Set<Entity>();

export function addComponent<T extends ComponentType>(
  entity: Entity,
  type: T,
  component: ComponentMap[T]
): void {
  allEntities.add(entity);
  storage[type].set(entity, component);
}

export function getComponent<T extends ComponentType>(
  entity: Entity,
  type: T
): ComponentMap[T] | undefined {
  return storage[type].get(entity);
}

export function hasComponent(entity: Entity, type: ComponentType): boolean {
  return storage[type].has(entity);
}

export function removeComponent(entity: Entity, type: ComponentType): void {
  storage[type].delete(entity);
}

export function destroyEntity(entity: Entity): void {
  allEntities.delete(entity);
  for (const type of COMPONENT_TYPES) {
    storage[type].delete(entity);
  }
}

export function getEntitiesWithComponents(...types: ComponentType[]): Entity[] {
  const result: Entity[] = [];
  for (const entity of allEntities) {
    if (types.every((type) => storage[type].has(entity))) {
      result.push(entity);
    }
  }
  return result;
}

export function getAllEntities(): Entity[] {
  return Array.from(allEntities);
}

export function clearAllEntities(): void {
  allEntities.clear();
  for (const type of COMPONENT_TYPES) {
    storage[type].clear();
  }
}
