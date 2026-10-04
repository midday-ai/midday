import { describe, expect, test } from "bun:test";
import { EventEmitter } from "node:events";
import {
  matchesSubscription,
  parseRealtimeEvent,
  RealtimeClient,
  type RealtimeEvent,
  SSEParser,
  type Subscription,
} from "../../../../dashboard/src/lib/realtime-client-core";
import {
  canReceive,
  type ListenerClient,
  parseNotification,
  RealtimeListener,
} from "../listener-core";

const event: RealtimeEvent = {
  table: "inbox",
  eventType: "UPDATE",
  team_id: "team-a",
  user_id: null,
  new: { id: "doc.with.dots", status: "done" },
  old: { status: "processing" },
};
const subscription: Subscription = {
  table: "inbox",
  events: ["INSERT", "UPDATE"],
  filter: "team_id=eq.team-a",
  onEvent() {},
};
const notification = { ...event, type: event.eventType };
const waitFor = async (condition: () => boolean) => {
  const deadline = Date.now() + 5_000;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error("Timed out");
    await Bun.sleep(5);
  }
};
function mockFetch() {
  const calls: {
    init: RequestInit;
    stream: ReadableStreamDefaultController<Uint8Array>;
  }[] = [];
  return {
    calls,
    fetch: async (_url: string, init: RequestInit) => {
      let stream!: ReadableStreamDefaultController<Uint8Array>;
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          stream = controller;
        },
      });
      init.signal?.addEventListener("abort", () => {
        try {
          stream.error(new Error("aborted"));
        } catch {}
      });
      calls.push({ init, stream });
      return new Response(body, {
        headers: { "Content-Type": "text/event-stream" },
      });
    },
  };
}
class FakePg extends EventEmitter implements ListenerClient {
  ended = 0;
  constructor(private readonly fail = false) {
    super();
  }
  async connect() {
    if (this.fail) throw new Error("Connection refused");
  }
  async query() {}
  async end() {
    this.ended++;
    this.emit("end");
  }
  notify(payload: unknown) {
    this.emit("notification", {
      channel: "midday_realtime",
      payload: JSON.stringify(payload),
    });
  }
}
describe("realtime protocol", () => {
  test("chunk boundaries, CRLF, heartbeats and multiline frames", () => {
    const received: string[][] = [];
    const parser = new SSEParser((name, data) => received.push([name, data]));
    for (const char of ': heartbeat\r\n\r\nevent: change\r\ndata: {"a":1,\r\ndata: "b":2}\r\n\r\ndata: ordinary\n\n')
      parser.feed(char);
    expect(received).toEqual([
      ["change", '{"a":1,\n"b":2}'],
      ["message", "ordinary"],
    ]);
    expect(() => parser.feed(`data: ${"a".repeat(65_536)}`)).toThrow();
  });
  test("exact filter routing and malformed payload rejection", () => {
    expect(parseRealtimeEvent(JSON.stringify(event))).toEqual(event);
    expect(parseRealtimeEvent("null")).toBeNull();
    expect(matchesSubscription(event, subscription)).toBe(true);
    expect(
      matchesSubscription(event, {
        ...subscription,
        filter: "id=eq.doc.with.dots",
      }),
    ).toBe(true);
    for (const filter of [
      "team_id=eq.team-b",
      "id=eq.doc",
      "team_id=neq.team-b",
      "team_id=eq.team-a&user_id=eq.user-b",
    ])
      expect(matchesSubscription(event, { ...subscription, filter })).toBe(
        false,
      );
    expect(
      parseNotification(
        JSON.stringify({ ...notification, new: { body: "secret document" } }),
      ),
    ).toBeNull();
    expect(
      parseNotification(
        JSON.stringify({ ...notification, table: "activities" }),
      ),
    ).toBeNull();
    expect(
      canReceive(notification, { teamId: "team-b", userId: "user-a" }),
    ).toBe(false);
  });
  test("shared stream, split UTF8, callback isolation and final cleanup", async () => {
    const mocked = mockFetch();
    const received: RealtimeEvent[] = [];
    const errors: unknown[] = [];
    const client = new RealtimeClient({
      url: "http://localhost/realtime/stream",
      fetch: mocked.fetch,
      getToken: async () => "token",
      retryMs: 5,
      onError: (error) => errors.push(error),
    });
    const stopBad = client.subscribe({
      ...subscription,
      onEvent: async () => {
        throw new Error("callback");
      },
    });
    const stopGood = client.subscribe({
      ...subscription,
      onEvent: (event) => received.push(event),
    });
    await waitFor(() => mocked.calls.length === 1);
    const unicode = { ...event, new: { ...event.new, status: "terminé" } };
    for (const byte of new TextEncoder().encode(
      `event: change\ndata: ${JSON.stringify(unicode)}\n\n`,
    ))
      mocked.calls[0]!.stream.enqueue(new Uint8Array([byte]));
    await waitFor(() => received.length === 1 && errors.length === 1);
    expect(received[0]).toEqual(unicode);
    stopBad();
    expect(mocked.calls[0]!.init.signal?.aborted).toBe(false);
    stopGood();
    expect(mocked.calls[0]!.init.signal?.aborted).toBe(true);
  });
  test("fresh-token reconnect, StrictMode replacement and auth restart", async () => {
    const mocked = mockFetch();
    let tokens = 0;
    const client = new RealtimeClient({
      url: "http://localhost/realtime/stream",
      fetch: mocked.fetch,
      getToken: async () => `token-${++tokens}`,
      retryMs: 5,
    });
    client.subscribe({ ...subscription })();
    const stop = client.subscribe({ ...subscription });
    await waitFor(() => mocked.calls.length === 1);
    expect(mocked.calls[0]!.init.headers).toMatchObject({
      Authorization: "Bearer token-2",
    });
    mocked.calls[0]!.stream.close();
    await waitFor(() => mocked.calls.length === 2);
    expect(mocked.calls[1]!.init.headers).toMatchObject({
      Authorization: "Bearer token-3",
    });
    client.reconnect();
    await waitFor(() => mocked.calls.length === 3);
    expect(mocked.calls[1]!.init.signal?.aborted).toBe(true);
    stop();
  });
  test("one listener filters identities, reconnects once for error+end and retries connection failures", async () => {
    const clients: FakePg[] = [];
    const received: unknown[] = [];
    const listener = new RealtimeListener({
      createClient: () => {
        const client = new FakePg(clients.length < 1);
        clients.push(client);
        return client;
      },
      retryMs: 5,
    });
    const stop = listener.subscribe(
      { teamId: "team-a", userId: "user-a" },
      (event) => received.push(event),
    );
    await waitFor(() => listener.connected);
    expect(clients).toHaveLength(2);
    clients[1]!.notify(notification);
    clients[1]!.notify({ ...notification, team_id: "team-b" });
    clients[1]!.notify({
      ...notification,
      table: "activities",
      user_id: "user-b",
    });
    clients[1]!.notify({
      ...notification,
      table: "activities",
      user_id: "user-a",
    });
    expect(received).toHaveLength(2);
    clients[1]!.emit("error", new Error("terminated"));
    clients[1]!.emit("end");
    await waitFor(() => clients.length === 3 && listener.connected);
    clients[2]!.notify(notification);
    expect(received).toHaveLength(3);
    stop();
    expect(clients[2]!.ended).toBe(1);
    await listener.close();
  });
});
