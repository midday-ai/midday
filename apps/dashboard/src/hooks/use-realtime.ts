"use client";

import { createClient } from "@midday/supabase/client";
import type { Database } from "@midday/supabase/types";
import type {
  RealtimePostgresChangesFilter,
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";

type PublicSchema = Database[Extract<keyof Database, "public">];
type Tables = PublicSchema["Tables"];
type TableName = keyof Tables;

interface UseRealtimeProps<TN extends TableName> {
  channelName: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  table: TN;
  filter?: string;
  onEvent: (payload: RealtimePostgresChangesPayload<Tables[TN]["Row"]>) => void;
}

export function useRealtime<TN extends TableName>({
  channelName,
  event = "*",
  table,
  filter,
  onEvent,
}: UseRealtimeProps<TN>) {
  const supabase: SupabaseClient = createClient();
  const onEventRef = useRef(onEvent);
  const [isReady, setIsReady] = useState(false);

  // Update the ref when onEvent changes
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  // Add a small delay to prevent rapid subscription creation/destruction
  useEffect(() => {
    if (filter === undefined) {
      setIsReady(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100); // Small delay to prevent race conditions

    return () => {
      clearTimeout(timer);
      setIsReady(false);
    };
  }, [filter]);

  useEffect(() => {
    // Don't set up subscription if not ready or filter is undefined
    if (!isReady || filter === undefined) {
      return;
    }

    const filterConfig: RealtimePostgresChangesFilter<"*"> = {
      event: event as RealtimePostgresChangesFilter<"*">["event"],
      schema: "public",
      table,
      filter,
    };

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        filterConfig,
        (payload: RealtimePostgresChangesPayload<Tables[TN]["Row"]>) => {
          onEventRef.current(payload);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // Note: supabase is intentionally not included in dependencies to avoid
    // dependency array size changes between renders
  }, [channelName, event, table, filter, isReady]);
}
