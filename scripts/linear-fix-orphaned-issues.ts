/**
 * Linear Fix Orphaned Issues Script
 * Assigns unassigned issues to their correct projects
 *
 * Usage: LINEAR_API_KEY=lin_api_xxx bun scripts/linear-fix-orphaned-issues.ts
 */

const LINEAR_API_URL = "https://api.linear.app/graphql";

const API_KEY = process.env.LINEAR_API_KEY;
if (!API_KEY) {
  console.error("ERROR: LINEAR_API_KEY environment variable required");
  process.exit(1);
}

async function linearQuery(query: string, variables?: Record<string, unknown>) {
  const response = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: API_KEY!,
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();
  if (result.errors) {
    console.error("GraphQL Error:", JSON.stringify(result.errors, null, 2));
    throw new Error(result.errors[0].message);
  }
  return result.data;
}

// Milestone to project mapping (based on week numbers from ROADMAP.md)
const MILESTONE_TO_PROJECT: Record<string, string> = {
  "Week 4: Pilot Go-Live": "Phase 1: Data Foundation",      // End of weeks 1-4
  "Week 8: First Referral": "Phase 2: Admin Experience",    // End of weeks 5-8
  "Week 12: Collections Live": "Phase 3: Collections",      // End of weeks 9-12
  "Week 14: Letters Live": "Phase 4: Letters",              // End of weeks 13-14
  "Week 16: Tech Debt Clean": "Phase 5: Access Control",    // End of weeks 15-16
  "Week 18: Alerts Live": "Phase 6: Alerts",                // End of weeks 17-18
  "Week 20: Public Launch": "Phase 7: Launch",              // End of weeks 19-20
};

async function main() {
  console.log("🔧 Fixing orphaned issues in Linear...\n");

  // Step 1: Get team, projects, and issues without projects
  console.log("📋 Step 1: Finding orphaned issues...");

  const data = await linearQuery(`
    query {
      teams {
        nodes {
          id
          name
          projects {
            nodes {
              id
              name
            }
          }
          issues(filter: { project: { null: true } }) {
            nodes {
              id
              identifier
              title
            }
          }
        }
      }
    }
  `);

  const team = data.teams.nodes.find((t: { name: string }) => t.name === "Abacus");
  if (!team) {
    throw new Error("Abacus team not found");
  }

  const orphanedIssues = team.issues.nodes;
  console.log(`   Found ${orphanedIssues.length} issues without a project`);

  if (orphanedIssues.length === 0) {
    console.log("\n✅ No orphaned issues to fix!");
    return;
  }

  // Create project name to ID map
  const projectMap = new Map<string, string>();
  for (const project of team.projects.nodes) {
    projectMap.set(project.name, project.id);
  }

  // Step 2: Assign issues to projects
  console.log("\n🔧 Step 2: Assigning issues to projects...");

  let fixed = 0;
  let skipped = 0;

  for (const issue of orphanedIssues) {
    // Check if it's a milestone (starts with 🎯)
    if (issue.title.startsWith("🎯")) {
      const milestoneName = issue.title.replace("🎯 ", "");
      const projectName = MILESTONE_TO_PROJECT[milestoneName];

      if (projectName && projectMap.has(projectName)) {
        await linearQuery(`
          mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
            issueUpdate(id: $id, input: $input) {
              success
            }
          }
        `, {
          id: issue.id,
          input: {
            projectId: projectMap.get(projectName),
          },
        });
        console.log(`   ✅ ${issue.identifier}: "${issue.title}" → ${projectName}`);
        fixed++;
      } else {
        console.log(`   ⚠️  ${issue.identifier}: No mapping for "${milestoneName}"`);
        skipped++;
      }
    } else {
      // For non-milestone issues, try to match by content
      let assigned = false;

      // Check for feedback widget issues
      if (issue.title.toLowerCase().includes("feedback widget")) {
        const supportProject = projectMap.get("Support & Feedback");
        if (supportProject) {
          await linearQuery(`
            mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
              issueUpdate(id: $id, input: $input) {
                success
              }
            }
          `, {
            id: issue.id,
            input: {
              projectId: supportProject,
            },
          });
          console.log(`   ✅ ${issue.identifier}: "${issue.title}" → Support & Feedback`);
          fixed++;
          assigned = true;
        }
      }

      if (!assigned) {
        console.log(`   ⏭️  ${issue.identifier}: "${issue.title}" - no mapping found`);
        skipped++;
      }
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("🎉 Fix complete!");
  console.log("=".repeat(50));
  console.log(`   Fixed: ${fixed} issues`);
  console.log(`   Skipped: ${skipped} issues`);
}

main().catch(console.error);
