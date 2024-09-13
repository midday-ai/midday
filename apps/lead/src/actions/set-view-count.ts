"use server";

import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function setViewCount(path: string) {
  return redis.incr(`views-${path}`);
}
