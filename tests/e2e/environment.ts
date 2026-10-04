import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repositoryRoot = resolve(
  fileURLToPath(new URL("../..", import.meta.url)),
);
export const serverLogs = resolve(repositoryRoot, "test-results/e2e-servers");

export function requireLoopback(value: string, description: string): URL {
  const url = new URL(value);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new Error(`${description} must use a loopback host: ${url.hostname}`);
  }
  return url;
}

export const databaseUrl =
  process.env.E2E_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/midday_e2e";
const database = requireLoopback(databaseUrl, "E2E database");
export const databaseName = decodeURIComponent(database.pathname.slice(1));
if (!/^midday_e2e(?:_[a-z0-9_]+)?$/.test(databaseName)) {
  throw new Error(
    "E2E_DATABASE_URL must name midday_e2e or midday_e2e_<suffix>; shared databases are never reset or migrated.",
  );
}

export const dashboardUrl = requireLoopback(
  process.env.E2E_DASHBOARD_URL ?? "http://localhost:3001",
  "Dashboard",
).origin;
export const apiUrl = requireLoopback(
  process.env.E2E_API_URL ?? "http://localhost:3003",
  "API",
).origin;
export const redisUrl = requireLoopback(
  process.env.E2E_REDIS_URL ?? "redis://localhost:6379",
  "Redis",
).href;
export const storageEndpoint = requireLoopback(
  process.env.E2E_STORAGE_ENDPOINT ?? "http://localhost:9000",
  "Storage",
).origin;

/** Deliberately exclude app .env credentials; Bun/Next inherit explicit empty overrides. */
export function serverEnvironment(secrets: {
  auth: string;
  encryption: string;
  files: string;
}): Record<string, string> {
  const inherited: Record<string, string> = {};
  for (const name of [
    "PATH",
    "HOME",
    "TMPDIR",
    "TEMP",
    "SystemRoot",
    "LANG",
    "SHELL",
    "CI",
  ]) {
    if (process.env[name]) inherited[name] = process.env[name]!;
  }
  const dotenvBlanks: Record<string, string> = {};
  for (const directory of [
    repositoryRoot,
    resolve(repositoryRoot, "apps/api"),
    resolve(repositoryRoot, "apps/dashboard"),
  ]) {
    for (const filename of [
      ".env",
      ".env.local",
      ".env.development",
      ".env.development.local",
    ]) {
      const path = resolve(directory, filename);
      if (!existsSync(path)) continue;
      for (const match of readFileSync(path, "utf8").matchAll(
        /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/gm,
      ))
        dotenvBlanks[match[1]!] = "";
    }
  }
  return {
    ...dotenvBlanks,
    ...inherited,
    NODE_ENV: "development",
    NODE_OPTIONS: "--max-old-space-size=3072",
    RAYON_NUM_THREADS: "2",
    NEXT_BUILD_WORKERS: "1",
    NEXT_TELEMETRY_DISABLED: "1",
    NEXT_PUBLIC_BACKEND_PROVIDER: "local",
    DATABASE_PRIMARY_URL: databaseUrl,
    DATABASE_PRIMARY_POOLER_URL: databaseUrl,
    DATABASE_MIGRATION_URL: databaseUrl,
    DATABASE_LISTEN_URL: databaseUrl,
    DATABASE_FRA_URL: "",
    DATABASE_SJC_URL: "",
    DATABASE_IAD_URL: "",
    DATABASE_SSL: "disable",
    REDIS_URL: redisUrl,
    REDIS_QUEUE_URL: redisUrl,
    BETTER_AUTH_SECRET: secrets.auth,
    MIDDAY_ENCRYPTION_KEY: secrets.encryption,
    FILE_KEY_SECRET: secrets.files,
    BETTER_AUTH_URL: dashboardUrl,
    AUTH_JWKS_URL: `${dashboardUrl}/api/auth/jwks`,
    AUTH_JWT_ISSUER: dashboardUrl,
    AUTH_JWT_AUDIENCE: "midday-api",
    AUTH_TOTP_ISSUER: "Midday E2E",
    NEXT_PUBLIC_URL: dashboardUrl,
    NEXT_PUBLIC_API_URL: apiUrl,
    MIDDAY_DASHBOARD_URL: dashboardUrl,
    MIDDAY_API_URL: apiUrl,
    ALLOWED_API_ORIGINS: dashboardUrl,
    NEXT_PUBLIC_REALTIME_ENABLED: "true",
    NEXT_PUBLIC_STORAGE_PUBLIC_HOSTS: new URL(storageEndpoint).host,
    STORAGE_ENDPOINT: storageEndpoint,
    STORAGE_PUBLIC_ENDPOINT: storageEndpoint,
    STORAGE_REGION: "us-east-1",
    STORAGE_FORCE_PATH_STYLE: "true",
    STORAGE_ACCESS_KEY_ID: process.env.E2E_STORAGE_ACCESS_KEY_ID ?? "midday",
    STORAGE_SECRET_ACCESS_KEY:
      process.env.E2E_STORAGE_SECRET_ACCESS_KEY ?? "midday-secret",
    STORAGE_BUCKET_VAULT: "vault",
    STORAGE_BUCKET_AVATARS: "avatars",
    STORAGE_BUCKET_APPS: "apps",
    STORAGE_PUBLIC_URL_AVATARS: `${storageEndpoint}/avatars`,
    STORAGE_PUBLIC_URL_APPS: `${storageEndpoint}/apps`,
    NEW_USER_CUTOFF: "",
    RESEND_API_KEY: "",
    TRIGGER_SECRET_KEY: "",
    INTERNAL_API_KEY: "",
    SENTRY_AUTH_TOKEN: "",
    SENTRY_DSN: "",
    NEXT_PUBLIC_SENTRY_DSN: "",
    OPENAI_API_KEY: "",
    ANTHROPIC_API_KEY: "",
    GOOGLE_GENERATIVE_AI_API_KEY: "",
    STRIPE_SECRET_KEY: "",
    COMPOSIO_API_KEY: "",
    NEXT_PUBLIC_OPENPANEL_CLIENT_ID: "",
    OPENPANEL_SECRET_KEY: "",
    AUTH_GOOGLE_CLIENT_ID: "",
    AUTH_GOOGLE_CLIENT_SECRET: "",
    AUTH_GITHUB_CLIENT_ID: "",
    AUTH_GITHUB_CLIENT_SECRET: "",
    AUTH_APPLE_CLIENT_ID: "",
    AUTH_APPLE_CLIENT_SECRET: "",
    AUTH_MICROSOFT_CLIENT_ID: "",
    AUTH_MICROSOFT_CLIENT_SECRET: "",
    SUPABASE_URL: "",
    SUPABASE_SECRET_KEY: "",
    NEXT_PUBLIC_SUPABASE_URL: "",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
  };
}
