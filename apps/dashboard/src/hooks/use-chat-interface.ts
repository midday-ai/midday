import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function useChatInterface() {
  const pathname = usePathname();

  // Initialize state immediately from pathname to avoid blink on refresh
  const getInitialChatId = () => {
    const segments = pathname.split("/").filter(Boolean);
    const potentialChatId =
      segments.length === 1 ? segments[0] : segments[1] || null;
    return potentialChatId || null;
  };

  const [chatId, setChatIdState] = useState<string | null>(getInitialChatId);

  // Extract chatId from pathname
  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);

    // If we have segments, the chatId is either:
    // - segments[0] if no locale (e.g., /chatId)
    // - segments[1] if locale exists (e.g., /en/chatId)
    // For simplicity, let's assume if there's only 1 segment, it's the chatId
    const potentialChatId =
      segments.length === 1 ? segments[0] : segments[1] || null;
    setChatIdState(potentialChatId || null);
  }, [pathname]);

  // Listen to popstate events for browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const segments = window.location.pathname.split("/").filter(Boolean);
      const potentialChatId =
        segments.length === 1 ? segments[0] : segments[1] || null;
      setChatIdState(potentialChatId || null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const isHome = !chatId;
  const isChatPage = Boolean(chatId);

  const setChatId = (id: string) => {
    // Preserve the locale in the URL
    const segments = pathname.split("/").filter(Boolean);
    const locale = segments[0];
    const newPath = locale ? `/${locale}/${id}` : `/${id}`;

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
