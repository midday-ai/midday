"use client";

import { invalidateCacheAction } from "@/actions/invalidate-cache-action";
import { createClient } from "@midday/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function Realtime({ teamId }) {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const channel = supabase
      .channel("realtime_transactions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          invalidateCacheAction([
            `transactions-${teamId}`,
            `spending-${teamId}`,
            `metrics-${teamId}`,
          ]);

          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, teamId]);

  return null;
}
