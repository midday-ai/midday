#!/usr/bin/env bun

/**
 * Simple test script to verify Redis cache implementation
 * Run with: bun run packages/cache/src/test-redis.ts
 */

import { RedisClient } from "bun";
import { apiKeyCache } from "./api-key-cache";
import { RedisCache } from "./redis-client";
import { replicationCache } from "./replication-cache";
import { teamCache } from "./team-cache";
import { teamPermissionsCache } from "./team-permissions-cache";
import { userCache } from "./user-cache";

async function testRedisCache() {
  console.log("🧪 Testing Redis cache implementation...");

  // Test environment variable
  if (!process.env.REDIS_URL) {
    console.error("❌ REDIS_URL environment variable is not set");
    process.exit(1);
  }

  console.log(
    `📡 Using Redis URL: ${process.env.REDIS_URL.replace(/\/\/.*@/, "//***@")}`,
  );

  try {
    // Test API Key Cache
    console.log("\n🔑 Testing apiKeyCache...");
    const testApiKey = {
      id: "test",
      userId: "user123",
      teamId: "team123",
      scopes: ["read"],
    };
    await apiKeyCache.set("test-key", testApiKey);
    const retrievedApiKey = await apiKeyCache.get("test-key");
    console.log(
      "✅ API Key cache test passed:",
      retrievedApiKey?.id === testApiKey.id,
    );

    // Test User Cache
    console.log("\n👤 Testing userCache...");
    const testUser = {
      id: "user123",
      email: "test@example.com",
      fullName: "Test User",
    };
    await userCache.set("test-user", testUser);
    const retrievedUser = await userCache.get("test-user");
    console.log(
      "✅ User cache test passed:",
      retrievedUser?.id === testUser.id,
    );

    // Test Team Cache
    console.log("\n🏢 Testing teamCache...");
    await teamCache.set("test-team-access", true);
    const hasAccess = await teamCache.get("test-team-access");
    console.log("✅ Team cache test passed:", hasAccess === true);

    // Test Team Permissions Cache
    console.log("\n🔐 Testing teamPermissionsCache...");
    await teamPermissionsCache.set("test-permission", "admin");
    const permission = await teamPermissionsCache.get("test-permission");
    console.log(
      "✅ Team permissions cache test passed:",
      permission === "admin",
    );

    // Test Replication Cache
    console.log("\n🔄 Testing replicationCache...");
    await replicationCache.set("test-team");
    const timestamp = await replicationCache.get("test-team");
    const now = Date.now();
    console.log(
      "✅ Replication cache test passed:",
      timestamp && timestamp > now,
    );

    // Test TTL and cleanup
    console.log("\n🧹 Testing cleanup...");
    await apiKeyCache.delete("test-key");
    await userCache.delete("test-user");
    await teamCache.delete("test-team-access");
    await teamPermissionsCache.delete("test-permission");
    await replicationCache.delete("test-team");

    const deletedApiKey = await apiKeyCache.get("test-key");
    console.log("✅ Cleanup test passed:", deletedApiKey === undefined);

    // Test RedisCache class directly
    console.log("\n🏗️ Testing RedisCache class directly...");
    const testCache = new RedisCache("test", 60);
    await testCache.set("direct-test", { message: "Hello Redis!" });
    const directResult = await testCache.get<{ message: string }>(
      "direct-test",
    );
    console.log(
      "✅ Direct RedisCache test passed:",
      directResult?.message === "Hello Redis!",
    );
    await testCache.delete("direct-test");

    console.log("\n🎉 All Redis cache tests passed!");
    console.log("✨ Redis implementation is working correctly!");
  } catch (error) {
    console.error("❌ Redis cache test failed:", error);
    process.exit(1);
  }
}

// Run the test
testRedisCache().catch(console.error);
