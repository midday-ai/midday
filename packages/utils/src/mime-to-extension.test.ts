import { ensureFileExtension, getExtensionFromMimeType } from "./mime-to-extension";

describe("mime-to-extension utility (packages/utils)", () => {
  it("resolves document mime types to extension", () => {
    expect(getExtensionFromMimeType("application/pdf")).toBe(".pdf");
    expect(getExtensionFromMimeType("text/csv")).toBe(".csv");
  });

  it("resolves modern image and media mime types to extension", () => {
    expect(getExtensionFromMimeType("image/webp")).toBe(".webp");
    expect(getExtensionFromMimeType("image/avif")).toBe(".avif");
    expect(getExtensionFromMimeType("audio/mpeg")).toBe(".mp3");
    expect(getExtensionFromMimeType("video/mp4")).toBe(".mp4");
  });

  it("appends correct extension to raw filename when missing", () => {
    expect(ensureFileExtension("invoice_100", "application/pdf")).toBe("invoice_100.pdf");
    expect(ensureFileExtension("receipt_photo", "image/png")).toBe("receipt_photo.png");
  });

  it("preserves existing filename extension when already present", () => {
    expect(ensureFileExtension("statement.csv", "text/csv")).toBe("statement.csv");
  });
});
