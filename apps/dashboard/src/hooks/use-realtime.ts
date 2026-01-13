"use client";

import { createClient } from "@midday/supabase/client";
import type { Database } from "@midday/supabase/types";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
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

/**
 * Hook for subscribing to Supabase Realtime postgres changes.
 *
 * IMPORTANT:
 * - RLS policies must use inline queries, not SECURITY DEFINER functions
 * - Use specific events (INSERT, UPDATE, DELETE), not "*"
 * - Place in components that don't re-render frequently, or use at a parent level
 */
export function useRealtime<TN extends TableName>({
  channelName,
  events = ["INSERT", "UPDATE"],
  table,
  filter,
  onEvent,
}: UseRealtimeProps<TN>) {
  const onEventRef = useRef(onEvent);

  // Update the ref when onEvent changes (avoids re-subscription)
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!filter) return;

    const supabase = createClient();
    const uniqueChannelName = `${channelName}_${Date.now()}`;

    const channel = supabase.channel(uniqueChannelName);

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

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // Only re-subscribe when these key values change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, table, filter]);
}
