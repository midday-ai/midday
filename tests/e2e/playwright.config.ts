import { defineConfig, devices } from "@playwright/test";
import { dashboardUrl, repositoryRoot } from "./environment";

export default defineConfig({
  testDir: ".",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 12 * 60_000,
  expect: { timeout: 60_000 },
  forbidOnly: !!process.env.CI,
  outputDir: "../../test-results/e2e",
  reporter: [
    ["list", { printSteps: true }],
    [
      "html",
      { outputFolder: `${repositoryRoot}/playwright-report`, open: "never" },
    ],
  ],
  use: {
    baseURL: dashboardUrl,
    channel: process.env.E2E_BROWSER_CHANNEL || undefined,
    ...devices["Desktop Chrome"],
    viewport: { width: 1280, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    actionTimeout: 60_000,
    navigationTimeout: 120_000,
    launchOptions: { args: ["--disable-dev-shm-usage"] },
  },
  webServer: {
    command: "bun tests/e2e/serve.ts",
    cwd: repositoryRoot,
    url: `${dashboardUrl}/login`,
    timeout: 300_000,
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
    gracefulShutdown: { signal: "SIGTERM", timeout: 15_000 },
  },
});
