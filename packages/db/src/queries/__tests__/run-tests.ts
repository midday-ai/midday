#!/usr/bin/env bun

/**
 * Test Runner for Matching Algorithm
 *
 * This script provides a convenient way to run different types of tests
 * and generate reports about algorithm performance.
 */

import { writeFile } from "node:fs/promises";
import { spawn } from "bun";

interface TestResult {
  type: string;
  passed: number;
  failed: number;
  duration: number;
  details: string[];
}

interface TestReport {
  timestamp: string;
  overallStatus: "PASS" | "FAIL";
  results: TestResult[];
  summary: {
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    totalDuration: number;
  };
}

async function runTestSuite(
  name: string,
  pattern: string,
): Promise<TestResult> {
  console.log(`\n🧪 Running ${name}...`);

  const startTime = performance.now();

  try {
    const result = await spawn({
      cmd: ["bun", "test", pattern],
      cwd: process.cwd(),
      stdout: "pipe",
      stderr: "pipe",
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    const stdout = await new Response(result.stdout).text();
    const stderr = await new Response(result.stderr).text();
    const output = stdout + stderr;

    const passed = (output.match(/✓/g) || []).length;
    const failed = (output.match(/✗/g) || []).length;

    console.log(
      `${name}: ${passed} passed, ${failed} failed (${duration.toFixed(0)}ms)`,
    );

    return {
      type: name,
      passed,
      failed,
      duration,
      details: output
        .split("\n")
        .filter((line: string) => line.includes("✓") || line.includes("✗")),
    };
  } catch (error) {
    console.error(`❌ ${name} failed:`, error);
    return {
      type: name,
      passed: 0,
      failed: 1,
      duration: performance.now() - startTime,
      details: [`Error: ${error}`],
    };
  }
}

async function main() {
  console.log("🚀 Starting Matching Algorithm Test Suite");
  console.log("==========================================");

  const testSuites = [
    {
      name: "Unit Tests",
      pattern: "src/queries/__tests__/transaction-matching.test.ts",
    },
    {
      name: "Golden Dataset Regression",
      pattern: "src/queries/__tests__/golden-regression.test.ts",
    },
    { name: "Integration Tests", pattern: "src/queries/__tests__/*.test.ts" },
  ];

  const results: TestResult[] = [];

  for (const suite of testSuites) {
    const result = await runTestSuite(suite.name, suite.pattern);
    results.push(result);
  }

  // Generate summary
  const summary = results.reduce(
    (acc, result) => ({
      totalTests: acc.totalTests + result.passed + result.failed,
      totalPassed: acc.totalPassed + result.passed,
      totalFailed: acc.totalFailed + result.failed,
      totalDuration: acc.totalDuration + result.duration,
    }),
    { totalTests: 0, totalPassed: 0, totalFailed: 0, totalDuration: 0 },
  );

  const overallStatus = summary.totalFailed === 0 ? "PASS" : "FAIL";

  const report: TestReport = {
    timestamp: new Date().toISOString(),
    overallStatus,
    results,
    summary,
  };

  // Print summary
  console.log("\n📊 Test Summary");
  console.log("===============");
  console.log(
    `Overall Status: ${overallStatus === "PASS" ? "✅ PASS" : "❌ FAIL"}`,
  );
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`Passed: ${summary.totalPassed}`);
  console.log(`Failed: ${summary.totalFailed}`);
  console.log(`Duration: ${summary.totalDuration.toFixed(0)}ms`);

  // Save detailed report
  const reportPath = `test-report-${Date.now()}.json`;
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📝 Detailed report saved to: ${reportPath}`);

  // Exit with appropriate code
  process.exit(summary.totalFailed === 0 ? 0 : 1);
}

// Handle CLI arguments
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Usage: bun run test-runner.ts [options]

Options:
  --help, -h     Show this help message
  --watch, -w    Run tests in watch mode
  --golden       Run only golden dataset tests
  --unit         Run only unit tests
  --integration  Run only integration tests

Examples:
  bun run test-runner.ts                    # Run all tests
  bun run test-runner.ts --golden          # Run only golden dataset tests
  bun run test-runner.ts --unit            # Run only unit tests
  `);
  process.exit(0);
}

if (args.includes("--watch") || args.includes("-w")) {
  console.log("👀 Running tests in watch mode...");
  // Implementation for watch mode would go here
}

main().catch(console.error);
