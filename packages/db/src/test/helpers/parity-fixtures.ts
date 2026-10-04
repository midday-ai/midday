import type { Database } from "../../client";
import {
  authUsers,
  bankAccounts,
  customers,
  documents,
  exchangeRates,
  invoices,
  teams,
  trackerEntries,
  trackerProjects,
  transactionCategoryEmbeddings,
  users,
} from "../../schema";

export const CATEGORY_NAME = 'Café Résumé "X"';

export async function seedParityFixtures(db: Database) {
  const userId = crypto.randomUUID();
  const teamA = crypto.randomUUID();
  const teamB = crypto.randomUUID();
  await db
    .insert(authUsers)
    .values({ id: userId, name: "Parity User", email: "parity@example.test" });
  await db.insert(users).values({ id: userId, email: "parity@example.test" });
  await db.insert(teams).values([
    { id: teamA, name: "Team A", baseCurrency: "SEK" },
    { id: teamB, name: "Team B", baseCurrency: "USD" },
  ]);
  await db
    .insert(exchangeRates)
    .values({ base: "USD", target: "SEK", rate: 10.5 });
  // Satisfy the category embedding cache so caller-contract tests never call AI services.
  await db
    .insert(transactionCategoryEmbeddings)
    .values(
      [CATEGORY_NAME, "Software"].map((name) => ({
        name,
        embedding: Array(768).fill(0),
      })),
    )
    .onConflictDoNothing();
  const accounts = await db
    .insert(bankAccounts)
    .values([
      {
        teamId: teamA,
        createdBy: userId,
        name: "A USD",
        currency: "USD",
        balance: 100,
        accountId: crypto.randomUUID(),
        enabled: true,
      },
      {
        teamId: teamA,
        createdBy: userId,
        name: "A disabled",
        currency: "EUR",
        balance: 900,
        accountId: crypto.randomUUID(),
        enabled: false,
      },
      {
        teamId: teamB,
        createdBy: userId,
        name: "B GBP",
        currency: "GBP",
        balance: 500,
        accountId: crypto.randomUUID(),
        enabled: true,
      },
    ])
    .returning();
  const records = [];
  for (const teamId of [teamA, teamB]) {
    const [customer] = await db
      .insert(customers)
      .values({
        teamId,
        name: "Acme customer",
        email: `${teamId}@example.test`,
      })
      .returning();
    const [invoice] = await db
      .insert(invoices)
      .values({
        teamId,
        invoiceNumber: "Acme-001",
        customerName: "Acme customer",
        status: "paid",
        amount: 1500,
        currency: "USD",
        template: { size: "a4" },
        updatedAt: "2020-01-01T00:00:00Z",
      })
      .returning();
    await db.insert(invoices).values({
      teamId,
      invoiceNumber: "Acme-002",
      status: "unpaid",
      amount: 100,
      currency: "USD",
    });
    const [document, related] = await db
      .insert(documents)
      .values([
        {
          teamId,
          name: `${teamId}/receipt.pdf`,
          pathTokens: [teamId, "receipt.pdf"],
          title: "Acme annual report",
          metadata: { mimetype: "application/pdf" },
        },
        {
          teamId,
          name: `${teamId}/related.pdf`,
          pathTokens: [teamId, "related.pdf"],
          title: "Acme annual report revised",
          metadata: { mimetype: "application/pdf" },
        },
      ])
      .returning();
    const [project] = await db
      .insert(trackerProjects)
      .values({
        teamId,
        name: "Acme project",
        rate: 1000,
        currency: "USD",
        customerId: customer!.id,
      })
      .returning();
    await db.insert(trackerEntries).values([
      { teamId, projectId: project!.id, assignedId: userId, duration: 3600 },
      { teamId, projectId: project!.id, assignedId: userId, duration: 1800 },
    ]);
    records.push({
      customer: customer!,
      invoice: invoice!,
      document: document!,
      related: related!,
      project: project!,
    });
  }
  return {
    userId,
    teamA,
    teamB,
    accountA: accounts[0]!,
    accountB: accounts[2]!,
    a: records[0]!,
    b: records[1]!,
  };
}
