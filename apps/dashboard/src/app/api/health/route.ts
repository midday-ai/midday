import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database?: { status: string; latency?: number };
    cache?: { status: string; latency?: number };
  };
}

export async function GET(): Promise<NextResponse<HealthStatus>> {
  const startTime = Date.now();

  const healthStatus: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    checks: {},
  };

  // Basic health check - just return healthy status
  // In production, you can add database and cache ping checks

  return NextResponse.json(healthStatus, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
