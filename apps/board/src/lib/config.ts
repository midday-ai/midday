import type { Queue } from "bullmq";
import type { RedisOptions } from "ioredis";

export interface AdminConfig {
  redis: RedisOptions;
  queues: Queue[] | string[];
  port?: number;
  auth?: {
    username: string;
    password: string;
  };
}

let adminConfig: AdminConfig | null = null;

export function setAdminConfig(config: AdminConfig) {
  adminConfig = config;
}

export function getAdminConfig(): AdminConfig {
  if (!adminConfig) {
    throw new Error("Admin config not set. Call setAdminConfig first.");
  }
  return adminConfig;
}

