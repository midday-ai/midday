import { afterEach, describe, expect, test } from "bun:test";
import {
  authorizeCompletedKey,
  authorizeUploadFolder,
  authorizeUploadKey,
  enforceMimeAndSize,
  maxUploadBytes,
} from "./upload-policy";

const ctx = { teamId: "team-a", userId: "user-a" };
const txId = "47da6d71-e66a-46e4-92d3-e90b4c3174f8";
const originalLimit = process.env.STORAGE_MAX_UPLOAD_BYTES_VAULT;
afterEach(() => {
  if (originalLimit === undefined)
    delete process.env.STORAGE_MAX_UPLOAD_BYTES_VAULT;
  else process.env.STORAGE_MAX_UPLOAD_BYTES_VAULT = originalLimit;
});

describe("upload folder policy", () => {
  test("vault permits own root/inbox/imports and identifies transaction for DB check", () => {
    for (const path of [
      ["team-a"],
      ["team-a", "inbox"],
      ["team-a", "imports"],
    ]) {
      expect(authorizeUploadFolder("vault", path, ctx)).toBeUndefined();
    }
    expect(
      authorizeUploadFolder("vault", ["team-a", "transactions", txId], ctx),
    ).toBe(txId);
  });
  test("vault rejects foreign tenants, unknown folders and invalid transaction IDs", () => {
    for (const path of [
      [],
      ["team-b"],
      ["team-a-other"],
      ["team-a", "other"],
      ["team-a", "transactions"],
      ["team-a", "transactions", "not-a-uuid"],
      ["team-a", "inbox", "nested"],
    ]) {
      expect(() => authorizeUploadFolder("vault", path, ctx)).toThrow();
    }
    expect(() =>
      authorizeUploadFolder("vault", ["team-a"], { ...ctx, teamId: null }),
    ).toThrow();
  });
  test("avatars permit own user/team and team invoice only", () => {
    for (const path of [["user-a"], ["team-a"], ["team-a", "invoice"]]) {
      expect(authorizeUploadFolder("avatars", path, ctx)).toBeUndefined();
    }
    expect(
      authorizeUploadFolder("avatars", ["user-a"], { ...ctx, teamId: null }),
    ).toBeUndefined();
    for (const path of [
      ["user-b"],
      ["team-b"],
      ["user-a", "invoice"],
      ["team-a", "logos"],
    ]) {
      expect(() => authorizeUploadFolder("avatars", path, ctx)).toThrow();
    }
  });
  test("apps permit only server-designated folders", () => {
    for (const path of [["logos"], ["screenshots"]])
      expect(authorizeUploadFolder("apps", path, ctx)).toBeUndefined();
    for (const path of [["logos", "nested"], ["team-a"], ["other"]])
      expect(() => authorizeUploadFolder("apps", path, ctx)).toThrow();
  });
  test("path injection, traversal, control bytes and aliases are rejected", () => {
    for (const part of [
      ".",
      "..",
      "/team-a",
      "team-a/",
      "team-a/inbox",
      "team-a\\inbox",
      "team-a\0",
      "",
    ]) {
      expect(() => authorizeUploadFolder("vault", [part], ctx)).toThrow();
    }
    for (const key of [
      "/team-a/file.pdf",
      "vault/team-a/file.pdf",
      "team-a//file.pdf",
      "team-a/../file.pdf",
      "team-b/file.pdf",
    ]) {
      expect(() => authorizeCompletedKey("vault", key, ctx)).toThrow();
    }
  });
  test("completion identifies transaction again and never decodes literal percent", () => {
    expect(
      authorizeCompletedKey("vault", `team-a/transactions/${txId}/a.pdf`, ctx),
    ).toBe(txId);
    expect(
      authorizeCompletedKey("vault", "team-a/%2F.pdf", ctx),
    ).toBeUndefined();
    expect(() =>
      authorizeCompletedKey("vault", "team-a%2Fother/a.pdf", ctx),
    ).toThrow();
  });
});

describe("generated object keys", () => {
  test("vault filename is sanitized but client paths cannot inject extra folders", () => {
    expect(
      authorizeUploadKey(
        "vault",
        ["team-a"],
        "Receipt (1).PDF",
        ctx,
        "application/pdf",
      ),
    ).toBe("team-a/receipt-1.pdf");
    for (const filename of [
      "..",
      ".",
      "",
      "../../a.pdf",
      "inbox/a.pdf",
      "a\\b.pdf",
      "a".repeat(256),
    ]) {
      expect(() =>
        authorizeUploadKey(
          "vault",
          ["team-a"],
          filename,
          ctx,
          "application/pdf",
        ),
      ).toThrow();
    }
  });
  test("apps generates unpredictable basename and MIME-based extension", () => {
    const first = authorizeUploadKey(
      "apps",
      ["logos"],
      "chosen.html",
      ctx,
      "image/png",
    );
    const second = authorizeUploadKey(
      "apps",
      ["logos"],
      "chosen.html",
      ctx,
      "image/png",
    );
    expect(first).toMatch(/^logos\/[A-Za-z0-9_-]{21}\.png$/);
    expect(second).not.toBe(first);
    expect(() =>
      authorizeUploadKey("apps", ["logos"], "a.png", ctx, "image/unknown"),
    ).toThrow();
  });
});

describe("MIME and size policy", () => {
  test("vault accepts processing formats and CSV/Excel/ZIP", () => {
    for (const mime of [
      "application/pdf",
      "text/csv",
      "application/vnd.ms-excel",
      "application/zip",
      "text/plain",
      "image/heic",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]) {
      expect(enforceMimeAndSize("vault", mime, 1)).toBe(mime);
    }
    expect(enforceMimeAndSize("vault", " Text/CSV; charset=utf-8 ", 100)).toBe(
      "text/csv",
    );
    expect(() => enforceMimeAndSize("vault", "text/html", 1)).toThrow();
    expect(() =>
      enforceMimeAndSize("vault", "application/octet-stream", 1),
    ).toThrow();
  });
  test("public buckets reject nonimages; apps requires a known image extension", () => {
    expect(enforceMimeAndSize("avatars", "image/png", 1)).toBe("image/png");
    expect(enforceMimeAndSize("apps", "image/avif", 1)).toBe("image/avif");
    for (const bucket of ["avatars", "apps"] as const)
      expect(() => enforceMimeAndSize(bucket, "application/pdf", 1)).toThrow();
    expect(() => enforceMimeAndSize("apps", "image/unknown", 1)).toThrow();
  });
  test("enforces bucket limits, rejects invalid sizes, and respects configured vault limit", () => {
    delete process.env.STORAGE_MAX_UPLOAD_BYTES_VAULT;
    expect(maxUploadBytes("vault")).toBe(100 * 1024 * 1024);
    expect(maxUploadBytes("avatars")).toBe(5 * 1024 * 1024);
    for (const size of [
      0,
      -1,
      1.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      5 * 1024 * 1024 + 1,
    ])
      expect(() => enforceMimeAndSize("avatars", "image/png", size)).toThrow();
    expect(enforceMimeAndSize("avatars", "image/png", 5 * 1024 * 1024)).toBe(
      "image/png",
    );
    process.env.STORAGE_MAX_UPLOAD_BYTES_VAULT = "10";
    expect(enforceMimeAndSize("vault", "application/pdf", 10)).toBe(
      "application/pdf",
    );
    expect(() => enforceMimeAndSize("vault", "application/pdf", 11)).toThrow();
    process.env.STORAGE_MAX_UPLOAD_BYTES_VAULT = "invalid";
    expect(() => maxUploadBytes("vault")).toThrow();
  });
});
