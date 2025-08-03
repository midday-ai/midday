#!/usr/bin/env bun
import { createJobDb } from "@midday/db/job-client";

type EligibleTeam = {
  id: string;
  name: string | null;
  plan: "trial" | "starter" | "pro";
  createdAt: string;
  bankConnectionCount: number;
  bankAccountCount: number;
  bankingProviders: string[];
  eligibilityReason: "pro_starter_with_bank" | "trial_recent_with_bank";
};

async function getEligibleTeamIds() {
  const { db, disconnect } = createJobDb();

  try {
    // Calculate date 15 days ago
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 15);

    // Step 1: Get all teams with their bank connections and accounts in one query
    const allTeamsWithConnections = await db.query.teams.findMany({
      columns: {
        id: true,
        name: true,
        plan: true,
        createdAt: true,
      },
      with: {
        bankConnections: {
          columns: {
            id: true,
            provider: true,
          },
        },
        bankAccounts: {
          columns: {
            id: true,
            bankConnectionId: true,
          },
        },
      },
    });

    // Step 2: Filter to potential candidates
    const potentialCandidates = allTeamsWithConnections.filter((team) => {
      // Pro/Starter teams (will need bank connection check)
      if (team.plan === "pro" || team.plan === "starter") {
        return true;
      }
      // Trial teams created in past 15 days (will need bank connection check)
      if (
        team.plan === "trial" &&
        new Date(team.createdAt) >= fourteenDaysAgo
      ) {
        return true;
      }
      return false;
    });

    const proStarterCandidates = potentialCandidates.filter(
      (team) => team.plan === "pro" || team.plan === "starter",
    );
    const trialCandidates = potentialCandidates.filter(
      (team) => team.plan === "trial",
    );

    console.log(
      `Found ${potentialCandidates.length} potential candidate teams (${proStarterCandidates.length} pro/starter, ${trialCandidates.length} recent trial - all will need bank connections)`,
    );

    // Step 3: Determine final eligibility and create detailed results
    const eligibleTeams: EligibleTeam[] = [];

    for (const team of potentialCandidates) {
      const bankConnectionCount = team.bankConnections
        ? team.bankConnections.length
        : 0;

      const bankAccountCount = team.bankAccounts ? team.bankAccounts.length : 0;

      // Get unique banking providers
      const bankingProviders = team.bankConnections
        ? [...new Set(team.bankConnections.map((conn) => conn.provider))]
        : [];

      // Criteria 1: Pro/Starter teams with bank connections
      if (team.plan === "pro" || team.plan === "starter") {
        if (bankConnectionCount > 0) {
          eligibleTeams.push({
            id: team.id,
            name: team.name,
            plan: team.plan,
            createdAt: team.createdAt,
            bankConnectionCount,
            bankAccountCount,
            bankingProviders,
            eligibilityReason: "pro_starter_with_bank",
          });
        }
        continue;
      }

      // Criteria 2: Trial teams registered in past 15 days AND have bank connections
      if (
        team.plan === "trial" &&
        new Date(team.createdAt) >= fourteenDaysAgo &&
        bankConnectionCount > 0
      ) {
        eligibleTeams.push({
          id: team.id,
          name: team.name,
          plan: team.plan,
          createdAt: team.createdAt,
          bankConnectionCount,
          bankAccountCount,
          bankingProviders,
          eligibilityReason: "trial_recent_with_bank",
        });
      }
    }

    // Display results
    console.log(`\nFound ${eligibleTeams.length} eligible teams:\n`);

    const proStarterTeams = eligibleTeams.filter(
      (t) => t.eligibilityReason === "pro_starter_with_bank",
    );
    const trialTeams = eligibleTeams.filter(
      (t) => t.eligibilityReason === "trial_recent_with_bank",
    );

    if (proStarterTeams.length > 0) {
      console.log("Pro/Starter teams with bank connections:");
      for (const team of proStarterTeams) {
        const providersList =
          team.bankingProviders.length > 0
            ? team.bankingProviders.join(", ")
            : "No providers";
        console.log(
          `  - ${team.id} | ${team.name || "Unnamed"} | ${team.plan} | ${team.bankConnectionCount} connections | ${team.bankAccountCount} accounts | Providers: ${providersList}`,
        );
      }
      console.log();
    }

    if (trialTeams.length > 0) {
      console.log(
        "Trial teams registered in past 15 days with bank connections:",
      );
      for (const team of trialTeams) {
        const daysAgo = Math.floor(
          (Date.now() - new Date(team.createdAt).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const providersList =
          team.bankingProviders.length > 0
            ? team.bankingProviders.join(", ")
            : "No providers";
        console.log(
          `  - ${team.id} | ${team.name || "Unnamed"} | ${team.plan} | ${team.bankConnectionCount} connections | ${team.bankAccountCount} accounts | Providers: ${providersList} | created ${daysAgo} days ago`,
        );
      }
      console.log();
    }

    // Calculate additional statistics
    const totalBankConnections = eligibleTeams.reduce(
      (sum, team) => sum + team.bankConnectionCount,
      0,
    );
    const totalBankAccounts = eligibleTeams.reduce(
      (sum, team) => sum + team.bankAccountCount,
      0,
    );
    const allProviders = new Set(
      eligibleTeams.flatMap((team) => team.bankingProviders),
    );
    const uniqueProviders = Array.from(allProviders);

    // Count connections per provider
    const providerConnectionCounts = new Map<string, number>();
    for (const team of eligibleTeams) {
      if (team.bankingProviders.length > 0) {
        // Get the actual connections to count them per provider
        const teamWithConnections = allTeamsWithConnections.find(
          (t) => t.id === team.id,
        );
        if (teamWithConnections?.bankConnections) {
          for (const connection of teamWithConnections.bankConnections) {
            const currentCount =
              providerConnectionCounts.get(connection.provider) || 0;
            providerConnectionCounts.set(connection.provider, currentCount + 1);
          }
        }
      }
    }

    console.log("Summary:");
    console.log(
      `Pro/Starter teams with bank connections: ${proStarterTeams.length}`,
    );
    console.log(
      `Trial teams registered in past 15 days with bank connections: ${trialTeams.length}`,
    );
    console.log(`Total eligible teams: ${eligibleTeams.length}`);
    console.log(`Total bank connections: ${totalBankConnections}`);
    console.log(`Total bank accounts: ${totalBankAccounts}`);
    console.log(
      `Banking providers in use: ${uniqueProviders.length > 0 ? uniqueProviders.join(", ") : "None"}`,
    );

    // Display connection counts per provider
    if (providerConnectionCounts.size > 0) {
      console.log("\nConnections per provider:");
      const sortedProviders = Array.from(
        providerConnectionCounts.entries(),
      ).sort(([, a], [, b]) => b - a); // Sort by count descending
      for (const [provider, count] of sortedProviders) {
        console.log(`  - ${provider}: ${count} connections`);
      }
    }

    return eligibleTeams;
  } catch (error) {
    console.error("Error fetching eligible teams:", error);
    throw error;
  } finally {
    await disconnect();
  }
}

// Run the script if called directly
async function main() {
  try {
    const eligibleTeams = await getEligibleTeamIds();
    console.log(
      `\nScript completed successfully. Total eligible teams: ${eligibleTeams.length}`,
    );
    process.exit(0);
  } catch (error) {
    console.error("Script failed:", error);
    process.exit(1);
  }
}

// Check if this file is being run directly
if (require.main === module) {
  main();
}

export { getEligibleTeamIds };
export type { EligibleTeam };
