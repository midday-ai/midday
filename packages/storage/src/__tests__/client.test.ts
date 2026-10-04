import { afterEach, describe, expect, test } from "bun:test";
import { putWithProgress } from "../client";

class FakeXHR {
  static last: FakeXHR;
  method = "";
  url = "";
  status = 0;
  headers: Record<string, string> = {};
  upload: {
    onprogress?: (event: {
      loaded: number;
      total: number;
      lengthComputable: boolean;
    }) => void;
  } = {};
  onload?: () => void;
  onerror?: () => void;
  onabort?: () => void;
  sent?: Blob;
  constructor() {
    FakeXHR.last = this;
  }
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }
  send(body: Blob) {
    this.sent = body;
  }
  abort() {
    this.onabort?.();
  }
}
const originalXHR = globalThis.XMLHttpRequest;
afterEach(() => {
  globalThis.XMLHttpRequest = originalXHR;
});
function installXHR() {
  globalThis.XMLHttpRequest = FakeXHR as unknown as typeof XMLHttpRequest;
}

describe("browser upload transport", () => {
  test("uses signing headers, reports progress, succeeds only after HTTP response", async () => {
    installXHR();
    const file = new Blob(["1234"]);
    const progress: number[] = [];
    const pending = putWithProgress("http://localhost:9000/test", file, {
      headers: {
        "Content-Type": "application/pdf",
        "x-amz-meta-test": "proof",
      },
      onProgress: (event) => progress.push(event.percent),
    });
    const xhr = FakeXHR.last;
    expect(xhr.method).toBe("PUT");
    expect(xhr.headers).toEqual({
      "Content-Type": "application/pdf",
      "x-amz-meta-test": "proof",
    });
    expect(xhr.sent).toBe(file);
    xhr.upload.onprogress?.({ loaded: 2, total: 4, lengthComputable: true });
    xhr.status = 200;
    xhr.onload?.();
    await pending;
    expect(progress).toEqual([50, 100]);
  });
  test("rejects HTTP and network failures", async () => {
    installXHR();
    const http = putWithProgress("http://localhost/test", new Blob(), {
      headers: {},
    });
    FakeXHR.last.status = 403;
    FakeXHR.last.onload?.();
    await expect(http).rejects.toThrow("403");
    const network = putWithProgress("http://localhost/test", new Blob(), {
      headers: {},
    });
    FakeXHR.last.onerror?.();
    await expect(network).rejects.toThrow("network");
  });
  test("aborts before or during upload", async () => {
    installXHR();
    const prior = AbortSignal.abort();
    await expect(
      putWithProgress("http://localhost/test", new Blob(), {
        headers: {},
        signal: prior,
      }),
    ).rejects.toHaveProperty("name", "AbortError");
    const controller = new AbortController();
    const pending = putWithProgress("http://localhost/test", new Blob(), {
      headers: {},
      signal: controller.signal,
    });
    controller.abort();
    await expect(pending).rejects.toHaveProperty("name", "AbortError");
  });
});
