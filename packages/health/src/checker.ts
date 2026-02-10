/**
 * Health check runner with caching and timeouts.
 *
 * - Runs probes with per-probe timeouts so one slow dependency can't block the rest.
 * - Caches results in memory to avoid hitting external services on every request.
 * - Returns structured results with per-dependency status, latency, and errors.
 */

import type { Dependency, DependencyResult } from "./registry";

/** In-memory cache for probe results */
const resultCache = new Map<
  string,
  { result: DependencyResult; expiresAt: number }
>();

/**
 * Run a single probe with a timeout.
 * Returns a DependencyResult with latency and error info.
 */
async function runProbe(dep: Dependency): Promise<DependencyResult> {
  const start = performance.now();

  try {
    const result = await Promise.race([
      dep.probe(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Probe timed out after ${dep.timeoutMs}ms`)),
          dep.timeoutMs,
        ),
      ),
    ]);

    return {
      name: dep.name,
      tier: dep.tier,
      healthy: result,
      latencyMs: Math.round(performance.now() - start),
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: dep.name,
      tier: dep.tier,
      healthy: false,
      latencyMs: Math.round(performance.now() - start),
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check a single dependency, using cached result if still valid.
 */
async function checkDependency(dep: Dependency): Promise<DependencyResult> {
  const cached = resultCache.get(dep.name);

  if (cached && Date.now() < cached.expiresAt) {
    return cached.result;
  }

  const result = await runProbe(dep);

  resultCache.set(dep.name, {
    result,
    expiresAt: Date.now() + dep.cacheTtlMs,
  });

  return result;
}

/**
 * Check multiple dependencies in parallel.
 * Only checks dependencies up to the specified max tier.
 */
export async function checkDependencies(
  deps: Dependency[],
  maxTier?: number,
): Promise<DependencyResult[]> {
  const filtered = maxTier ? deps.filter((d) => d.tier <= maxTier) : deps;
  return Promise.all(filtered.map(checkDependency));
}

/**
 * Build the readiness response for /health/ready.
 * Only tier-1 (core) failures make the service "unhealthy" (503).
 */
export function buildReadinessResponse(results: DependencyResult[]) {
  const healthy = results.filter((r) => r.tier === 1).every((r) => r.healthy);

  return {
    status: healthy ? ("ok" as const) : ("degraded" as const),
    checks: Object.fromEntries(
      results.map((r) => [
        r.name,
        {
          status: r.healthy ? "ok" : "error",
          latencyMs: r.latencyMs,
          ...(r.error && { error: r.error }),
        },
      ]),
    ),
  };
}

/**
 * Build the full dependencies response for /health/dependencies.
 *
 * - Tier 1 failure → "unhealthy" (app is broken)
 * - Tier 2 failure → "degraded" (important features affected)
 * - Tier 3/4 failure → "ok" (individual features affected, not system-level)
 */
export function buildDependenciesResponse(results: DependencyResult[]) {
  const tier1Healthy = results
    .filter((r) => r.tier === 1)
    .every((r) => r.healthy);

  const tier2Healthy = results
    .filter((r) => r.tier === 2)
    .every((r) => r.healthy);

  const status = !tier1Healthy
    ? ("unhealthy" as const)
    : !tier2Healthy
      ? ("degraded" as const)
      : ("ok" as const);

  return {
    status,
    timestamp: new Date().toISOString(),
    dependencies: results.map((r) => ({
      name: r.name,
      tier: r.tier,
      healthy: r.healthy,
      latencyMs: r.latencyMs,
      lastChecked: r.lastChecked,
      ...(r.error && { error: r.error }),
    })),
  };
}

/** Clear the in-memory cache (useful for testing). */
export function clearCache() {
  resultCache.clear();
}
