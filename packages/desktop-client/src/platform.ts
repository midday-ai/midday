import { isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export function isDesktopApp() {
  return isTauri();
}

export type DeepLinkHandler = (path: string) => void;

export async function listenForDeepLinks(handler: DeepLinkHandler) {
  if (!isDesktopApp()) {
    console.log("Deep links are only available in desktop app");
    return () => {}; // No-op cleanup for non-desktop environments
  }

  try {
    const unlisten = await listen<string>("deep-link-navigate", (event) => {
      console.log("🎯 Deep link navigation received:", event.payload);
      handler(event.payload);
    });

    console.log("✅ Deep link listener registered");
    return unlisten;
  } catch (error) {
    console.error("Failed to listen for deep links:", error);
    return () => {};
  }
}

/**
 * Generate a midday:// deep link URL
 * @param path The path to navigate to (without leading slash)
 * @returns The deep link URL
 *
 * @example
 * ```typescript
 * // Generate deep link URLs
 * const dashboardLink = createDeepLink('dashboard');           // midday://dashboard
 * const transactionLink = createDeepLink('transactions/123'); // midday://transactions/123
 * const settingsLink = createDeepLink('settings/profile');    // midday://settings/profile
 * ```
 */
export function createDeepLink(path: string): string {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `midday://${cleanPath}`;
}
