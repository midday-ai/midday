import type { Database } from "@midday/db/client";
import { AppEventEmitter } from "./emitter";
import { registerActivityListeners } from "./registry";
import type { ActivityEventName, ActivityEvents } from "./types";

let globalEmitter: AppEventEmitter | null = null;

export function initializeEventSystem(db: Database): AppEventEmitter {
  if (!globalEmitter) {
    globalEmitter = new AppEventEmitter({ db });
    registerActivityListeners(globalEmitter);
  }
  return globalEmitter;
}

export function getEventEmitter(): AppEventEmitter {
  if (!globalEmitter) {
    throw new Error(
      "Event system not initialized. Call initializeEventSystem first.",
    );
  }
  return globalEmitter;
}

// Convenience function for emitting events
export function emitEvent<T extends ActivityEventName>(
  eventName: T,
  data: ActivityEvents[T],
): void {
  getEventEmitter().emitEvent(eventName, data);
}

// Re-export types and schemas for convenience
export type {
  ActivityEvents,
  ActivityEventName,
  EventListener,
  EventContext,
} from "./types";
export {
  customerCreatedEventSchema,
  transactionCategorizedEventSchema,
  transactionAssignedEventSchema,
} from "./types";
export { AppEventEmitter } from "./emitter";
