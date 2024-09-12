import baseX from "base-x";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { newId } from "./generate";

// Mock the crypto.getRandomValues function
const mockGetRandomValues = vi.fn();
vi.spyOn(crypto, "getRandomValues").mockImplementation(mockGetRandomValues);

// Mock the Date.now function
vi.spyOn(Date, "now").mockImplementation(() => 1700000000000);

describe("newId function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates an ID with the correct prefix", () => {
    mockGetRandomValues.mockImplementation((arr: Uint8Array) => {
      arr.set(new Uint8Array(arr.length).fill(0));
      return arr;
    });

    const id = newId("key");
    expect(id).toMatch(/^key_[1-9A-HJ-NP-Za-km-z]+$/);
  });

  it("generates different IDs for different prefixes", () => {
    mockGetRandomValues.mockImplementation((arr: Uint8Array) => {
      arr.set(new Uint8Array(arr.length).fill(0));
      return arr;
    });

    const keyId = newId("key");
    const policyId = newId("policy");

    expect(keyId).not.toBe(policyId);
    expect(keyId).toMatch(/^key_/);
    expect(policyId).toMatch(/^pol_/);
  });

  it("includes timestamp in the generated ID", () => {
    mockGetRandomValues.mockImplementation((arr: Uint8Array) => {
      arr.set(new Uint8Array(arr.length).fill(0));
      return arr;
    });

    vi.spyOn(Date, "now").mockReturnValueOnce(1700000000000);
    const id1 = newId("test");

    vi.spyOn(Date, "now").mockReturnValueOnce(1700000000001);
    const id2 = newId("test");

    expect(id1).not.toBe(id2);
  });

  it("uses crypto.getRandomValues for randomness", () => {
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);

    mockGetRandomValues.mockImplementationOnce((arr: Uint8Array) => {
      arr.set(new Uint8Array(arr.length).fill(1));
      return arr;
    });
    const id1 = newId("test");

    mockGetRandomValues.mockImplementationOnce((arr: Uint8Array) => {
      arr.set(new Uint8Array(arr.length).fill(2));
      return arr;
    });
    const id2 = newId("test");

    expect(id1).not.toBe(id2);
  });

  it("generates valid base58 encoded string", () => {
    mockGetRandomValues.mockImplementation((arr: Uint8Array) => {
      arr.set(new Uint8Array(arr.length).fill(0));
      return arr;
    });
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);

    const id = newId("test");
    const [prefix, encoded] = id.split("_");

    expect(prefix).toBe("test");

    const b58 = baseX(
      "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
    );
    expect(() => b58.decode(encoded)).not.toThrow();
  });
});
