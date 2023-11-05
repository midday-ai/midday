"use client";

import { createClient } from "@midday/supabase/client";
import { Button } from "@midday/ui/button";
import { useToast } from "@midday/ui/use-toast";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function Deployments() {
  const supabase = createClient();
  const router = useRouter();
  const { toast, dismiss, id } = useToast();

  useEffect(() => {
    const channel = supabase
      .channel("realtime_transactions")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "deployments",
        },
        () => {
          toast({
            duration: 60000,
            title: "A new update is available",
            description: "Refresh to get the latest and greatest",
            action: (
              <Button
                variant="outline"
                onClick={() => {
                  router.refresh();
                  dismiss(id);
                }}
              >
                Refresh
              </Button>
            ),
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router, id]);

  return null;
}
