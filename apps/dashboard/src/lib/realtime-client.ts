"use client";
import { authClient } from "@midday/auth/client";
import { clearAccessToken, getAccessToken } from "@/utils/session";
import { RealtimeClient, type Subscription } from "./realtime-client-core";

export type {
  EventType,
  RealtimePayload,
  TableName,
} from "./realtime-client-core";

let client: RealtimeClient | undefined;
let activeTeam: string | undefined;
export function subscribeRealtime(subscription: Subscription): () => void {
  if (process.env.NEXT_PUBLIC_REALTIME_ENABLED === "false") return () => {};
  if (!client) {
    client = new RealtimeClient({
      url: `${process.env.NEXT_PUBLIC_API_URL}/realtime/stream`,
      getToken: () => {
        clearAccessToken();
        return getAccessToken();
      },
      onError: (error) => console.warn("[Realtime]", error),
    });
    authClient.$store.listen("$sessionSignal", () => client?.reconnect());
    let sessionId: string | undefined;
    let initialized = false;
    authClient.$store.atoms.session?.subscribe(({ data, isPending }) => {
      if (isPending) return;
      if (!initialized) {
        initialized = true;
        sessionId = data?.session.id;
      } else if (sessionId !== data?.session.id) {
        sessionId = data?.session.id;
        client?.reconnect();
      }
    });
  }
  const team = /^team_id=eq\.(.+)$/.exec(subscription.filter)?.[1];
  if (team && team !== activeTeam) {
    activeTeam = team;
    client.reconnect();
  }
  return client.subscribe(subscription);
}
