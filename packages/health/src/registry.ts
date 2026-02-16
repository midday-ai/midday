/**
 * Dependency registry — defines all external services, their tier, and how to probe them.
 *
 * Tiers:
 *   1 = Core      — app breaks without it (DB, Redis, Supabase)
 *   2 = Important  — feature degrades (Stripe, Resend, OpenAI)
 *   3 = Integration — individual feature affected (Slack, Xero, etc.)
 *   4 = Optional   — silently degrades (ElevenLabs, analytics, etc.)
 */

export interface Dependency {
  /** Unique name for this dependency */
  name: string;
  /** Criticality tier (1 = core, 4 = optional) */
  tier: 1 | 2 | 3 | 4;
  /** Probe function — returns true if healthy */
  probe: () => Promise<boolean>;
  /** How long to cache the probe result (ms) */
  cacheTtlMs: number;
  /** Max time for the probe before it's considered failed (ms) */
  timeoutMs: number;
}

export interface DependencyResult {
  name: string;
  tier: 1 | 2 | 3 | 4;
  healthy: boolean;
  latencyMs: number;
  lastChecked: string;
  error?: string;
}
