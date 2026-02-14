import { describe, expect, test } from "bun:test";
import { extractPeppolId, extractRegistrationUrl, mapFaults } from "./parsers";
import type { InvopopSiloEntry } from "./types";

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function createSiloEntry(
  overrides?: Partial<InvopopSiloEntry>,
): InvopopSiloEntry {
  return {
    id: "entry-001",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// mapFaults
// ---------------------------------------------------------------------------

describe("mapFaults", () => {
  test("returns empty array for undefined input", () => {
    expect(mapFaults(undefined)).toEqual([]);
  });

  test("returns empty array for empty array", () => {
    expect(mapFaults([])).toEqual([]);
  });

  test("maps fault with all fields", () => {
    const result = mapFaults([
      { message: "Tax ID invalid", code: "tax_id", provider: "peppol" },
    ]);
    expect(result).toEqual([
      { message: "Tax ID invalid", code: "tax_id", provider: "peppol" },
    ]);
  });

  test("defaults message to 'Unknown error' when undefined", () => {
    const result = mapFaults([{ code: "some-code" }]);
    expect(result[0]!.message).toBe("Unknown error");
  });

  test("omits code and provider when not present", () => {
    const result = mapFaults([{ message: "Something failed" }]);
    expect(result).toEqual([{ message: "Something failed" }]);
    expect("code" in result[0]!).toBe(false);
    expect("provider" in result[0]!).toBe(false);
  });

  test("maps multiple faults", () => {
    const result = mapFaults([
      { message: "Error 1" },
      { message: "Error 2", provider: "invopop" },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0]!.message).toBe("Error 1");
    expect(result[1]!.provider).toBe("invopop");
  });
});

// ---------------------------------------------------------------------------
// extractPeppolId
// ---------------------------------------------------------------------------

describe("extractPeppolId", () => {
  test("extracts peppolId and scheme from entry with doc.inboxes", () => {
    const entry = createSiloEntry({
      data: {
        doc: {
          inboxes: [{ key: "peppol", scheme: "0208", code: "0316597904" }],
        },
      },
    });
    const result = extractPeppolId(entry);
    expect(result).toEqual({
      peppolId: "0316597904",
      peppolScheme: "0208",
    });
  });

  test("extracts from flat data (no doc wrapper)", () => {
    const entry = createSiloEntry({
      data: {
        inboxes: [{ key: "peppol", scheme: "0007", code: "5567321234" }],
      },
    });
    const result = extractPeppolId(entry);
    expect(result).toEqual({
      peppolId: "5567321234",
      peppolScheme: "0007",
    });
  });

  test("returns nulls when no peppol inbox found", () => {
    const entry = createSiloEntry({
      data: {
        doc: {
          inboxes: [{ key: "other", code: "123" }],
        },
      },
    });
    const result = extractPeppolId(entry);
    expect(result).toEqual({ peppolId: null, peppolScheme: null });
  });

  test("returns nulls when no inboxes array", () => {
    const entry = createSiloEntry({ data: { doc: {} } });
    const result = extractPeppolId(entry);
    expect(result).toEqual({ peppolId: null, peppolScheme: null });
  });

  test("returns nulls when data is undefined", () => {
    const entry = createSiloEntry({ data: undefined });
    const result = extractPeppolId(entry);
    expect(result).toEqual({ peppolId: null, peppolScheme: null });
  });
});

// ---------------------------------------------------------------------------
// extractRegistrationUrl
// ---------------------------------------------------------------------------

describe("extractRegistrationUrl", () => {
  test("extracts URL from meta with peppol-register-link key", () => {
    const entry = createSiloEntry({
      meta: [
        {
          id: "m1",
          key: "peppol-register-link",
          link_url: "https://peppol.invopop.com/reg/abc",
        },
      ],
    });
    expect(extractRegistrationUrl(entry)).toBe(
      "https://peppol.invopop.com/reg/abc",
    );
  });

  test("extracts URL from meta with register-link key", () => {
    const entry = createSiloEntry({
      meta: [
        {
          id: "m1",
          key: "register-link",
          link_url: "https://invopop.com/reg/xyz",
        },
      ],
    });
    expect(extractRegistrationUrl(entry)).toBe("https://invopop.com/reg/xyz");
  });

  test("falls back to any meta entry with link_url", () => {
    const entry = createSiloEntry({
      meta: [
        {
          id: "m1",
          key: "some-other-key",
          link_url: "https://example.com/link",
        },
      ],
    });
    expect(extractRegistrationUrl(entry)).toBe("https://example.com/link");
  });

  test("returns null when no meta present", () => {
    const entry = createSiloEntry({ meta: undefined });
    expect(extractRegistrationUrl(entry)).toBeNull();
  });

  test("returns null when meta has no matching entries", () => {
    const entry = createSiloEntry({
      meta: [{ id: "m1", key: "unrelated" }],
    });
    expect(extractRegistrationUrl(entry)).toBeNull();
  });
});
