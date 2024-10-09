import { cors } from "@/middleware/index";
import { init } from "@/middleware/init";
import { metrics } from "@/middleware/metrics";
import { newApp } from "./hono/app";

const app = newApp();

app.use("*", init());
app.use("*", cors());;
app.use("*", metrics());

export default app;
