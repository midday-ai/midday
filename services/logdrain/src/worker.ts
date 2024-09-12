import { Axiom } from "@axiomhq/js";
import { logSchema, type LogSchema } from "@internal/logs";
import { decompressSync, strFromU8 } from "fflate";
import { Hono } from "hono";
import { z } from "zod";

const logsSchema = z.array(
  z
    .object({
      TimestampMs: z.number(),
      Level: z.string(),
      Message: z.array(
        z.string().transform((s) => {
          try {
            return JSON.parse(s);
          } catch (err) {
            console.error((err as Error).message, s);

            return s;
          }
        }),
      ),
    })
    .passthrough(),
);

const fetchSchema = z.object({
  Event: z
    .object({
      RayID: z.string(),
      Request: z.object({
        Method: z.string(),
        URL: z.string(),
      }),
      Response: z.object({
        Status: z.number(),
      }),
    })
    .passthrough(),
  EventTimestampMs: z.number(),
  EventType: z.literal("fetch"),
  Exceptions: z.array(z.object({}).passthrough()),
  Logs: logsSchema,
  Outcome: z.string(),
  ScriptName: z.string(),
  ScriptTags: z.array(z.object({}).passthrough()),
});

const alarmSchema = z.object({
  Event: z.object({
    ScheduledTimeMs: z.number(),
  }),
  EventTimestampMs: z.number(),
  EventType: z.literal("alarm"),
  Exceptions: z.array(z.object({}).passthrough()),
  Logs: logsSchema,
  Outcome: z.string(),
  ScriptName: z.string(),
  ScriptTags: z.array(z.object({}).passthrough()),
});

const eventSchema = z.discriminatedUnion("EventType", [
  fetchSchema,
  alarmSchema,
]);

const app = new Hono<{
  Bindings: {
    AXIOM_TOKEN: string;
    AUTHORIZATION: string;
    AXIOM_ORG_ID: string;
  };
}>({});
app.all("*", async (c) => {
  console.info("incoming", c.req.url);
  const authorization = c.req.header("Authorization");
  if (!authorization || authorization !== c.env.AUTHORIZATION) {
    return c.text("unauthorized", { status: 403 });
  }

  const axiom = new Axiom({
    token: c.env.AXIOM_TOKEN,
    orgId: c.env.AXIOM_ORG_ID,
  });
  try {
    const b = await c.req.blob();

    const buf = await b.arrayBuffer();

    const dec = decompressSync(new Uint8Array(buf));
    const str = strFromU8(dec);
    const rawLines = str.split("\n").filter((l) => l.trim().length > 0);

    const lines = rawLines
      .map((l) => {
        try {
          return eventSchema.parse(JSON.parse(l));
        } catch (err) {
          console.error((err as Error).message, JSON.stringify(lines));
          return null;
        }
      })
      .filter((l) => l !== null) as Array<z.infer<typeof eventSchema>>;

    const now = Date.now();
    axiom.ingest(
      "logdrain-lag",
      lines.map((l) => ({
        eventTime: l.EventTimestampMs,
        logdrainTime: now,
        latency: now - l.EventTimestampMs,
      })),
    );

    for (const line of lines) {
      for (const log of line.Logs) {
        for (const raw of log.Message) {
          if (typeof raw === "string") {
            axiom.ingest("logdrain", {
              level: "warn",
              message: "log is not JSON",
              raw,
            });
            continue;
          }
          const logParsed = logSchema.safeParse(raw);
          if (!logParsed.success) {
            axiom.ingest("logdrain", {
              level: "error",
              message: logParsed.error.message,
              raw: JSON.stringify(raw),
              log: JSON.stringify(log),
              line: JSON.stringify(line),
            });
            continue;
          }
          const message = logParsed.data;

          switch (message.type) {
            case "log": {
              axiom.ingest("logs", {
                rayId: "RayID" in line.Event ? line.Event.RayID : null,
                requestId: message.requestId,
                environment: message.environment,
                application: message.application,
                time: message.time,
                _time: message.time,
                level: log.Level,
                message: message.message,
                context: message.context,
              });
              break;
            }
            case "metric": {
              axiom.ingest("metrics", {
                ...message.metric,
                requestId: message.requestId,
                environment: message.environment,
                application: message.application,
                time: message.time,
                _time: message.time,
              });
              break;
            }

            default:
              break;
          }
        }
      }
    }

    await axiom.flush();
    return c.json({ url: c.req.url });
  } catch (e) {
    const err = e as Error;
    console.error(err.message, JSON.stringify(err));

    axiom.ingest("logdrain", {
      level: "error",
      message: err.message,
    });
    await axiom.flush();
    return new Response(err.message, { status: 500 });
  }
});

export default app;
