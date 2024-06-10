import { Provider } from "@/providers";
import { Hono } from "hono";

const app = new Hono();

app.get("/", async (c) => {
  const api = new Provider();

  const data = await api.getHealthCheck({
    fetcher: c.env.TELLER_CERT,
  });

  c.json(data);
});

export default app;
