"use client";
import { createClient } from "@midday/supabase/client";
import { useEffect, useRef } from "react";
import {
  type EventType,
  type RealtimePayload,
  subscribeRealtime,
  type TableName,
} from "@/lib/realtime-client";
import {
  subscribeSupabase,
  subscribeUsingBackend,
} from "@/lib/realtime-provider";

export type { RealtimePayload, TableName } from "@/lib/realtime-client";

let supabaseClient: ReturnType<typeof createClient> | undefined;
function getSupabaseClient() {
  supabaseClient ??= createClient();
  return supabaseClient;
}
/** Supabase stays the default; local subscriptions share one authorized SSE stream. */
export function useRealtime<TN extends TableName>({
  channelName,
  events = ["INSERT", "UPDATE"],
  table,
  filter,
  onEvent,
}: {
  channelName: string;
  events?: EventType[];
  table: TN;
  filter?: string;
  onEvent: (payload: RealtimePayload) => unknown;
}) {
  const onEventRef = useRef(onEvent);
  const eventKey = events.join(",");
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);
  useEffect(() => {
    if (!filter) return;
    const options = {
      channelName,
      table,
      events: eventKey.split(",") as EventType[],
      filter,
      onEvent: (event: RealtimePayload) => onEventRef.current(event),
    };
    return subscribeUsingBackend({
      supabase: () => subscribeSupabase(getSupabaseClient(), options),
      local: () => subscribeRealtime(options),
    });
  }, [channelName, table, filter, eventKey]);
}
