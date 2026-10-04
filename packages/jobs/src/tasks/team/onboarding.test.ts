import { beforeEach, describe, expect, mock, test } from "bun:test";
import { z } from "zod";

const initialDb = { pool: "initial" };
const resumedDb = { pool: "resumed" };
let activeDb = initialDb;
const getDb = mock(() => activeDb);
const getUserById = mock(async () => ({
  id: "user",
  fullName: "Test User",
  email: "test@example.test",
  teamId: "team",
}));
const getTeamById = mock(async () => ({
  plan: "trial",
  subscriptionStatus: null,
}));
const getBankConnectionCount = mock(async () => 0);
const send = mock(async () => ({}));
const contact = mock(async () => ({}));

mock.module("@jobs/schema", () => ({
  onboardTeamSchema: z.object({ userId: z.string() }),
}));
mock.module("@jobs/init", () => ({ getDb }));
mock.module("@midday/db/queries", () => ({
  getUserById,
  getTeamById,
  getBankConnectionCount,
}));
mock.module("@jobs/utils/resend", () => ({
  resend: { emails: { send }, contacts: { create: contact } },
}));
mock.module("@midday/email/render", () => ({
  render: async () => "<p>Onboarding</p>",
}));
mock.module("@midday/email/emails/trial-activation", () => ({
  TrialActivationEmail: () => null,
}));
mock.module("@midday/email/emails/welcome", () => ({
  WelcomeEmail: () => null,
}));
mock.module("@trigger.dev/sdk", () => ({
  schemaTask: (definition: unknown) => definition,
  logger: { info: mock(() => {}) },
  wait: {
    for: async () => {
      activeDb = resumedDb;
    },
  },
}));
const { onboardTeam } = await import("./onboarding");
const run = (
  onboardTeam as unknown as {
    run: (payload: { userId: string }) => Promise<void>;
  }
).run;

describe("onboard-team uses the job database", () => {
  beforeEach(() => {
    activeDb = initialDb;
    getDb.mockClear();
    getUserById.mockClear();
    getTeamById.mockClear();
    getBankConnectionCount.mockClear();
    send.mockClear();
    contact.mockClear();
  });
  test("runs welcome and activation with a fresh pool after resume", async () => {
    await run({ userId: "user" });
    expect(getUserById).toHaveBeenCalledWith(initialDb, "user");
    expect(getTeamById).toHaveBeenCalledWith(resumedDb, "team");
    expect(getBankConnectionCount).toHaveBeenCalledWith(resumedDb, {
      teamId: "team",
    });
    expect(send).toHaveBeenCalledTimes(2);
    expect(contact).toHaveBeenCalledTimes(1);
  });
});
