type EventMap = {
  circleClicked: { circleX: number; circleY: number; clickX: number; clickY: number; damage: number };
  circleCollided: { circleX: number; circleY: number; circleRadius: number; collisionX: number; collisionY: number; damage: number };
  circleKilled: { x: number; y: number; color: string; bonusMoney: number };
  shopOpened: undefined;
  upgradePurchased: undefined;
  gameReset: undefined;
  circleHoverChanged: { isHovering: boolean };
};

type EventName = keyof EventMap;
type EventPayload<T extends EventName> = EventMap[T];
type EventHandler<T extends EventName> = EventPayload<T> extends undefined
  ? () => void
  : (payload: EventPayload<T>) => void;

class EventBus {
  private handlers = new Map<EventName, Set<EventHandler<EventName>>>();

  on<T extends EventName>(event: T, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.add(handler as EventHandler<EventName>);
    }

    return () => this.off(event, handler);
  }

  off<T extends EventName>(event: T, handler: EventHandler<T>): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.delete(handler as EventHandler<EventName>);
    }
  }

  emit<T extends EventName>(
    ...args: EventPayload<T> extends undefined
      ? [event: T]
      : [event: T, payload: EventPayload<T>]
  ): void {
    const [event, payload] = args;
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      for (const handler of eventHandlers) {
        (handler as (payload?: EventPayload<T>) => void)(payload);
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();
