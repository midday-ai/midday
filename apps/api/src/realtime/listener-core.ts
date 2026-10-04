export type ChangeEvent = {
  table: "inbox" | "transactions" | "documents" | "customers" | "activities";
  type: "INSERT" | "UPDATE" | "DELETE";
  team_id: string;
  user_id: string | null;
  new: Record<string, unknown>;
  old: Record<string, unknown>;
};
type Identity = { teamId: string; userId: string };
export type ListenerClient = {
  connect(): Promise<unknown>;
  query(sql: string): Promise<unknown>;
  end(): Promise<void>;
  on(
    event: "notification",
    listener: (message: { channel: string; payload?: string }) => void,
  ): unknown;
  on(event: "error", listener: (error: Error) => void): unknown;
  on(event: "end", listener: () => void): unknown;
};
type Subscriber = Identity & { callback: (event: ChangeEvent) => void };
const tables = new Set([
  "inbox",
  "transactions",
  "documents",
  "customers",
  "activities",
]);
const types = new Set(["INSERT", "UPDATE", "DELETE"]);
const stringFields = new Set([
  "id",
  "status",
  "enrichment_status",
  "processing_status",
  "user_id",
  "type",
]);
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isSubset(value: unknown): value is Record<string, unknown> {
  return (
    isRecord(value) &&
    Object.entries(value).every(([key, item]) => {
      if (key === "priority")
        return (
          item === null || (typeof item === "number" && Number.isFinite(item))
        );
      return (
        stringFields.has(key) &&
        (item === null || (typeof item === "string" && item.length <= 256))
      );
    })
  );
}
export function parseNotification(payload?: string): ChangeEvent | null {
  if (!payload || payload.length >= 8_000) return null;
  try {
    const event: unknown = JSON.parse(payload);
    if (
      !isRecord(event) ||
      typeof event.table !== "string" ||
      !tables.has(event.table) ||
      typeof event.type !== "string" ||
      !types.has(event.type) ||
      typeof event.team_id !== "string" ||
      !event.team_id ||
      event.team_id.length > 128 ||
      !(
        event.user_id === null ||
        (typeof event.user_id === "string" && event.user_id.length <= 128)
      ) ||
      (event.table === "activities" && !event.user_id) ||
      !isSubset(event.new) ||
      !isSubset(event.old)
    )
      return null;
    return event as ChangeEvent;
  } catch {
    return null;
  }
}
export function canReceive(event: ChangeEvent, identity: Identity): boolean {
  return (
    event.team_id === identity.teamId &&
    (event.table !== "activities" || event.user_id === identity.userId)
  );
}

/** One lazy direct LISTEN connection for all authenticated subscribers. */
export class RealtimeListener {
  private subscribers = new Map<string, Set<Subscriber>>();
  private client: ListenerClient | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private failures = 0;
  private ready = false;
  private closed = false;
  constructor(
    private readonly options: {
      createClient: () => ListenerClient;
      onError?: (error: unknown) => void;
      retryMs?: number;
      maxRetryMs?: number;
    },
  ) {}
  get connected() {
    return this.ready;
  }
  subscribe(identity: Identity, callback: Subscriber["callback"]): () => void {
    if (this.closed) throw new Error("Realtime listener is closed");
    const subscriber = { ...identity, callback };
    let team = this.subscribers.get(identity.teamId);
    if (!team) {
      team = new Set();
      this.subscribers.set(identity.teamId, team);
    }
    team.add(subscriber);
    this.ensureConnected();
    return () => {
      team.delete(subscriber);
      if (!team.size && this.subscribers.get(identity.teamId) === team)
        this.subscribers.delete(identity.teamId);
      if (!this.subscribers.size) void this.stop();
    };
  }
  private stop() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.ready = false;
    this.failures = 0;
    const client = this.client;
    this.client = null;
    return client?.end().catch((error) => this.options.onError?.(error));
  }
  async close() {
    this.closed = true;
    this.subscribers.clear();
    await this.stop();
  }
  private ensureConnected() {
    if (this.closed || !this.subscribers.size || this.client || this.retryTimer)
      return;
    let client: ListenerClient;
    try {
      client = this.options.createClient();
    } catch (error) {
      this.options.onError?.(error);
      this.scheduleRetry();
      return;
    }
    this.client = client;
    client.on("notification", (message) => {
      if (this.client !== client || message.channel !== "midday_realtime")
        return;
      const event = parseNotification(message.payload);
      if (!event) return;
      for (const subscriber of this.subscribers.get(event.team_id) ?? []) {
        if (!canReceive(event, subscriber)) continue;
        try {
          subscriber.callback(event);
        } catch (error) {
          this.options.onError?.(error);
        }
      }
    });
    client.on("error", (error) => this.disconnected(client, error));
    client.on("end", () => this.disconnected(client));
    void (async () => {
      try {
        await client.connect();
        if (this.client !== client) return;
        await client.query("LISTEN midday_realtime");
        if (this.client !== client) return;
        this.ready = true;
        this.failures = 0;
      } catch (error) {
        this.disconnected(client, error);
      }
    })();
  }
  private disconnected(client: ListenerClient, error?: unknown) {
    if (this.client !== client) return;
    this.client = null;
    this.ready = false;
    if (error) this.options.onError?.(error);
    // Relinquish ownership before end: pg can emit both error and end.
    void client.end().catch(() => {});
    this.scheduleRetry();
  }
  private scheduleRetry() {
    if (this.closed || !this.subscribers.size || this.retryTimer) return;
    const delay = Math.min(
      (this.options.retryMs ?? 1_000) * 2 ** Math.min(this.failures++, 16),
      this.options.maxRetryMs ?? 30_000,
    );
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.ensureConnected();
    }, delay);
  }
}
