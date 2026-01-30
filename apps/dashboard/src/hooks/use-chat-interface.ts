import { usePathname } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";

// Helper to extract chat ID from pathname with /chat/ prefix
function extractChatId(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const chatIndex = segments.indexOf("chat");

  // If "chat" segment exists and there's an ID after it
  if (chatIndex !== -1) {
    const id = segments[chatIndex + 1];
    if (id) {
      return id;
    }
  }

  return null;
}

export function useChatInterface() {
  const pathname = usePathname();
  const [, setSelectedType] = useQueryState("artifact-type", parseAsString);

  // Initialize state immediately from pathname to avoid blink on refresh
  const [chatId, setChatIdState] = useState<string | null>(() =>
    extractChatId(pathname),
  );

  // Clear artifact-type and reset title when navigating away from chat pages
  const handleNavigateAway = () => {
    setSelectedType(null);
    document.title = "Overview | Midday";
  };

  // Extract chatId from pathname when it changes
  useEffect(() => {
    const id = extractChatId(pathname);
    setChatIdState(id);

    if (!id) {
      handleNavigateAway();
    }
  }, [pathname, setSelectedType]);

  // Listen to popstate events for browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const id = extractChatId(window.location.pathname);
      setChatIdState(id);

      if (!id) {
        handleNavigateAway();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [setSelectedType]);

  const isHome = !chatId;
  const isChatPage = Boolean(chatId);

  const setChatId = (id: string) => {
    // Preserve query parameters when updating the URL
    const currentSearch = window.location.search;
    const segments = pathname.split("/").filter(Boolean);

    // Check if first segment is a locale (2 chars like 'en', 'sv', etc.)
    const hasLocale = segments[0]?.length === 2;
    const locale = hasLocale ? segments[0] : null;

    const newPath = locale
      ? `/${locale}/chat/${id}${currentSearch}`
      : `/chat/${id}${currentSearch}`;

    window.history.pushState({}, "", newPath);
    setChatIdState(id);
  };

  return {
    isHome,
    isChatPage,
    chatId,
    setChatId,
  };
}
