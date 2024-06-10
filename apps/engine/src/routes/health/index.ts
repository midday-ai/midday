import { Provider } from "@/providers";
import { Hono } from "hono";
import { env } from "hono/adapter";

const app = new Hono();

app.get("/", async (c) => {
  const envs = env(c);

  const api = new Provider();

  const data = await api.getHealthCheck({
    fetcher: c.env.TELLER_CERT,
    envs,
  });

  return c.json(data);
});

export default app;
