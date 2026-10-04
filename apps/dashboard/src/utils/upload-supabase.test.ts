import { describe, expect, mock, test } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";

let tusOptions: Record<string, any>;
mock.module("tus-js-client", () => ({
  Upload: class {
    constructor(_file: File, options: Record<string, any>) {
      tusOptions = options;
    }
    async findPreviousUploads() {
      return [];
    }
    start() {
      tusOptions.onProgress(3, 3);
      tusOptions.onSuccess();
    }
  },
}));
const { uploadWithSupabase, uploadWithSupabaseTus } = await import(
  "./upload-supabase"
);

describe("Supabase browser upload compatibility", () => {
  test("small-file path uses Supabase upload/public URL without presign completion", async () => {
    const upload = mock(() => Promise.resolve({ error: null }));
    const client = {
      storage: {
        from: () => ({
          upload,
          getPublicUrl: (key: string) => ({
            data: { publicUrl: `https://storage.example.test/${key}` },
          }),
        }),
      },
    } as unknown as SupabaseClient;
    const file = new File(["abc"], "Avatar (1).png", { type: "image/png" });
    expect(
      await uploadWithSupabase(client, {
        file,
        bucket: "avatars",
        path: ["user"],
      }),
    ).toEqual({
      path: ["user", "avatar-1.png"],
      url: "https://storage.example.test/user/avatar-1.png",
    });
    expect(upload).toHaveBeenCalledWith("user/avatar-1.png", file, {
      upsert: true,
      cacheControl: "3600",
    });
  });
  test("TUS retains session bearer, upsert, six MiB chunks and progress", async () => {
    const client = {
      auth: {
        getSession: async () => ({
          data: { session: { access_token: "fixture" } },
        }),
      },
    } as unknown as SupabaseClient;
    const file = new File(["abc"], "Receipt.pdf", { type: "application/pdf" });
    const onProgress = mock(() => {});
    const result = await uploadWithSupabaseTus(client, {
      file,
      bucket: "vault",
      path: ["team", "inbox"],
      onProgress,
    });
    expect(result).toEqual({
      filename: "receipt.pdf",
      file,
      key: "team/inbox/receipt.pdf",
      publicUrl: null,
    });
    expect(tusOptions.chunkSize).toBe(6 * 1024 * 1024);
    expect(tusOptions.headers).toEqual({
      authorization: "Bearer fixture",
      "x-upsert": "true",
    });
    expect(tusOptions.metadata.objectName).toBe("team/inbox/receipt.pdf");
    expect(onProgress).toHaveBeenCalledWith(3, 3);
  });
});
