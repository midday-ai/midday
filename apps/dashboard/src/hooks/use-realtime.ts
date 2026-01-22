"use client";

import { createClient } from "@midday/supabase/client";
import type { Database } from "@midday/supabase/types";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { useEffect, useRef } from "react";

type PublicSchema = Database[Extract<keyof Database, "public">];
type Tables = PublicSchema["Tables"];
type TableName = keyof Tables;

type EventType = "INSERT" | "UPDATE" | "DELETE";

interface UseRealtimeProps<TN extends TableName> {
  channelName: string;
  /** Specific events to listen for. Defaults to ["INSERT", "UPDATE"]. Don't use "*" - it causes issues with Supabase. */
  events?: EventType[];
  table: TN;
  filter?: string;
  onEvent: (payload: RealtimePostgresChangesPayload<Tables[TN]["Row"]>) => void;
}

// Singleton supabase client for realtime - avoids creating multiple instances
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  return supabaseClient;
}

/**
 * Hook for subscribing to Supabase Realtime postgres changes.
 *
 * IMPORTANT:
 * - Use specific events (INSERT, UPDATE, DELETE), not "*"
 * - Place in components that don't re-render frequently, or use at a parent level
 * - If changing RLS policies, may need to use a new channel name to avoid stale state
 */
export function useRealtime<TN extends TableName>({
  channelName,
  events = ["INSERT", "UPDATE"],
  table,
  filter,
  onEvent,
}: UseRealtimeProps<TN>) {
  const onEventRef = useRef(onEvent);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Update the ref when onEvent changes (avoids re-subscription)
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!filter) {
      return;
    }

    const supabase = getSupabaseClient();
    let channel: RealtimeChannel | null = null;
    let isCleanedUp = false;

    const setupChannel = () => {
      if (isCleanedUp) return;

      channel = supabase.channel(channelName);
      channelRef.current = channel;

      // Add listeners for each event type (avoids "*" which causes issues with Supabase)
      if (events.includes("INSERT")) {
        channel.on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table, filter },
          (payload) =>
            onEventRef.current(
              payload as RealtimePostgresChangesPayload<Tables[TN]["Row"]>,
            ),
        );
      }
      if (events.includes("UPDATE")) {
        channel.on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table, filter },
          (payload) =>
            onEventRef.current(
              payload as RealtimePostgresChangesPayload<Tables[TN]["Row"]>,
            ),
        );
      }
      if (events.includes("DELETE")) {
        channel.on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table, filter },
          (payload) =>
            onEventRef.current(
              payload as RealtimePostgresChangesPayload<Tables[TN]["Row"]>,
            ),
        );
      }

      channel.subscribe((status, err) => {
        if (status === "CHANNEL_ERROR") {
          console.error(`[Realtime] Channel error for ${channelName}:`, err);
        } else if (status === "TIMED_OUT") {
          console.warn(`[Realtime] Subscription timed out for ${channelName}`);
        }
      });
    };

    // Remove existing channel first, then setup new one
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current).then(() => {
        channelRef.current = null;
        setupChannel();
      });
    } else {
      setupChannel();
    }

    return () => {
      isCleanedUp = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
      channelRef.current = null;
    };
    // events is intentionally excluded - it's typically static and including it causes issues
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, table, filter]);
}
