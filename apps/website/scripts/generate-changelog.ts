#!/usr/bin/env bun

/**
 * Changelog Generator for Abacus
 *
 * Generates a monthly update post from GitHub PRs and commits.
 *
 * Usage:
 *   bun run apps/website/scripts/generate-changelog.ts
 *   bun run apps/website/scripts/generate-changelog.ts --month 2026-01
 *
 * Requirements:
 *   - GitHub CLI (gh) installed and authenticated
 *   - ANTHROPIC_API_KEY environment variable (optional, for AI summary)
 */

import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { join } from "path";

const REPO = "stweeedy/abacus"; // Update this to your repo

interface PR {
  number: number;
  title: string;
  body: string;
  mergedAt: string;
  labels: string[];
}

interface Commit {
  sha: string;
  message: string;
  date: string;
}

function getMonthRange(monthStr?: string): { start: string; end: string; monthName: string; year: number } {
  let year: number;
  let month: number;

  if (monthStr) {
    // Parse YYYY-MM format directly
    const [y, m] = monthStr.split("-").map(Number);
    year = y;
    month = m - 1; // JS months are 0-indexed
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth();
  }

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const monthName = start.toLocaleString("default", { month: "long" });

  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
    monthName,
    year,
  };
}

function getMergedPRs(start: string, end: string): PR[] {
  try {
    const result = execSync(
      `gh pr list --repo ${REPO} --state merged --search "merged:${start}..${end}" --json number,title,body,mergedAt,labels --limit 100`,
      { encoding: "utf-8" }
    );
    return JSON.parse(result);
  } catch (error) {
    console.log("Note: Could not fetch PRs (repo may not exist or no PRs found)");
    return [];
  }
}

function getCommits(start: string, end: string): Commit[] {
  try {
    const result = execSync(
      `gh api repos/${REPO}/commits --jq '.[] | {sha: .sha, message: .commit.message, date: .commit.author.date}' -q --paginate`,
      { encoding: "utf-8" }
    );

    const commits: Commit[] = [];
    const lines = result.trim().split("\n").filter(Boolean);

    for (const line of lines) {
      try {
        const commit = JSON.parse(line);
        const commitDate = commit.date.split("T")[0];
        if (commitDate >= start && commitDate <= end) {
          commits.push(commit);
        }
      } catch {
        // Skip malformed lines
      }
    }

    return commits;
  } catch (error) {
    // Fallback to git log if gh api fails
    try {
      const result = execSync(
        `git log --since="${start}" --until="${end}" --pretty=format:"%H|%s|%aI" main`,
        { encoding: "utf-8" }
      );

      return result
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const [sha, message, date] = line.split("|");
          return { sha, message, date };
        });
    } catch {
      console.log("Note: Could not fetch commits");
      return [];
    }
  }
}

function categorizeChanges(prs: PR[], commits: Commit[]): Map<string, string[]> {
  const categories = new Map<string, string[]>();

  // Initialize categories
  categories.set("Features", []);
  categories.set("Improvements", []);
  categories.set("Bug Fixes", []);
  categories.set("Other", []);

  // Categorize PRs
  for (const pr of prs) {
    const title = pr.title;
    const labels = pr.labels.map((l: any) => (typeof l === "string" ? l : l.name));

    let category = "Other";

    if (labels.includes("bug") || title.toLowerCase().includes("fix")) {
      category = "Bug Fixes";
    } else if (labels.includes("feature") || title.toLowerCase().includes("add") || title.toLowerCase().includes("new")) {
      category = "Features";
    } else if (labels.includes("enhancement") || title.toLowerCase().includes("improve") || title.toLowerCase().includes("update")) {
      category = "Improvements";
    }

    categories.get(category)!.push(`- ${title} (#${pr.number})`);
  }

  // If no PRs, use commits
  if (prs.length === 0) {
    for (const commit of commits) {
      const message = commit.message.split("\n")[0]; // First line only

      // Skip merge commits and trivial commits
      if (message.startsWith("Merge") || message.length < 10) continue;

      let category = "Other";

      if (message.toLowerCase().includes("fix")) {
        category = "Bug Fixes";
      } else if (message.toLowerCase().includes("add") || message.toLowerCase().includes("new")) {
        category = "Features";
      } else if (message.toLowerCase().includes("improve") || message.toLowerCase().includes("update")) {
        category = "Improvements";
      }

      categories.get(category)!.push(`- ${message}`);
    }
  }

  // Remove empty categories
  for (const [key, value] of categories) {
    if (value.length === 0) {
      categories.delete(key);
    }
  }

  return categories;
}

function generateMDX(categories: Map<string, string[]>, monthStr: string): string {
  const date = new Date(`${monthStr}-01`);
  const monthName = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();
  const title = `${monthName} ${year} Update`;
  const publishedAt = `${monthStr}-01`;

  // Generate summary from first few items
  const allItems = Array.from(categories.values()).flat().slice(0, 3);
  const summary = allItems.map((item) => item.replace(/^- /, "").replace(/ \(#\d+\)$/, "")).join(", ");

  let content = `---
title: "${title}"
publishedAt: "${publishedAt}"
summary: "${summary || "Monthly product updates and improvements."}"
tag: "Updates"
---

Here's what we shipped this month.

`;

  for (const [category, items] of categories) {
    content += `<br />\n\n#### ${category}\n`;
    content += items.join("\n");
    content += "\n";
  }

  return content;
}

function main() {
  const args = process.argv.slice(2);
  let monthStr: string | undefined;

  // Parse --month argument
  const monthIndex = args.indexOf("--month");
  if (monthIndex !== -1 && args[monthIndex + 1]) {
    monthStr = args[monthIndex + 1];
  }

  // Default to current month
  if (!monthStr) {
    const now = new Date();
    monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  console.log(`Generating changelog for ${monthStr}...`);

  const { start, end } = getMonthRange(monthStr);
  console.log(`Date range: ${start} to ${end}`);

  const prs = getMergedPRs(start, end);
  console.log(`Found ${prs.length} merged PRs`);

  const commits = getCommits(start, end);
  console.log(`Found ${commits.length} commits`);

  if (prs.length === 0 && commits.length === 0) {
    console.log("No changes found for this month. Creating placeholder post.");
  }

  const categories = categorizeChanges(prs, commits);
  const mdx = generateMDX(categories, monthStr);

  const filename = `${monthStr.toLowerCase()}-update.mdx`;

  // Determine correct output path based on current directory
  const cwd = process.cwd();
  const postsDir = cwd.includes("apps/website") || cwd.includes("apps\\website")
    ? join(cwd, "src/app/updates/posts")
    : join(cwd, "apps/website/src/app/updates/posts");

  const outputPath = join(postsDir, filename);

  writeFileSync(outputPath, mdx);
  console.log(`\nGenerated: ${outputPath}`);
  console.log("\nPreview:");
  console.log("─".repeat(50));
  console.log(mdx);
}

main();
