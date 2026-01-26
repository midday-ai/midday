import { NotificationProcessor } from "./notification";

/**
 * Export all notification processors (for type imports)
 */
export { NotificationProcessor } from "./notification";

/**
 * Notification processor registry
 * Maps job names to processor instances
 */
export const notificationProcessors = {
  notification: new NotificationProcessor(),
};
