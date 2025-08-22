import type { AppEventEmitter } from "./emitter";
import { CustomerCreatedListener } from "./listeners/customer-listeners";

export function registerActivityListeners(emitter: AppEventEmitter): void {
  // Register customer event listeners
  emitter.registerListener("customer.created", new CustomerCreatedListener());

  // We'll add more listeners here as we implement them
  // emitter.registerListener('transaction.categorized', new TransactionCategorizedListener());
  // emitter.registerListener('transaction.assigned', new TransactionAssignedListener());
}
