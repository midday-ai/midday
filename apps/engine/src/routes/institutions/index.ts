import { Hono } from "hono";
import { env } from "hono/adapter";

const app = new Hono();

app.get("/search", async (c) => {
  const envs = env(c);

  return c.json("list institutions");
});

export default app;
