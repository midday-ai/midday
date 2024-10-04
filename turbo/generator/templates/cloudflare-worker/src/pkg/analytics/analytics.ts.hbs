import {
  auditLogSchemaV1,
  unkeyAuditLogEvents,
} from "../../pkg/analytics/auditlog";
import { newId } from "../../pkg/analytics/generate";
import { NoopTinybird, Tinybird } from "@chronark/zod-bird";
import { z } from "zod";
import { MaybeArray } from "../../pkg/types";
import { ratelimitSchemaV1 } from "./ratelimit-tinybird";
// const datetimeToUnixMilli = z.string().transform((t) => new Date(t).getTime());

/**
 * `t` has the format `2021-01-01 00:00:00`
 *
 * If we transform it as is, we get `1609459200000` which is `2021-01-01 01:00:00` due to fun timezone stuff.
 * So we split the string at the space and take the date part, and then parse that.
 */
const dateToUnixMilli = z
  .string()
  .transform((t) => new Date(t.split(" ").at(0) ?? t).getTime());

export class Analytics {
  public readonly readClient: Tinybird | NoopTinybird;
  public readonly writeClient: Tinybird | NoopTinybird;

  constructor(opts: {
    tinybirdToken?: string;
    tinybirdProxy?: {
      url: string;
      token: string;
    };
  }) {
    this.readClient = opts.tinybirdToken
      ? new Tinybird({ token: opts.tinybirdToken })
      : new NoopTinybird();

    this.writeClient = opts.tinybirdProxy
      ? new Tinybird({
          token: opts.tinybirdProxy.token,
          baseUrl: opts.tinybirdProxy.url,
        })
      : this.readClient;
  }

  public get ingestSdkTelemetry() {
    return this.writeClient.buildIngestEndpoint({
      datasource: "sdk_telemetry__v1",
      event: z.object({
        runtime: z.string(),
        platform: z.string(),
        versions: z.array(z.string()),
        requestId: z.string(),
        time: z.number(),
      }),
    });
  }

  public ingestUnkeyAuditLogs(logs: MaybeArray<UnkeyAuditLog>) {
    return this.writeClient.buildIngestEndpoint({
      datasource: "audit_logs__v2",
      event: auditLogSchemaV1
        .merge(
          z.object({
            event: unkeyAuditLogEvents,
            auditLogId: z.string().default(newId("auditLog")),
            bucket: z.string().default("unkey_mutations"),
            time: z.number().default(Date.now()),
          }),
        )
        .transform((l) => ({
          ...l,
          meta: l.meta ? JSON.stringify(l.meta) : undefined,
          actor: {
            ...l.actor,
            meta: l.actor.meta ? JSON.stringify(l.actor.meta) : undefined,
          },
          resources: JSON.stringify(l.resources),
        })),
    })(logs);
  }

  public get ingestGenericAuditLogs() {
    return this.writeClient.buildIngestEndpoint({
      datasource: "audit_logs__v2",
      event: auditLogSchemaV1.transform((l) => ({
        ...l,
        meta: l.meta ? JSON.stringify(l.meta) : undefined,
        actor: {
          ...l.actor,
          meta: l.actor.meta ? JSON.stringify(l.actor.meta) : undefined,
        },
        resources: JSON.stringify(l.resources),
      })),
    });
  }

  public get ingestRatelimit() {
    return this.writeClient.buildIngestEndpoint({
      datasource: "ratelimits__v2",
      event: ratelimitSchemaV1,
    });
  }

  public get ingestKeyVerification() {
    return this.writeClient.buildIngestEndpoint({
      datasource: "key_verifications__v2",
      event: z.object({
        workspaceId: z.string(),
        apiId: z.string(),
        keyId: z.string(),
        deniedReason: z
          .enum([
            "RATE_LIMITED",
            "USAGE_EXCEEDED",
            "FORBIDDEN",
            "UNAUTHORIZED",
            "DISABLED",
            "INSUFFICIENT_PERMISSIONS",
            "EXPIRED",
          ])
          .optional(),
        time: z.number(),
        ipAddress: z.string().default(""),
        userAgent: z.string().default(""),
        requestedResource: z.string().default(""),
        edgeRegion: z.string().default(""),
        region: z.string(),
        // deprecated, use deniedReason
        ratelimited: z.boolean().default(false),
        // deprecated, use deniedReason
        usageExceeded: z.boolean().default(false),
        ownerId: z.string().optional(),
        keySpaceId: z.string(),
      }),
    });
  }

  public get getVerificationsDaily() {
    return this.readClient.buildPipe({
      pipe: "get_verifications_daily__v1",
      parameters: z.object({
        workspaceId: z.string(),
        apiId: z.string(),
        keyId: z.string().optional(),
        start: z.number().optional(),
        end: z.number().optional(),
      }),
      data: z.object({
        time: dateToUnixMilli,
        success: z.number(),
        rateLimited: z.number(),
        usageExceeded: z.number(),
      }),
    });
  }
}

export type UnkeyAuditLog = {
  workspaceId: string;
  event: z.infer<typeof unkeyAuditLogEvents>;
  description: string;
  actor: {
    type: "user" | "key";
    name?: string;
    id: string;
  };
  resources: Array<{
    type:
      | "key"
      | "api"
      | "workspace"
      | "role"
      | "permission"
      | "keyAuth"
      | "vercelBinding"
      | "vercelIntegration"
      | "ratelimitIdentifier"
      | "ratelimitNamespace"
      | "identity"
      | "ratelimit";
    id: string;
    meta?: Record<string, string | number | boolean | null | undefined>;
  }>;
  context: {
    userAgent?: string;
    location: string;
  };
};
