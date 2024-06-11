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

  const isHealthy = Object.values(data).every((service) => service.healthy);

  return c.json(data, isHealthy ? 200 : 400);
});

export default app;
