import type { NotificationChannel } from "@midday/db/queries";

export interface NotificationType {
  type: string;
  channels: NotificationChannel[];
  showInSettings: boolean;
  category?: string;
  order?: number;
}

export const allNotificationTypes: NotificationType[] = [
  {
    type: "transactions_created",
    channels: ["in_app", "email"],
    showInSettings: true,
    category: "transactions",
    order: 2,
  },
  {
    type: "transactions_exported",
    channels: ["in_app", "email"],
    showInSettings: false,
    category: "transactions",
    order: 3,
  },
  {
    type: "invoice_paid",
    channels: ["in_app", "email"],
    showInSettings: true,
    category: "invoices",
    order: 1,
  },
  {
    type: "invoice_overdue",
    channels: ["in_app", "email"],
    showInSettings: true,
    category: "invoices",
    order: 1,
  },
  {
    type: "inbox_new",
    channels: ["in_app"],
    showInSettings: true,
    category: "inbox",
    order: 3,
  },
  {
    type: "inbox_auto_matched",
    channels: ["in_app"],
    showInSettings: true,
    category: "inbox",
    order: 1,
  },
  {
    type: "inbox_needs_review",
    channels: ["in_app"],
    showInSettings: true,
    category: "inbox",
    order: 2,
  },
  {
    type: "inbox_cross_currency_matched",
    channels: ["in_app"],
    showInSettings: true,
    category: "inbox",
    order: 3,
  },
  {
    type: "invoice_scheduled",
    channels: ["in_app"],
    showInSettings: true,
    category: "invoices",
    order: 1,
  },
  {
    type: "invoice_sent",
    channels: ["in_app"],
    showInSettings: true,
    category: "invoices",
    order: 1,
  },
  {
    type: "invoice_reminder_sent",
    channels: ["in_app"],
    showInSettings: true,
    category: "invoices",
    order: 1,
  },
  {
    type: "invoice_cancelled",
    channels: ["in_app"],
    showInSettings: true,
    category: "invoices",
    order: 1,
  },
  {
    type: "invoice_created",
    channels: ["in_app"],
    showInSettings: true,
    category: "invoices",
    order: 1,
  },
  {
    type: "invoice_refunded",
    channels: ["in_app"],
    showInSettings: true,
    category: "invoices",
    order: 1,
  },
  {
    type: "recurring_series_completed",
    channels: ["in_app"],
    showInSettings: true,
    category: "invoices",
    order: 1,
  },
  {
    type: "recurring_series_started",
    channels: ["in_app"],
    showInSettings: true,
    category: "invoices",
    order: 1,
  },
  {
    type: "recurring_series_paused",
    channels: ["in_app"],
    showInSettings: true,
    category: "invoices",
    order: 1,
  },
  {
    type: "recurring_invoice_upcoming",
    channels: ["in_app", "email"],
    showInSettings: true,
    category: "invoices",
    order: 1,
  },
  {
    type: "insight_ready",
    channels: ["in_app", "email"],
    showInSettings: true,
    category: "insights",
    order: 1,
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

// Get notification types grouped by category
export interface NotificationCategory {
  category: string;
  order: number;
  types: NotificationType[];
}

export function getNotificationTypesByCategory(): NotificationCategory[] {
  const settingsTypes = getUserSettingsNotificationTypes();
  const categoryMap = new Map<string, NotificationCategory>();

  for (const notificationType of settingsTypes) {
    const category = notificationType.category || "other";
    const order = notificationType.order || 999;

    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        category,
        order,
        types: [],
      });
    }

    categoryMap.get(category)!.types.push(notificationType);
  }

  // Sort categories by order, then by name
  return Array.from(categoryMap.values()).sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return a.category.localeCompare(b.category);
  });
}
