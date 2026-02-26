import { GenerateDealProcessor } from "./generate-deal";
import { DealRecurringSchedulerProcessor } from "./generate-recurring";
import { DealNotificationProcessor } from "./deal-notification";
import { ScheduleDealProcessor } from "./schedule-deal";
import { SendDealEmailProcessor } from "./send-deal-email";
import { SendDealReminderProcessor } from "./send-deal-reminder";
import { DealUpcomingNotificationProcessor } from "./upcoming-notification";

/**
 * Export all deal processors (for type imports)
 */
export { GenerateDealProcessor } from "./generate-deal";
export { DealRecurringSchedulerProcessor } from "./generate-recurring";
export { DealNotificationProcessor } from "./deal-notification";
export { ScheduleDealProcessor } from "./schedule-deal";
export { SendDealEmailProcessor } from "./send-deal-email";
export { SendDealReminderProcessor } from "./send-deal-reminder";
export { DealUpcomingNotificationProcessor } from "./upcoming-notification";

/**
 * Deal processor registry
 * Maps job names to processor instances
 */
export const dealProcessors = {
  "deal-notification": new DealNotificationProcessor(),
  "deal-recurring-scheduler": new DealRecurringSchedulerProcessor(),
  "deal-upcoming-notification": new DealUpcomingNotificationProcessor(),
  "generate-deal": new GenerateDealProcessor(),
  "send-deal-email": new SendDealEmailProcessor(),
  "send-deal-reminder": new SendDealReminderProcessor(),
  "schedule-deal": new ScheduleDealProcessor(),
};
