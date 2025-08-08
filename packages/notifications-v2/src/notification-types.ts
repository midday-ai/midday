import type { NotificationChannel } from "@midday/db/queries";

export interface NotificationType {
  type: string;
  channels: NotificationChannel[];
  showInSettings: boolean;
}

export const allNotificationTypes: NotificationType[] = [
  {
    type: "transactions_created",
    channels: ["in_app", "email"],
    showInSettings: true,
  },
  {
    type: "invoice_paid",
    channels: ["in_app", "email"],
    showInSettings: true,
  },
  {
    type: "invoice_overdue",
    channels: ["in_app", "email"],
    showInSettings: true,
  },
  {
    type: "inbox_new",
    channels: ["in_app"],
    showInSettings: true,
  },
  {
    type: "invoice_scheduled",
    channels: ["in_app"],
    showInSettings: true,
  },
  {
    type: "invoice_sent",
    channels: ["in_app"],
    showInSettings: true,
  },
  {
    type: "invoice_reminder_sent",
    channels: ["in_app"],
    showInSettings: true,
  },

  {
    type: "invoice_cancelled",
    channels: ["in_app"],
    showInSettings: true,
  },
];

// Get all notification types (including hidden ones)
export function getAllNotificationTypes(): NotificationType[] {
  return allNotificationTypes;
}

// Get only notification types that should appear in user settings
export function getUserSettingsNotificationTypes(): NotificationType[] {
  return allNotificationTypes.filter((type) => type.showInSettings);
}

// Get a specific notification type by its type string
export function getNotificationTypeByType(
  typeString: string,
): NotificationType | undefined {
  return allNotificationTypes.find((type) => type.type === typeString);
}

// Check if a notification type should appear in settings
export function shouldShowInSettings(typeString: string): boolean {
  const notificationType = getNotificationTypeByType(typeString);
  return notificationType?.showInSettings ?? false;
}
