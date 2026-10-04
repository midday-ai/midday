export type TableName =
  | "inbox"
  | "transactions"
  | "documents"
  | "customers"
  | "activities";
export type EventType = "INSERT" | "UPDATE" | "DELETE";
export type RealtimeRecord = {
  id?: string;
  status?: string | null;
  enrichment_status?: string | null;
  processing_status?: string | null;
  user_id?: string | null;
  priority?: number | null;
  type?: string | null;
};
export type RealtimePayload<T = RealtimeRecord> = {
  eventType: EventType;
  new: T;
  old: Partial<T>;
};
export type RealtimeEvent = RealtimePayload & {
  table: TableName;
  team_id: string;
  user_id: string | null;
};
export type Subscription = {
  table: TableName;
  events: readonly EventType[];
  filter: string;
  onEvent: (payload: RealtimeEvent) => unknown;
};
const tables = new Set([
  "inbox",
  "transactions",
  "documents",
  "customers",
  "activities",
]);
const eventTypes = new Set(["INSERT", "UPDATE", "DELETE"]);
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function parseRealtimeEvent(data: string): RealtimeEvent | null {
  try {
    const event: unknown = JSON.parse(data);
    if (
      !isRecord(event) ||
      typeof event.table !== "string" ||
      !tables.has(event.table) ||
      typeof event.eventType !== "string" ||
      !eventTypes.has(event.eventType) ||
      typeof event.team_id !== "string" ||
      !event.team_id ||
      !(event.user_id === null || typeof event.user_id === "string") ||
      !isRecord(event.new) ||
      !isRecord(event.old)
    )
      return null;
    return event as RealtimeEvent;
  } catch {
    return null;
  }
}
export function matchesSubscription(
  event: RealtimeEvent,
  subscription: Subscription,
): boolean {
  if (
    event.table !== subscription.table ||
    !subscription.events.includes(event.eventType)
  )
    return false;
  const match = /^(team_id|user_id|id)=eq\.(.+)$/.exec(subscription.filter);
  if (!match) return false;
  const [, column, expected] = match;
  const actual =
    column === "team_id"
      ? event.team_id
      : column === "user_id"
        ? (event.user_id ?? event.new.user_id)
        : (event.new.id ?? event.old.id);
  return actual === expected;
}
/** Bounded incremental SSE parser: chunks can split lines or CRLF delimiters. */
export class SSEParser {
  private buffer = "";
  private event = "";
  private data: string[] = [];
  private size = 0;
  constructor(
    private readonly onMessage: (event: string, data: string) => void,
  ) {}
  feed(chunk: string) {
    this.buffer += chunk;
    let end = this.buffer.indexOf("\n");
    while (end !== -1) {
      const line = this.buffer.slice(0, end).replace(/\r$/, "");
      this.buffer = this.buffer.slice(end + 1);
      this.size += line.length;
      if (this.size > 65_536)
        throw new Error("Realtime event exceeds size limit");
      if (line === "") {
        if (this.data.length)
          this.onMessage(this.event || "message", this.data.join("\n"));
        this.event = "";
        this.data = [];
        this.size = 0;
      } else if (!line.startsWith(":")) {
        const separator = line.indexOf(":");
        const field = separator === -1 ? line : line.slice(0, separator);
        let value = separator === -1 ? "" : line.slice(separator + 1);
        if (value.startsWith(" ")) value = value.slice(1);
        if (field === "event") this.event = value;
        if (field === "data") this.data.push(value);
      }
      end = this.buffer.indexOf("\n");
    }
    if (this.buffer.length + this.size > 65_536)
      throw new Error("Realtime event exceeds size limit");
  }
}
type ClientOptions = {
  url: string;
  getToken: () => Promise<string | null>;
  fetch?: (input: string, init: RequestInit) => Promise<Response>;
  retryMs?: number;
  maxRetryMs?: number;
  onError?: (error: unknown) => void;
};
/** One instance per tab, shared by every local realtime hook. */
export class RealtimeClient {
  private subscriptions = new Set<Subscription>();
  private controller: AbortController | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private failures = 0;
  private readonly fetchStream: NonNullable<ClientOptions["fetch"]>;
  constructor(private readonly options: ClientOptions) {
    this.fetchStream = options.fetch ?? ((input, init) => fetch(input, init));
  }
  subscribe(subscription: Subscription): () => void {
    this.subscriptions.add(subscription);
    this.ensureConnected();
    return () => {
      this.subscriptions.delete(subscription);
      if (!this.subscriptions.size) this.disconnect();
    };
  }
  reconnect() {
    this.disconnect();
    this.ensureConnected();
  }
  private disconnect() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const controller = this.controller;
    this.controller = null;
    controller?.abort();
    this.failures = 0;
  }
  private ensureConnected() {
    if (!this.subscriptions.size || this.controller || this.timer) return;
    const controller = new AbortController();
    this.controller = controller;
    void this.connect(controller);
  }
  private dispatch(event: RealtimeEvent) {
    for (const subscription of this.subscriptions) {
      if (!matchesSubscription(event, subscription)) continue;
      try {
        Promise.resolve(subscription.onEvent(event)).catch((error) =>
          this.options.onError?.(error),
        );
      } catch (error) {
        this.options.onError?.(error);
      }
    }
  }
  private async connect(controller: AbortController) {
    let reader:
      | Pick<
          ReadableStreamDefaultReader<Uint8Array>,
          "read" | "cancel" | "releaseLock"
        >
      | undefined;
    const started = Date.now();
    try {
      const token = await this.options.getToken();
      if (controller.signal.aborted) return;
      if (!token) throw new Error("Realtime session unavailable");
      const response = await this.fetchStream(this.options.url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        },
        signal: controller.signal,
        cache: "no-store",
      });
      if (!response.ok || !response.body)
        throw new Error(`Realtime connection failed (${response.status})`);
      if (!response.headers.get("content-type")?.includes("text/event-stream"))
        throw new Error("Invalid realtime response");
      if (controller.signal.aborted) {
        await response.body.cancel();
        return;
      }
      reader = response.body.getReader();
      const decoder = new TextDecoder();
      const parser = new SSEParser((name, data) => {
        const event = name === "change" ? parseRealtimeEvent(data) : null;
        if (event) this.dispatch(event);
      });
      while (!controller.signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;
        parser.feed(decoder.decode(value, { stream: true }));
      }
    } catch (error) {
      if (!controller.signal.aborted) this.options.onError?.(error);
    } finally {
      if (reader) {
        try {
          await reader.cancel();
        } catch {}
        reader.releaseLock();
      }
      // StrictMode cleanup must not reset a replacement connection.
      if (this.controller === controller) {
        this.controller = null;
        if (!controller.signal.aborted && this.subscriptions.size) {
          if (Date.now() - started > 30_000) this.failures = 0;
          const delay = Math.min(
            (this.options.retryMs ?? 1_000) *
              2 ** Math.min(this.failures++, 16),
            this.options.maxRetryMs ?? 30_000,
          );
          this.timer = setTimeout(() => {
            this.timer = null;
            this.ensureConnected();
          }, delay);
        }
      }
    }
  }
}
