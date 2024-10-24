import { filter, match } from "@/utils//wildcard";
import { describe, expect, it } from "vitest";

describe("filter", () => {
  it("returns an empty array when there are no matches", () => {
    const resources = ["resource-1", "resource-2"];
    const pattern = "not-exist-*";
    const result = filter(resources, pattern);
    expect(result).toEqual([]);
  });

  it("matches all resources with a wildcard pattern", () => {
    const resources = ["resource-1", "resource-2"];
    const pattern = "*";
    const result = filter(resources, pattern);
    expect(result).toEqual(resources);
  });

  it("matches a subset of resources with a specific pattern", () => {
    const resources = ["resource-1", "resource-2", "resource-3"];
    const pattern = "resource-2";
    const result = filter(resources, pattern);
    expect(result).toEqual(["resource-2"]);
  });

  it("matches resources with different prefixes", () => {
    const resources = ["resource-1", "other-1"];
    const pattern = "other-*";
    const result = filter(resources, pattern);
    expect(result).toEqual(["other-1"]);
  });
});
describe("match", () => {
  it("returns an empty array when there are no matches", () => {
    const pattern = "not-exist-*";

    expect(match(pattern, "resource-1")).toEqual(false);
    expect(match(pattern, "resource-2")).toEqual(false);
  });

  it("matches all resources with a wildcard pattern", () => {
    const pattern = "*";

    expect(match(pattern, "resource-1")).toEqual(true);
    expect(match(pattern, "resource-2")).toEqual(true);
  });

  it("matches a subset of resources with a specific pattern", () => {
    const pattern = "resource-2";

    expect(match(pattern, "resource-1")).toEqual(false);
    expect(match(pattern, "resource-2")).toEqual(true);
    expect(match(pattern, "resource-3")).toEqual(false);
  });

  it("matches resources with different prefixes", () => {
    const pattern = "other-*";

    expect(match(pattern, "resource-1")).toEqual(false);
    expect(match(pattern, "other-1")).toEqual(true);
  });
});
