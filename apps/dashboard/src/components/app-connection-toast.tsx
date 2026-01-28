"use client";

import {
  type AppOAuthErrorCode,
  formatProviderName,
  getErrorDescription,
  getErrorTitle,
} from "@/utils/app-oauth-errors";
import { useToast } from "@midday/ui/use-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

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

    if (connected === "false") {
      hasShownToast.current = true;

      toast({
        duration: 5000,
        variant: "error",
        title: getErrorTitle(error),
        description: getErrorDescription(error),
      });

      // Clear the URL params after a short delay to avoid flash
      setTimeout(() => {
        router.replace(pathname, { scroll: false });
      }, 100);
    } else if (connected === "true" && provider) {
      hasShownToast.current = true;

      const providerName = formatProviderName(provider);

      toast({
        duration: 3000,
        variant: "success",
        title: "Connected Successfully",
        description: `${providerName} has been connected to your account.`,
      });

      // Clear the URL params after a short delay
      setTimeout(() => {
        router.replace(pathname, { scroll: false });
      }, 100);
    }
  }, [searchParams, router, pathname, toast]);

  // Reset the flag when the component unmounts or params change
  useEffect(() => {
    return () => {
      hasShownToast.current = false;
    };
  }, []);

  return null;
}
