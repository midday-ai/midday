import type { createClient } from "@midday/supabase/client";
import { isLocalBackend } from "@midday/utils/backend";
import type {
  EventType,
  RealtimePayload,
  TableName,
} from "./realtime-client-core";

type SupabaseClient = ReturnType<typeof createClient>;
/** Lazy factories ensure the unused provider never opens a connection. */
export function subscribeUsingBackend(providers: {
  supabase: () => () => void;
  local: () => () => void;
}): () => void {
  return isLocalBackend() ? providers.local() : providers.supabase();
}
export function subscribeSupabase(
  client: Pick<SupabaseClient, "channel" | "removeChannel">,
  options: {
    channelName: string;
    table: TableName;
    events: EventType[];
    filter: string;
    onEvent: (payload: RealtimePayload) => unknown;
  },
): () => void {
  const channel = client.channel(
    `${options.channelName}:${Math.random().toString(36).slice(2, 8)}`,
  );
  for (const event of options.events)
    channel.on(
      "postgres_changes",
      {
        event,
        schema: "public",
        table: options.table,
        filter: options.filter,
      },
      (payload) => options.onEvent(payload),
    );
  channel.subscribe((status, error) => {
    if (status === "CHANNEL_ERROR")
      console.error(
        `[Realtime] Channel error for ${options.channelName}:`,
        error,
      );
    else if (status === "TIMED_OUT")
      console.warn(
        `[Realtime] Subscription timed out for ${options.channelName}`,
      );
  });
  return () => {
    void client.removeChannel(channel);
  };
}
