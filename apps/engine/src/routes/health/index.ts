import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));

export default app;
