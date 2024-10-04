export class ServiceDurableObject implements DurableObject {
  private count: number = 0;
  private lastReset: number = 0;
  private readonly STORAGE_KEYS = {
    COUNT: "count",
    LAST_RESET: "lastReset",
  };

  constructor(private readonly state: DurableObjectState) {
    void this.initializeState();
  }

  private async initializeState() {
    await this.state.blockConcurrencyWhile(async () => {
      const [count, lastReset] = await Promise.all([
        this.state.storage.get<number>(this.STORAGE_KEYS.COUNT),
        this.state.storage.get<number>(this.STORAGE_KEYS.LAST_RESET),
      ]);
      this.count = count ?? 0;
      this.lastReset = lastReset ?? Date.now();
    });
  }

  private async updateStorage() {
    await this.state.storage.put({
      [this.STORAGE_KEYS.COUNT]: this.count,
      [this.STORAGE_KEYS.LAST_RESET]: this.lastReset,
    });
  }

  async increment(by = 1) {
    this.count += by;
    await this.updateStorage();
    return this.count;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    switch (path) {
      case "/increment":
        const by = parseInt(url.searchParams.get("by") ?? "1", 10);
        const newCount = await this.increment(by);
        return new Response(JSON.stringify({ count: newCount }), {
          headers: { "Content-Type": "application/json" },
        });

      case "/reset":
        await this.reset();
        return new Response(
          JSON.stringify({ count: this.count, lastReset: this.lastReset }),
          {
            headers: { "Content-Type": "application/json" },
          },
        );

      case "/schedule-reset":
        const afterMillis = parseInt(
          url.searchParams.get("after") ?? "3600000",
          10,
        );
        await this.scheduleReset(afterMillis);
        return new Response(JSON.stringify({ message: "Reset scheduled" }), {
          headers: { "Content-Type": "application/json" },
        });

      default:
        return new Response(
          JSON.stringify({ count: this.count, lastReset: this.lastReset }),
          {
            headers: { "Content-Type": "application/json" },
          },
        );
    }
  }

  async alarm() {
    await this.reset();
  }

  private async reset() {
    this.count = 0;
    this.lastReset = Date.now();
    await this.updateStorage();
  }

  async scheduleReset(afterMillis: number) {
    await this.state.storage.setAlarm(Date.now() + afterMillis);
  }
}
