import { describe, expect, test } from "bun:test";
import { uploadWithPresign } from "./upload";

describe("browser presigned upload", () => {
  test("sends folder-only path, signed headers and receipt; forwards progress and returns server key", async () => {
    const file = new File(["abc"], "Receipt.CSV", { type: "" });
    const calls: string[] = [];
    const progress: number[] = [];
    const result = await uploadWithPresign(
      {
        async createUploadUrls(input) {
          calls.push("presign");
          expect(input.files[0]).toEqual({
            path: ["team", "imports"],
            filename: "Receipt.CSV",
            contentType: "text/csv",
            size: 3,
          });
          return [
            {
              key: "team/imports/receipt.csv",
              url: "http://localhost:9000/signed",
              headers: { "Content-Type": "text/csv" },
              receipt: "signed-proof",
            },
          ];
        },
        async put(url, body, options) {
          calls.push("put");
          expect(url).toBe("http://localhost:9000/signed");
          expect(body).toBe(file);
          expect(options.headers).toEqual({ "Content-Type": "text/csv" });
          options.onProgress?.({ loaded: 2, total: 3, percent: 66 });
        },
        async completeUploads(input) {
          calls.push("complete");
          expect(input.files).toEqual([
            { key: "team/imports/receipt.csv", receipt: "signed-proof" },
          ]);
          return [{ key: "team/imports/receipt.csv", publicUrl: null }];
        },
      },
      {
        file,
        path: ["team", "imports"],
        bucket: "vault",
        onProgress: (loaded, total) => progress.push(loaded, total),
      },
    );
    expect(calls).toEqual(["presign", "put", "complete"]);
    expect(progress).toEqual([2, 3]);
    expect(result).toEqual({
      filename: "receipt.csv",
      file,
      key: "team/imports/receipt.csv",
      publicUrl: null,
    });
  });
  test("failed PUT never calls completion", async () => {
    let completed = false;
    await expect(
      uploadWithPresign(
        {
          async createUploadUrls() {
            return [
              {
                key: "logos/random.png",
                url: "http://localhost:9000/signed",
                headers: {},
                receipt: "proof",
              },
            ];
          },
          async put() {
            throw new Error("network error");
          },
          async completeUploads() {
            completed = true;
            return [];
          },
        },
        {
          file: new File(["x"], "logo.png", { type: "image/png" }),
          path: ["logos"],
          bucket: "apps",
        },
      ),
    ).rejects.toThrow("network error");
    expect(completed).toBe(false);
  });
});
