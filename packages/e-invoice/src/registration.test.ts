import { describe, expect, test } from "bun:test";
import {
  buildPartyDocument,
  parsePartyKey,
  partyKey,
  type TeamRegistrationData,
} from "./registration";

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function createTeamData(
  overrides?: Partial<TeamRegistrationData>,
): TeamRegistrationData {
  return {
    teamId: "team-001",
    name: "Acme Corp",
    email: "billing@acme.com",
    countryCode: "SE",
    addressLine1: "Kungsgatan 1",
    addressLine2: "Floor 3",
    city: "Stockholm",
    state: "Stockholm",
    zip: "111 22",
    vatNumber: "SE556123456701",
    peppolId: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// buildPartyDocument
// ---------------------------------------------------------------------------

describe("buildPartyDocument", () => {
  test("sets correct $schema for org/party", () => {
    const doc = buildPartyDocument(createTeamData());
    expect(doc.$schema).toBe("https://gobl.org/draft-0/org/party");
  });

  test("sets name", () => {
    const doc = buildPartyDocument(createTeamData());
    expect(doc.name).toBe("Acme Corp");
  });

  test("includes tax_id with country and VAT code", () => {
    const doc = buildPartyDocument(createTeamData());
    expect(doc.tax_id).toEqual({
      country: "SE",
      code: "SE556123456701",
    });
  });

  test("builds address from all fields", () => {
    const doc = buildPartyDocument(createTeamData());
    expect(doc.addresses).toHaveLength(1);
    expect(doc.addresses![0]).toEqual({
      street: "Kungsgatan 1",
      street_extra: "Floor 3",
      locality: "Stockholm",
      region: "Stockholm",
      code: "111 22",
      country: "SE",
    });
  });

  test("includes email", () => {
    const doc = buildPartyDocument(createTeamData());
    expect(doc.emails).toEqual([{ addr: "billing@acme.com" }]);
  });

  test("includes Peppol inbox with parsed scheme and code when peppolId has colon format", () => {
    const doc = buildPartyDocument(
      createTeamData({ peppolId: "0007:5567321234" }),
    );
    expect(doc.inboxes).toEqual([
      { key: "peppol", scheme: "0007", code: "5567321234" },
    ]);
  });

  test("includes Peppol inbox without scheme when peppolId has no colon", () => {
    const doc = buildPartyDocument(createTeamData({ peppolId: "5567321234" }));
    expect(doc.inboxes).toEqual([{ key: "peppol", code: "5567321234" }]);
  });

  test("omits inboxes when peppolId is null", () => {
    const doc = buildPartyDocument(createTeamData({ peppolId: null }));
    expect(doc.inboxes).toBeUndefined();
  });

  test("omits tax_id when countryCode is null", () => {
    const doc = buildPartyDocument(createTeamData({ countryCode: null }));
    expect(doc.tax_id).toBeUndefined();
  });

  test("omits address when addressLine1 and city are null", () => {
    const doc = buildPartyDocument(
      createTeamData({ addressLine1: null, city: null }),
    );
    expect(doc.addresses).toBeUndefined();
  });

  test("omits email when null", () => {
    const doc = buildPartyDocument(createTeamData({ email: null }));
    expect(doc.emails).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// partyKey / parsePartyKey
// ---------------------------------------------------------------------------

describe("partyKey", () => {
  test("generates correct key format", () => {
    expect(partyKey("team-abc")).toBe("midday-party-team-abc");
  });
});

describe("parsePartyKey", () => {
  test("parses valid key back to team ID", () => {
    expect(parsePartyKey("midday-party-team-abc")).toBe("team-abc");
  });

  test("returns null for invoice key (no cross-match)", () => {
    expect(parsePartyKey("midday-invoice-inv-001")).toBeNull();
  });

  test("returns null for empty string", () => {
    expect(parsePartyKey("")).toBeNull();
  });
});
