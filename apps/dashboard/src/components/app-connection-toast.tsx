"use client";

import { track } from "@midday/events/client";
import { LogEvents } from "@midday/events/events";
import { useToast } from "@midday/ui/use-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  type AppOAuthErrorCode,
  formatProviderName,
  getErrorDescription,
  getErrorTitle,
} from "@/utils/app-oauth-errors";

const INBOX_PROVIDERS = new Set(["gmail", "outlook"]);

/**
 * Component that watches URL search params for OAuth connection status
 * and displays appropriate toast notifications.
 *
 * Handles both success (connected=true) and error (connected=false) cases.
 * Automatically clears the URL params after showing the toast.
 */
export function AppConnectionToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const hasShownToast = useRef(false);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error") as AppOAuthErrorCode | null;
    const provider = searchParams.get("provider");

    // Prevent showing toast multiple times for the same params
    if (hasShownToast.current) {
      return;
    }

    let timeout: ReturnType<typeof setTimeout> | null = null;

    if (connected === "false") {
      hasShownToast.current = true;

      toast({
        duration: 5000,
        variant: "error",
        title: getErrorTitle(error),
        description: getErrorDescription(error),
      });

      // Clear the URL params after a short delay to avoid flash
      timeout = setTimeout(() => {
        router.replace(pathname, { scroll: false });
      }, 100);
    } else if (connected === "true" && provider) {
      hasShownToast.current = true;

      if (INBOX_PROVIDERS.has(provider)) {
        track({
          event: LogEvents.InboxConnected.name,
          channel: LogEvents.InboxConnected.channel,
          provider,
        });
      }

      const providerName = formatProviderName(provider);

      toast({
        duration: 3000,
        variant: "success",
        title: "Connected Successfully",
        description: `${providerName} has been connected to your account.`,
      });

      // Clear the URL params after a short delay
      timeout = setTimeout(() => {
        router.replace(pathname, { scroll: false });
      }, 100);
    } else if (!connected) {
      // Reset when URL params are cleared, allowing subsequent toasts
      hasShownToast.current = false;
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [searchParams, router, pathname, toast]);

  return null;
}
