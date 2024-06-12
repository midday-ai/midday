import { Hono } from "hono";

const app = new Hono();

app.get("/search", (c) => c.json("list institutions"));

export default app;
