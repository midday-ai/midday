"use client";

import { useUserQuery } from "@/hooks/use-user";
import { Icons } from "@midday/ui/icons";
import { SubmitButton } from "@midday/ui/submit-button";
import { useState } from "react";

export function ConnectSlack() {
  const [isLoading, setIsLoading] = useState(false);
  const { data: user } = useUserQuery();

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/apps/slack/install-url");
      const data = await response.json();

      if (data.url) {
        window.open(data.url, "_blank", "width=600,height=600");
      }
    } catch (error) {
      console.error("Failed to get Slack install URL:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user?.team?.inboxId) {
    return null;
  }

  return (
    <SubmitButton
      className="px-6 py-4 w-full font-medium h-[40px]"
      variant="outline"
      onClick={handleConnect}
      isSubmitting={isLoading}
    >
      <div className="flex items-center space-x-2">
        <Icons.Slack className="size-[22px]" />
        <span>Connect Slack</span>
      </div>
    </SubmitButton>
  );
}
