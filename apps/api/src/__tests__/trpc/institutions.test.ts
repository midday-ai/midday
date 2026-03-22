import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { institutionsRouter } from "../../trpc/routers/institutions";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const INSTITUTION_ID = "inst_abc123";

const createCaller = createCallerFactory(institutionsRouter);

describe("tRPC: institutions.get", () => {
  beforeEach(() => {
    mocks.getInstitutions.mockReset();
    mocks.getInstitutions.mockImplementation(() =>
      Promise.resolve([
        {
          id: INSTITUTION_ID,
          name: "Test Bank",
          logo: null,
          popularity: 1,
          availableHistory: 90,
          maximumConsentValidity: null,
          provider: "plaid",
          type: "personal",
          countries: ["US"],
        },
      ]),
    );
  });

  test("returns institutions for country", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.get({ countryCode: "US" });

    expect(result).toEqual([
      expect.objectContaining({
        id: INSTITUTION_ID,
        name: "Test Bank",
        country: "US",
      }),
    ]);
    expect(mocks.getInstitutions).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ countryCode: "US" }),
    );
  });

  test("maps empty result", async () => {
    mocks.getInstitutions.mockImplementation(() => Promise.resolve([]));

    const caller = createCaller(createTestContext());
    expect(await caller.get({ countryCode: "US" })).toEqual([]);
  });

  test("wraps query failures as INTERNAL_SERVER_ERROR", async () => {
    mocks.getInstitutions.mockImplementation(() =>
      Promise.reject(new Error("db down")),
    );

    const caller = createCaller(createTestContext());
    await expect(caller.get({ countryCode: "US" })).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });
});

describe("tRPC: institutions.getById", () => {
  beforeEach(() => {
    mocks.getInstitutionById.mockReset();
    mocks.getInstitutionById.mockImplementation(() =>
      Promise.resolve({
        id: INSTITUTION_ID,
        name: "Test Bank",
        logo: null,
        provider: "plaid",
        availableHistory: 90,
        maximumConsentValidity: null,
        popularity: 1,
        type: "personal",
        countries: ["US"],
      }),
    );
  });

  test("returns institution by id", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getById({ id: INSTITUTION_ID });

    expect(result).toMatchObject({
      id: INSTITUTION_ID,
      name: "Test Bank",
    });
    expect(mocks.getInstitutionById).toHaveBeenCalledWith(expect.anything(), {
      id: INSTITUTION_ID,
    });
  });

  test("returns NOT_FOUND when missing", async () => {
    mocks.getInstitutionById.mockImplementation(() => Promise.resolve(null));

    const caller = createCaller(createTestContext());
    await expect(caller.getById({ id: INSTITUTION_ID })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("tRPC: institutions.updateUsage", () => {
  beforeEach(() => {
    mocks.updateInstitutionUsage.mockReset();
    mocks.updateInstitutionUsage.mockImplementation(() =>
      Promise.resolve({
        id: INSTITUTION_ID,
        name: "Test Bank",
        logo: null,
        availableHistory: 90,
        maximumConsentValidity: null,
        popularity: 2,
        provider: "plaid",
        type: "personal",
        countries: ["US"],
      }),
    );
  });

  test("updates usage and returns institution payload", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.updateUsage({ id: INSTITUTION_ID });

    expect(result).toEqual({
      data: {
        id: INSTITUTION_ID,
        name: "Test Bank",
        logo: null,
        availableHistory: 90,
        maximumConsentValidity: null,
        popularity: 2,
        provider: "plaid",
        type: "personal",
        country: "US",
      },
    });
    expect(mocks.updateInstitutionUsage).toHaveBeenCalledWith(
      expect.anything(),
      { id: INSTITUTION_ID },
    );
  });
});
