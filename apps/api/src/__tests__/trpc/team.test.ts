import { beforeEach, describe, expect, test } from "bun:test";
import { getTeamMembersByTeamId, getTeamsByUserId } from "@midday/db/queries";
import { createCallerFactory } from "../../trpc/init";
import { teamRouter } from "../../trpc/routers/team";
import { createTestContext } from "../helpers/test-context";
import { asMock, mocks } from "../setup";

const SAMPLE_UUID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const OTHER_USER_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

const createCaller = createCallerFactory(teamRouter);

describe("tRPC: team.current", () => {
  beforeEach(() => {
    mocks.getTeamById.mockReset();
    mocks.getTeamById.mockImplementation(() =>
      Promise.resolve({
        id: "test-team-id",
        name: "Acme Corp",
        baseCurrency: "USD",
        logoUrl: null,
        email: "team@acme.com",
        inboxId: null,
        plan: "pro",
        countryCode: "US",
        fiscalYearStartMonth: 1,
        exportSettings: null,
        stripeAccountId: null,
        stripeConnectStatus: null,
      }),
    );
  });

  test("returns current team", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.current();

    expect(result).toMatchObject({
      id: "test-team-id",
      name: "Acme Corp",
      baseCurrency: "USD",
    });
  });

  test("passes teamId from context to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.current();

    expect(mocks.getTeamById).toHaveBeenCalledWith(
      expect.anything(),
      "test-team-id",
    );
  });

  test("returns null when team is not found", async () => {
    mocks.getTeamById.mockImplementation(() => Promise.resolve(null));

    const caller = createCaller(createTestContext());
    const result = await caller.current();

    expect(result).toBeNull();
  });
});

describe("tRPC: team.update", () => {
  beforeEach(() => {
    mocks.updateTeam.mockReset();
    mocks.updateTeam.mockImplementation(() =>
      Promise.resolve({
        id: "test-team-id",
        name: "New Name",
        baseCurrency: "USD",
        logoUrl: null,
        email: null,
        inboxId: null,
        plan: "pro",
        countryCode: null,
        fiscalYearStartMonth: null,
      }),
    );
  });

  test("updates team name", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.update({ name: "New Name" });

    expect(result).toMatchObject({
      id: "test-team-id",
      name: "New Name",
    });
  });

  test("passes current team id to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.update({ name: "New Name" });

    expect(mocks.updateTeam).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: "test-team-id",
        data: expect.objectContaining({ name: "New Name" }),
      }),
    );
  });

  test("rejects name shorter than minimum length", async () => {
    const caller = createCaller(createTestContext());

    await expect(caller.update({ name: "N" })).rejects.toThrow();
  });
});

describe("tRPC: team.members", () => {
  beforeEach(() => {
    asMock(getTeamMembersByTeamId).mockReset();
    asMock(getTeamMembersByTeamId).mockImplementation(() =>
      Promise.resolve([
        {
          id: "membership-1",
          role: "owner",
          teamId: "test-team-id",
          user: {
            id: "test-user-id",
            fullName: "Test User",
            avatarUrl: null,
            email: "test@example.com",
          },
        },
      ]),
    );
  });

  test("returns team members", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.members();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "membership-1",
      role: "owner",
    });
    expect(result[0]?.user?.fullName).toBe("Test User");
  });

  test("passes teamId to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.members();

    expect(getTeamMembersByTeamId).toHaveBeenCalledWith(
      expect.anything(),
      "test-team-id",
    );
  });

  test("handles empty member list", async () => {
    asMock(getTeamMembersByTeamId).mockImplementation(() =>
      Promise.resolve([]),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.members();

    expect(result).toEqual([]);
  });
});

describe("tRPC: team.list", () => {
  beforeEach(() => {
    asMock(getTeamsByUserId).mockReset();
    asMock(getTeamsByUserId).mockImplementation(() =>
      Promise.resolve([
        {
          id: "service-team-id",
          name: "Acme",
          plan: "pro" as const,
          role: "owner",
          createdAt: new Date(),
          canceledAt: null,
          updatedAt: new Date(),
          logoUrl: null,
        },
      ]),
    );
  });

  test("returns teams for the session user", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.list();

    expect(result).toEqual([
      expect.objectContaining({
        id: "service-team-id",
        name: "Acme",
      }),
    ]);
  });

  test("passes user id to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.list();

    expect(getTeamsByUserId).toHaveBeenCalledWith(
      expect.anything(),
      "test-user-id",
    );
  });

  test("handles empty team list", async () => {
    asMock(getTeamsByUserId).mockImplementation(() => Promise.resolve([]));

    const caller = createCaller(createTestContext());
    const result = await caller.list();

    expect(result).toEqual([]);
  });
});

describe("tRPC: team.create", () => {
  beforeEach(() => {
    mocks.createTeam.mockReset();
    mocks.createTeam.mockImplementation(() =>
      Promise.resolve("b2c3d4e5-f6a7-4890-b123-456789012345"),
    );
  });

  test("creates a team and calls createTeam", async () => {
    const caller = createCaller(createTestContext());
    const teamId = await caller.create({
      name: "Test Team",
      baseCurrency: "USD",
      countryCode: "US",
      fiscalYearStartMonth: 1,
      companyType: "small_team",
      heardAbout: "google",
    });

    expect(teamId).toBe("b2c3d4e5-f6a7-4890-b123-456789012345");
    expect(mocks.createTeam).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: "Test Team",
        baseCurrency: "USD",
        countryCode: "US",
        fiscalYearStartMonth: 1,
        userId: "test-user-id",
        email: "test@example.com",
        companyType: "small_team",
      }),
    );
  });
});

describe("tRPC: team.leave", () => {
  beforeEach(() => {
    mocks.leaveTeam.mockReset();
    mocks.leaveTeam.mockImplementation(() =>
      Promise.resolve({ id: "left-membership" }),
    );
    asMock(getTeamMembersByTeamId).mockReset();
    asMock(getTeamMembersByTeamId).mockImplementation(() =>
      Promise.resolve([
        {
          id: "m1",
          role: "owner",
          teamId: SAMPLE_UUID,
          user: {
            id: "test-user-id",
            fullName: "Test",
            avatarUrl: null,
            email: "test@example.com",
          },
        },
        {
          id: "m2",
          role: "owner",
          teamId: SAMPLE_UUID,
          user: {
            id: OTHER_USER_ID,
            fullName: "Other",
            avatarUrl: null,
            email: "other@example.com",
          },
        },
      ]),
    );
  });

  test("leaves team when not sole owner and calls leaveTeam", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.leave({ teamId: SAMPLE_UUID });

    expect(result).toMatchObject({ id: "left-membership" });
    expect(mocks.leaveTeam).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: "test-user-id",
        teamId: SAMPLE_UUID,
      }),
    );
  });
});

describe("tRPC: team.acceptInvite", () => {
  beforeEach(() => {
    mocks.acceptTeamInvite.mockReset();
    mocks.acceptTeamInvite.mockImplementation(() =>
      Promise.resolve({ ok: true }),
    );
  });

  test("accepts invite and calls acceptTeamInvite", async () => {
    const caller = createCaller(createTestContext());
    await caller.acceptInvite({ id: SAMPLE_UUID });

    expect(mocks.acceptTeamInvite).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: SAMPLE_UUID,
        userId: "test-user-id",
        userEmail: "test@example.com",
      }),
    );
  });
});

describe("tRPC: team.declineInvite", () => {
  beforeEach(() => {
    mocks.declineTeamInvite.mockReset();
    mocks.declineTeamInvite.mockImplementation(() =>
      Promise.resolve({ ok: true }),
    );
  });

  test("declines invite and calls declineTeamInvite", async () => {
    const caller = createCaller(createTestContext());
    await caller.declineInvite({ id: SAMPLE_UUID });

    expect(mocks.declineTeamInvite).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: SAMPLE_UUID,
        email: "test@example.com",
      }),
    );
  });
});

describe("tRPC: team.delete", () => {
  const deleteTeamId = "c3d4e5f6-a7b8-4901-c234-567890123456";

  beforeEach(() => {
    mocks.hasTeamAccess.mockReset();
    mocks.hasTeamAccess.mockImplementation(() => Promise.resolve(true));
    mocks.getTeamById.mockReset();
    mocks.getTeamById.mockImplementation(() =>
      Promise.resolve({
        id: deleteTeamId,
        name: "To Delete",
        baseCurrency: "USD",
        logoUrl: null,
        email: null,
        inboxId: null,
        plan: "pro",
        countryCode: "US",
        fiscalYearStartMonth: 1,
        exportSettings: null,
        stripeAccountId: null,
        stripeConnectStatus: null,
      }),
    );
    mocks.getBankConnections.mockReset();
    mocks.getBankConnections.mockImplementation(() => Promise.resolve([]));
    mocks.deleteTeam.mockReset();
    mocks.deleteTeam.mockImplementation(() =>
      Promise.resolve({
        id: deleteTeamId,
        memberUserIds: ["test-user-id"],
      }),
    );
    mocks.triggerJob.mockReset();
    mocks.triggerJob.mockImplementation(() => ({ id: "job-del" }));
  });

  test("deletes team after access checks and calls deleteTeam", async () => {
    const caller = createCaller(createTestContext());
    await caller.delete({ teamId: deleteTeamId });

    expect(mocks.hasTeamAccess).toHaveBeenCalledWith(
      expect.anything(),
      deleteTeamId,
      "test-user-id",
    );
    expect(mocks.getTeamById).toHaveBeenCalledWith(
      expect.anything(),
      deleteTeamId,
    );
    expect(mocks.getBankConnections).toHaveBeenCalledWith(expect.anything(), {
      teamId: deleteTeamId,
    });
    expect(mocks.triggerJob).toHaveBeenCalledWith(
      "delete-team",
      expect.objectContaining({
        teamId: deleteTeamId,
        connections: [],
      }),
      "teams",
    );
    expect(mocks.deleteTeam).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: deleteTeamId,
        userId: "test-user-id",
      }),
    );
  });
});

describe("tRPC: team.deleteMember", () => {
  beforeEach(() => {
    mocks.getTeamMemberRole.mockReset();
    mocks.getTeamMemberRole.mockImplementation((_db, _teamId, userId) => {
      if (userId === "test-user-id") return Promise.resolve("owner");
      if (userId === OTHER_USER_ID) return Promise.resolve("member");
      return Promise.resolve(null);
    });
    mocks.deleteTeamMember.mockReset();
    mocks.deleteTeamMember.mockImplementation(() =>
      Promise.resolve({ id: "removed" }),
    );
  });

  test("removes member when caller is owner and calls deleteTeamMember", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.deleteMember({
      teamId: "test-team-id",
      userId: OTHER_USER_ID,
    });

    expect(result).toMatchObject({ id: "removed" });
    expect(mocks.deleteTeamMember).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        userId: OTHER_USER_ID,
      }),
    );
  });
});

describe("tRPC: team.updateMember", () => {
  beforeEach(() => {
    mocks.getTeamMemberRole.mockReset();
    mocks.getTeamMemberRole.mockImplementation((_db, _teamId, userId) => {
      if (userId === "test-user-id") return Promise.resolve("owner");
      if (userId === OTHER_USER_ID) return Promise.resolve("member");
      return Promise.resolve(null);
    });
    mocks.updateTeamMember.mockReset();
    mocks.updateTeamMember.mockImplementation(() =>
      Promise.resolve({ updated: true }),
    );
  });

  test("updates member role and calls updateTeamMember", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.updateMember({
      teamId: "test-team-id",
      userId: OTHER_USER_ID,
      role: "member",
    });

    expect(result).toMatchObject({ updated: true });
    expect(mocks.updateTeamMember).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        userId: OTHER_USER_ID,
        role: "member",
      }),
    );
  });
});

describe("tRPC: team.teamInvites", () => {
  beforeEach(() => {
    mocks.getTeamInvites.mockReset();
    mocks.getTeamInvites.mockImplementation(() => Promise.resolve([]));
  });

  test("returns team invites from getTeamInvites", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.teamInvites();

    expect(result).toEqual([]);
    expect(mocks.getTeamInvites).toHaveBeenCalledWith(
      expect.anything(),
      "test-team-id",
    );
  });
});

describe("tRPC: team.invitesByEmail", () => {
  beforeEach(() => {
    mocks.getInvitesByEmail.mockReset();
    mocks.getInvitesByEmail.mockImplementation(() => Promise.resolve([]));
  });

  test("returns invites by email from getInvitesByEmail", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.invitesByEmail();

    expect(result).toEqual([]);
    expect(mocks.getInvitesByEmail).toHaveBeenCalledWith(
      expect.anything(),
      "test@example.com",
    );
  });
});

describe("tRPC: team.invite", () => {
  beforeEach(() => {
    mocks.createTeamInvites.mockReset();
    mocks.createTeamInvites.mockImplementation(() =>
      Promise.resolve({
        results: [
          {
            email: "test@example.com",
            team: { name: "Acme" },
          },
        ],
        skippedInvites: [],
      }),
    );
  });

  test("creates invites and calls createTeamInvites", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.invite([
      { email: "test@example.com", role: "member" },
    ]);

    expect(result.sent).toBe(1);
    expect(result.skipped).toBe(0);
    expect(mocks.createTeamInvites).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        invites: [
          expect.objectContaining({
            email: "test@example.com",
            invitedBy: "test-user-id",
          }),
        ],
      }),
    );
  });
});

describe("tRPC: team.deleteInvite", () => {
  beforeEach(() => {
    mocks.deleteTeamInvite.mockReset();
    mocks.deleteTeamInvite.mockImplementation(() =>
      Promise.resolve({ id: SAMPLE_UUID }),
    );
  });

  test("deletes invite and calls deleteTeamInvite", async () => {
    const caller = createCaller(createTestContext());
    await caller.deleteInvite({ id: SAMPLE_UUID });

    expect(mocks.deleteTeamInvite).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        id: SAMPLE_UUID,
      }),
    );
  });
});

describe("tRPC: team.availablePlans", () => {
  beforeEach(() => {
    mocks.getAvailablePlans.mockReset();
    mocks.getAvailablePlans.mockImplementation(() =>
      Promise.resolve({ starter: true, pro: true }),
    );
  });

  test("returns available plans from getAvailablePlans", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.availablePlans();

    expect(result).toEqual({ starter: true, pro: true });
    expect(mocks.getAvailablePlans).toHaveBeenCalledWith(
      expect.anything(),
      "test-team-id",
    );
  });
});

describe("tRPC: team.connectionStatus", () => {
  beforeEach(() => {
    mocks.getBankConnections.mockReset();
    mocks.getBankConnections.mockImplementation(() => Promise.resolve([]));
    mocks.getInboxAccounts.mockReset();
    mocks.getInboxAccounts.mockImplementation(() => Promise.resolve([]));
  });

  test("returns empty connection lists from getBankConnections and getInboxAccounts", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.connectionStatus();

    expect(result).toEqual({
      bankConnections: [],
      inboxAccounts: [],
    });
    expect(mocks.getBankConnections).toHaveBeenCalledWith(expect.anything(), {
      teamId: "test-team-id",
    });
    expect(mocks.getInboxAccounts).toHaveBeenCalledWith(
      expect.anything(),
      "test-team-id",
    );
  });
});
