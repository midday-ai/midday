import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.json("list transactions"));

export default app;
