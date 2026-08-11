import { sanitizeRedirectPath } from "./sanitize-redirect";

describe("sanitizeRedirectPath utility (packages/utils)", () => {
  it("allows safe root-relative path", () => {
    expect(sanitizeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/overview?period=monthly")).toBe("/overview?period=monthly");
  });

  it("rejects protocol-relative URLs starting with //", () => {
    expect(sanitizeRedirectPath("//evil.com")).toBe("/");
    expect(sanitizeRedirectPath("//evil.com/phish")).toBe("/");
  });

  it("rejects absolute URLs with protocol schemes", () => {
    expect(sanitizeRedirectPath("https://evil.com")).toBe("/");
    expect(sanitizeRedirectPath("javascript:alert(1)")).toBe("/");
  });

  it("returns fallback path when provided", () => {
    expect(sanitizeRedirectPath("https://evil.com", "/welcome")).toBe("/welcome");
  });

  it("handles malformed URI components gracefully", () => {
    expect(sanitizeRedirectPath("%E0%A4%A", "/fallback")).toBe("/fallback");
  });
});
