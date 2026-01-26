/**
 * Linear Add Initiatives Script
 * Adds initiatives and links existing projects to them
 *
 * Usage: LINEAR_API_KEY=lin_api_xxx bun scripts/linear-add-initiatives.ts
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

// ============================================================================
// INITIATIVES DEFINITION
// ============================================================================

const INITIATIVES = [
  {
    name: "🚀 MVP Launch",
    description: "Core product to get first paying customers. Phases 0-4: Auth, data sync, admin dashboard, collections, letters.",
    color: "#8b5cf6",
    projects: [
      "Phase 0: Foundation",
      "Phase 1: Data Foundation",
      "Phase 2: Admin Experience",
      "Phase 3: Collections",
      "Phase 4: Letters",
    ],
  },
  {
    name: "⚡ Scale & Polish",
    description: "Technical debt cleanup, alerts, and launch preparation. Phases 5-7.",
    color: "#f97316",
    projects: [
      "Phase 5: Access Control",
      "Phase 6: Alerts",
      "Phase 7: Launch",
    ],
  },
  {
    name: "📈 Growth & Operations",
    description: "Post-launch features, customer support, and ongoing operations.",
    color: "#22c55e",
    projects: [
      "Support & Feedback",
      "Future: Post-Launch",
    ],
  },
];

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("🚀 Adding Linear initiatives...\n");

  // Step 1: Get team and existing projects
  console.log("📋 Step 1: Finding team and projects...");
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
        }
      }
      initiatives {
        nodes {
          id
          name
        }
      }
    }
  `);

  const team = data.teams.nodes.find((t: { name: string }) => t.name === "Abacus");
  if (!team) {
    throw new Error("Abacus team not found");
  }
  console.log(`   ✅ Found team: ${team.name}`);

  // Create a map of project names to IDs
  const projectMap = new Map<string, string>();
  for (const project of team.projects.nodes) {
    projectMap.set(project.name, project.id);
  }
  console.log(`   ✅ Found ${projectMap.size} projects`);

  // Check existing initiatives
  const existingInitiatives = new Set(
    data.initiatives.nodes.map((i: { name: string }) => i.name)
  );

  // Step 2: Create initiatives
  console.log("\n🎯 Step 2: Creating initiatives...");

  for (const initiative of INITIATIVES) {
    if (existingInitiatives.has(initiative.name)) {
      console.log(`   ⏭️  Initiative exists: ${initiative.name}`);
      continue;
    }

    // Get project IDs for this initiative
    const projectIds = initiative.projects
      .map((name) => projectMap.get(name))
      .filter(Boolean);

    if (projectIds.length === 0) {
      console.log(`   ⚠️  No projects found for: ${initiative.name}`);
      continue;
    }

    // Create the initiative
    const result = await linearQuery(`
      mutation CreateInitiative($input: InitiativeCreateInput!) {
        initiativeCreate(input: $input) {
          success
          initiative {
            id
            name
          }
        }
      }
    `, {
      input: {
        name: initiative.name,
        description: initiative.description,
        color: initiative.color,
      },
    });

    const initiativeId = result.initiativeCreate.initiative.id;
    console.log(`   ✅ Created initiative: ${initiative.name}`);

    // Link projects to initiative using initiativeToProjectCreate
    for (const projectId of projectIds) {
      try {
        await linearQuery(`
          mutation LinkProjectToInitiative($initiativeId: String!, $projectId: String!) {
            initiativeToProjectCreate(initiativeId: $initiativeId, projectId: $projectId) {
              success
            }
          }
        `, {
          initiativeId,
          projectId,
        });
      } catch (e) {
        // Ignore if already linked
      }
    }
    console.log(`      └── Linked ${projectIds.length} projects`);
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("🎉 Initiatives setup complete!");
  console.log("=".repeat(50));
  console.log(`   Created: ${INITIATIVES.length} initiatives`);
  console.log("\n📊 Initiative Structure:");
  for (const initiative of INITIATIVES) {
    console.log(`   ${initiative.name}`);
    for (const project of initiative.projects) {
      console.log(`      └── ${project}`);
    }
  }
  console.log("\n🔗 Open Linear to see your initiatives!");
}

main().catch(console.error);
