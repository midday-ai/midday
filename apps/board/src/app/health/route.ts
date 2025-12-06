import { checkHealth } from "@/lib/health";
import { NextResponse } from "next/server";

/**
 * Health check endpoint
 * Checks Redis connection and queue connectivity
 * Returns 200 if healthy, 503 if degraded/error
 */
export async function GET() {
  try {
    const health = await checkHealth();

    // Return appropriate status code based on health
    const statusCode =
      health.status === "ok" ? 200 : health.status === "degraded" ? 503 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    // If health check itself fails, return error status
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 503 },
    );
  }
}
