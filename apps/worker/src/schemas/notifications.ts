import { notificationSchema } from "@midday/jobs/schema";
import type { z } from "zod";

/**
 * Notification payload schema
 * Matches the Trigger.dev notification schema
 */
export const notificationPayloadSchema = notificationSchema;

export type NotificationPayload = z.infer<typeof notificationPayloadSchema>;
