import { describe, expect, test } from "bun:test";
import {
  assertTeamKey,
  normalizeKey,
  parentIdFromKey,
  StorageForbiddenError,
  StorageKeyError,
} from "../keys";

describe("canonical object keys", () => {
  test("legacy prefixes and arrays converge to the same key", () => {
    for (const input of [
      "team/a.pdf",
      "/team/a.pdf",
      "vault/team/a.pdf",
      "/vault/team/a.pdf",
      ["team", "a.pdf"],
    ]) {
      const key = normalizeKey(input);
      expect(key).toBe("team/a.pdf");
      expect(normalizeKey(key)).toBe(key);
    }
  });
  test("preserves Unicode and literal percent encoding without a second decode", () => {
    for (const filename of [
      "été 中文.pdf",
      "100%.pdf",
      "%2F.pdf",
      "%2e%2e.pdf",
      "%252F.pdf",
      "report#1?.pdf",
    ]) {
      expect(assertTeamKey("team", `team/${filename}`)).toBe(
        `team/${filename}`,
      );
    }
  });
  test("rejects dangerous literal segments before storage operations", () => {
    for (const key of [
      "",
      "/",
      "//team/x",
      "team/",
      "team//x",
      "team/../other/x",
      "team/./x",
      "team\\x",
      "team/\u0000x",
      "vault/vault/team/x",
    ]) {
      expect(() => normalizeKey(key)).toThrow(StorageKeyError);
    }
  });
  test("tenant authorization never admits partial team prefixes or encoded separators", () => {
    for (const key of [
      "other/x",
      "team-evil/x",
      "team%2Fother/x",
      "%74eam/x",
    ]) {
      expect(() => assertTeamKey("team", key)).toThrow(StorageForbiddenError);
    }
    expect(() =>
      assertTeamKey("team", decodeURIComponent("team/%2e%2e/other/x")),
    ).toThrow(StorageKeyError);
    expect(() =>
      assertTeamKey("team", decodeURIComponent("other%2Fx")),
    ).toThrow(StorageForbiddenError);
  });
  test("parent folder matches the storage trigger", () => {
    expect(parentIdFromKey("a")).toBeNull();
    expect(parentIdFromKey("team/file")).toBe("team");
    expect(parentIdFromKey("team/inbox/file")).toBe("inbox");
  });
});
