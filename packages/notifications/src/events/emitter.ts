import { EventEmitter } from "node:events";
import type {
  ActivityEventName,
  ActivityEvents,
  EventContext,
  EventListener,
} from "./types";
import {
  customerCreatedEventSchema,
  transactionAssignedEventSchema,
  transactionCategorizedEventSchema,
} from "./types";

export class AppEventEmitter extends EventEmitter {
  private context: EventContext;

  constructor(context: EventContext) {
    super();
    this.context = context;
  }

  // Register a typed listener with database access
  registerListener<T extends ActivityEventName>(
    eventName: T,
    listener: EventListener<ActivityEvents[T]>,
  ): void {
    this.on(eventName, async (data: ActivityEvents[T]) => {
      try {
        await listener.handle(data, this.context);
      } catch (error) {
        console.error(`Failed to handle event ${eventName}:`, error);
      }
    });
  }

  // Emit typed events with Zod validation
  emitEvent<T extends ActivityEventName>(
    eventName: T,
    data: ActivityEvents[T],
  ): boolean {
    // Validate event data with Zod schema
    const validatedData = this.validateEventData(eventName, data);
    return this.emit(eventName, validatedData);
  }

  private validateEventData<T extends ActivityEventName>(
    eventName: T,
    data: ActivityEvents[T],
  ): ActivityEvents[T] {
    switch (eventName) {
      case "customer.created":
        return customerCreatedEventSchema.parse(data) as ActivityEvents[T];
      case "transaction.categorized":
        return transactionCategorizedEventSchema.parse(
          data,
        ) as ActivityEvents[T];
      case "transaction.assigned":
        return transactionAssignedEventSchema.parse(data) as ActivityEvents[T];
      default:
        // For events without schemas, return as-is
        return data;
    }
  }

  // Get database instance for direct access if needed
  getDatabase() {
    return this.context.db;
  }
}
