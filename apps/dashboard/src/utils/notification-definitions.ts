import type { useI18n } from "@/locales/client";

// Frontend notification definitions with i18n support
export interface NotificationDisplayInfo {
  type: string;
  name: string;
  description: string;
}

// Helper function to get display info for a notification type using i18n
export function getNotificationDisplayInfo(
  type: string,
  t: ReturnType<typeof useI18n>,
): NotificationDisplayInfo | undefined {
  // Check if the notification type exists in translations
  try {
    // @ts-expect-error - next-international typing might be strict
    const name = t(`notifications.${type}.name`);
    // @ts-expect-error - next-international typing might be strict
    const description = t(`notifications.${type}.description`);

    // If the translation keys don't exist, t() will return the key itself
    // Check if we got actual translations or just the keys back
    if (
      name.includes("notifications.") ||
      description.includes("notifications.")
    ) {
      return undefined;
    }

    return {
      type,
      name,
      description,
    };
  } catch {
    // If translation doesn't exist, return undefined
    return undefined;
  }
}

// Helper function to get display info with fallback
export function getNotificationDisplayInfoWithFallback(
  type: string,
  t: ReturnType<typeof useI18n>,
): NotificationDisplayInfo {
  const displayInfo = getNotificationDisplayInfo(type, t);

  if (displayInfo) {
    return displayInfo;
  }

  // Fallback for unknown notification types
  return {
    type,
    name: type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    description: `Notifications for ${type.replace(/_/g, " ")}`,
  };
}

// Helper function to get category display title from i18n
export function getCategoryDisplayTitle(
  category: string,
  t: ReturnType<typeof useI18n>,
): string {
  try {
    // @ts-expect-error - next-international typing might be strict
    const categoryTitle = t(`notifications.categories.${category}`);

    // If the translation key doesn't exist, t() will return the key itself
    // Check if we got actual translation or just the key back
    if (categoryTitle.includes("notifications.categories.")) {
      // Fallback: capitalize first letter and replace underscores with spaces
      return (
        category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, " ")
      );
    }

    return categoryTitle;
  } catch {
    // Fallback for unknown categories
    return (
      category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, " ")
    );
  }
}
