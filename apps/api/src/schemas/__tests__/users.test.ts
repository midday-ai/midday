import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { updateUserSchema } from "../users";

const names = [
  "NEXT_PUBLIC_BACKEND_PROVIDER",
  "STORAGE_PUBLIC_URL_AVATARS",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
] as const;
const original = new Map(names.map((name) => [name, process.env[name]]));
beforeEach(() => {
  for (const name of names) delete process.env[name];
});
afterEach(() => {
  for (const [name, value] of original) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});
const accepts = (avatarUrl: string) =>
  updateUserSchema.safeParse({ avatarUrl }).success;

describe("user avatar storage URL validation", () => {
  test("local accepts only its configured avatar origin and path boundary", () => {
    process.env.NEXT_PUBLIC_BACKEND_PROVIDER = "local";
    process.env.STORAGE_PUBLIC_URL_AVATARS = "http://localhost:9000/avatars/";
    expect(accepts("http://localhost:9000/avatars/user/photo.png")).toBe(true);
    for (const url of [
      "http://localhost:9001/avatars/user/photo.png",
      "http://127.0.0.1:9000/avatars/user/photo.png",
      "http://localhost:9000/avatars-other/user/photo.png",
      "http://localhost:9000/apps/photo.png?avatar=/avatars/user/photo.png",
      "http://localhost:9000/avatars/../apps/photo.png",
      "http://localhost:9000/avatars/%2e%2e%2fapps/photo.png",
      "http://user:password@localhost:9000/avatars/user/photo.png",
      "http://localhost:9000/avatars/",
      "https://cdn.midday.ai/avatars/photo.png",
    ])
      expect(accepts(url)).toBe(false);
  });

  test("local refuses arbitrary localhost when avatar storage is unset", () => {
    process.env.NEXT_PUBLIC_BACKEND_PROVIDER = "local";
    expect(accepts("http://localhost:9000/avatars/user/photo.png")).toBe(false);
  });

  test("default Supabase retains actual midday.ai hosts without local env", () => {
    expect(accepts("https://midday.ai/avatars/photo.png")).toBe(true);
    expect(accepts("https://cdn.midday.ai/avatars/photo.png")).toBe(true);
    for (const url of [
      "https://midday.ai.evil.example/avatars/photo.png",
      "https://evilmidday.ai/avatars/photo.png",
      "https://evil.example/photo.png?url=https://midday.ai/photo.png",
      "https://midday.ai@evil.example/avatars/photo.png",
      "https://user:password@cdn.midday.ai/avatars/photo.png",
      "ftp://cdn.midday.ai/avatars/photo.png",
    ])
      expect(accepts(url)).toBe(false);
  });

  test("Supabase accepts only the configured project's public avatar bucket", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    expect(
      accepts(
        "https://project.supabase.co/storage/v1/object/public/avatars/user/photo.png",
      ),
    ).toBe(true);
    for (const url of [
      "https://other.supabase.co/storage/v1/object/public/avatars/user/photo.png",
      "https://project.supabase.co/storage/v1/object/public/avatars-other/photo.png",
      "https://project.supabase.co/storage/v1/object/public/apps/photo.png",
      "https://project.supabase.co/elsewhere?path=/storage/v1/object/public/avatars/photo.png",
      "https://user@project.supabase.co/storage/v1/object/public/avatars/photo.png",
    ])
      expect(accepts(url)).toBe(false);
    process.env.SUPABASE_URL = "https://server-project.supabase.co";
    expect(
      accepts(
        "https://server-project.supabase.co/storage/v1/object/public/avatars/user/photo.png",
      ),
    ).toBe(true);
  });
});
