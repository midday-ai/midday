"use client";

import { useToast } from "@midday/ui/use-toast";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Access was denied. Please try again.",
  unauthorized_client: "This sign-in method is not authorized.",
  invalid_request: "The sign-in request was invalid. Please try again.",
  server_error: "The authentication server encountered an error.",
  temporarily_unavailable: "Sign-in is temporarily unavailable.",
};

export function OAuthErrorAlert() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const provider = searchParams.get("provider");

  useEffect(() => {
    if (error) {
      const providerName = provider
        ? provider.charAt(0).toUpperCase() + provider.slice(1)
        : "OAuth";

      const message =
        errorDescription ||
        ERROR_MESSAGES[error] ||
        "Sign-in failed. Please try again.";

      console.error(`[OAuthErrorAlert] ${providerName} sign-in failed:`, {
        error,
        errorDescription,
      });

      toast({
        duration: 8000,
        variant: "error",
        title: `${providerName} sign-in failed`,
        description: message,
      });
    }
  }, [error, errorDescription, provider, toast]);

  return null;
}
