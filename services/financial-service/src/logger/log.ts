import { metricSchema } from "@/metric/metric-schema";
import { z } from "zod";
import { Metrics } from '../metric/interface';

export const logContext = z.object({
    requestId: z.string(),
});

const commonFields = z.object({
    environment: z.enum([
        "test",
        "development",
        "preview",
        "canary",
        "production",
        "unknown",
    ]),
    application: z.enum(["api", "semantic-cache", "agent", "logdrain", "vault"]),
});

export const logSchema = z.discriminatedUnion("type", [
    commonFields.merge(
        z.object({
            type: z.literal("log"),
            level: z.enum(["debug", "info", "warn", "error", "fatal"]),
            requestId: z.string(),
            time: z.number(),
            message: z.string(),
            context: z.record(z.any()),
        }),
    ),
    commonFields.merge(
        z.object({
            type: z.literal("metric"),
            requestId: z.string(),
            time: z.number(),
            metric: metricSchema,
        }),
    ),
]);
export type LogSchema = z.infer<typeof logSchema>;
export class Log<TLog extends LogSchema = LogSchema> {
    public readonly log: TLog;

    constructor(log: TLog) {
        this.log = log;
    }

    public toString(): string {
        return JSON.stringify(this.log);
    }
}