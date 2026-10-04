import { type ChildProcess, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createWriteStream, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "pg";
import {
  apiUrl,
  dashboardUrl,
  databaseName,
  databaseUrl,
  repositoryRoot,
  serverEnvironment,
  serverLogs,
} from "./environment";

mkdirSync(serverLogs, { recursive: true });
// Disposable loopback-only test keys must remain stable for the retained DB's
// encrypted JWKS across repeated runs. Never use these keys for an app deployment.
const testKey = (purpose: string) =>
  createHash("sha256")
    .update(`midday-e2e-only:${databaseName}:${purpose}`)
    .digest("hex");
const env = serverEnvironment({
  auth: testKey("auth"),
  encryption: testKey("encryption"),
  files: testKey("files"),
});
const children: ChildProcess[] = [];
let stopping = false;

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = exitCode;
  for (const child of children) {
    if (!child.pid || child.exitCode !== null || child.signalCode !== null)
      continue;
    try {
      if (process.platform === "win32") child.kill("SIGTERM");
      else process.kill(-child.pid, "SIGTERM");
    } catch {
      /* Child already exited. */
    }
  }
  setTimeout(() => process.exit(exitCode), 500).unref();
}
process.on("SIGTERM", () => stop());
process.on("SIGINT", () => stop());

function launch(
  name: string,
  args: string[],
  extraEnv: Record<string, string> = {},
) {
  const log = createWriteStream(resolve(serverLogs, `${name}.log`), {
    flags: "w",
  });
  const child = spawn("bun", args, {
    cwd: repositoryRoot,
    env: { ...env, ...extraEnv },
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
  });
  children.push(child);
  child.stdout?.pipe(log, { end: false });
  child.stderr?.pipe(log, { end: false });
  child.on("error", (error) => {
    console.error(`[e2e] ${name}:`, error);
    stop(1);
  });
  child.on("exit", (code) => {
    log.end();
    if (!stopping && name !== "migrate") {
      console.error(
        `[e2e] ${name} exited (${code}); see ${serverLogs}/${name}.log`,
      );
      stop(1);
    }
  });
  return child;
}

async function waitForHealth(url: string, child: ChildProcess) {
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || stopping)
      throw new Error(`Server exited before ${url} became ready`);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3_000) });
      if (response.ok) return;
    } catch {
      /* Server is still starting. */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${url}; inspect ${serverLogs}`);
}

try {
  // Create only the dedicated DB if missing. Existing E2E data is retained;
  // fixture names are unique. Never DROP, TRUNCATE, or reset shared infrastructure.
  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = "/postgres";
  const admin = new Client({ connectionString: adminUrl.href, ssl: false });
  await admin.connect();
  try {
    const { rowCount } = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [databaseName],
    );
    if (!rowCount) await admin.query(`CREATE DATABASE "${databaseName}"`);
  } finally {
    await admin.end();
  }
  const migration = launch("migrate", ["run", "packages/db/src/migrate.ts"]);
  const exitCode = await new Promise<number | null>((resolve) =>
    migration.once("exit", resolve),
  );
  if (exitCode !== 0)
    throw new Error(`E2E migration failed; inspect ${serverLogs}/migrate.log`);

  const api = launch("api", ["run", "--cwd", "apps/api", "src/index.ts"], {
    PORT: new URL(apiUrl).port || "3003",
  });
  await waitForHealth(`${apiUrl}/health`, api);
  launch("dashboard", [
    "run",
    "--cwd",
    "apps/dashboard",
    "next",
    "dev",
    "--turbopack",
    "--port",
    new URL(dashboardUrl).port || "3001",
  ]);
  console.info(
    `[e2e] Dedicated DB ${databaseName}; API ${apiUrl}; dashboard ${dashboardUrl}. Logs: ${serverLogs}`,
  );
} catch (error) {
  console.error(error);
  stop(1);
}
