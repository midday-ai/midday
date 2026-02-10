import { describe, expect, test } from "bun:test";
import {
  ensureFileExtension,
  PROVIDER_ATTACHMENT_CONFIG,
  resolveMimeType,
} from "./utils";

describe("resolveMimeType", () => {
  // Create test buffers with proper magic bytes
  const createPdfBuffer = () => Buffer.from("%PDF-1.4 test content");
  const createJpegBuffer = () =>
    Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  const createPngBuffer = () =>
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const createGifBuffer = () => Buffer.from("GIF89a test content");
  const createTiffLeBuffer = () => Buffer.from([0x49, 0x49, 0x2a, 0x00]);
  const createTiffBeBuffer = () => Buffer.from([0x4d, 0x4d, 0x00, 0x2a]);
  const createBmpBuffer = () => Buffer.from([0x42, 0x4d, 0x00, 0x00]);
  const createWebpBuffer = () => {
    const buf = Buffer.alloc(12);
    buf.write("RIFF", 0);
    buf.write("WEBP", 8);
    return buf;
  };
  const createUnknownBuffer = () => Buffer.from("unknown content");

  describe("stored type resolution", () => {
    test("returns stored type if valid and supported by provider", () => {
      const result = resolveMimeType(
        "application/pdf",
        "file.pdf",
        createPdfBuffer(),
        "quickbooks",
      );
      expect(result.mimeType).toBe("application/pdf");
      expect(result.source).toBe("stored");
    });

    test("returns stored image/jpeg if supported", () => {
      const result = resolveMimeType(
        "image/jpeg",
        "photo.jpg",
        createJpegBuffer(),
        "fortnox",
      );
      expect(result.mimeType).toBe("image/jpeg");
      expect(result.source).toBe("stored");
    });

    test("returns stored image/png if supported", () => {
      const result = resolveMimeType(
        "image/png",
        "image.png",
        createPngBuffer(),
        "xero",
      );
      expect(result.mimeType).toBe("image/png");
      expect(result.source).toBe("stored");
    });
  });

  describe("extension inference", () => {
    test("infers from file extension if stored type is invalid", () => {
      const result = resolveMimeType(
        "application/octet-stream",
        "receipt.pdf",
        createPdfBuffer(),
        "quickbooks",
      );
      expect(result.mimeType).toBe("application/pdf");
      expect(result.source).toBe("extension");
    });

    test("infers jpeg from .jpg extension", () => {
      const result = resolveMimeType(
        null,
        "photo.jpg",
        createJpegBuffer(),
        "fortnox",
      );
      expect(result.mimeType).toBe("image/jpeg");
      expect(result.source).toBe("extension");
    });

    test("infers jpeg from .jpeg extension", () => {
      const result = resolveMimeType(
        null,
        "photo.JPEG",
        createJpegBuffer(),
        "xero",
      );
      expect(result.mimeType).toBe("image/jpeg");
      expect(result.source).toBe("extension");
    });

    test("infers gif from .gif extension (xero)", () => {
      const result = resolveMimeType(
        null,
        "animation.gif",
        createGifBuffer(),
        "xero",
      );
      expect(result.mimeType).toBe("image/gif");
      expect(result.source).toBe("extension");
    });
  });

  describe("buffer magic byte detection", () => {
    test("detects PDF from magic bytes", () => {
      const result = resolveMimeType(
        null,
        null,
        createPdfBuffer(),
        "quickbooks",
      );
      expect(result.mimeType).toBe("application/pdf");
      expect(result.source).toBe("buffer");
    });

    test("detects JPEG from magic bytes", () => {
      const result = resolveMimeType(null, null, createJpegBuffer(), "fortnox");
      expect(result.mimeType).toBe("image/jpeg");
      expect(result.source).toBe("buffer");
    });

    test("detects PNG from magic bytes", () => {
      const result = resolveMimeType(null, null, createPngBuffer(), "xero");
      expect(result.mimeType).toBe("image/png");
      expect(result.source).toBe("buffer");
    });

    test("detects GIF from magic bytes (GIF89a)", () => {
      const result = resolveMimeType(
        null,
        null,
        createGifBuffer(),
        "quickbooks",
      );
      expect(result.mimeType).toBe("image/gif");
      expect(result.source).toBe("buffer");
    });

    test("detects GIF from magic bytes (GIF87a)", () => {
      const result = resolveMimeType(
        null,
        null,
        Buffer.from("GIF87a test"),
        "quickbooks",
      );
      expect(result.mimeType).toBe("image/gif");
      expect(result.source).toBe("buffer");
    });

    test("detects TIFF little-endian from magic bytes", () => {
      const result = resolveMimeType(
        null,
        null,
        createTiffLeBuffer(),
        "quickbooks",
      );
      expect(result.mimeType).toBe("image/tiff");
      expect(result.source).toBe("buffer");
    });

    test("detects TIFF big-endian from magic bytes", () => {
      const result = resolveMimeType(
        null,
        null,
        createTiffBeBuffer(),
        "quickbooks",
      );
      expect(result.mimeType).toBe("image/tiff");
      expect(result.source).toBe("buffer");
    });

    test("detects BMP from magic bytes", () => {
      const result = resolveMimeType(
        null,
        null,
        createBmpBuffer(),
        "quickbooks",
      );
      expect(result.mimeType).toBe("image/bmp");
      expect(result.source).toBe("buffer");
    });

    test("detects WebP from magic bytes", () => {
      // WebP is not supported by any provider, so this should fail
      const result = resolveMimeType(
        null,
        null,
        createWebpBuffer(),
        "quickbooks",
      );
      expect(result.mimeType).toBe(null);
      expect(result.source).toBe("failed");
      expect(result.error).toContain("not supported");
    });
  });

  describe("unsupported type handling", () => {
    test("returns error for unsupported types", () => {
      const result = resolveMimeType(
        "image/gif",
        "animation.gif",
        createGifBuffer(),
        "fortnox", // Fortnox doesn't support GIF
      );
      expect(result.mimeType).toBe(null);
      expect(result.source).toBe("failed");
      expect(result.error).toContain("not supported by fortnox");
    });

    test("returns error for TIFF on Xero", () => {
      const result = resolveMimeType(
        "image/tiff",
        "scan.tiff",
        createTiffLeBuffer(),
        "xero",
      );
      expect(result.mimeType).toBe(null);
      expect(result.source).toBe("failed");
      expect(result.error).toContain("not supported by xero");
    });

    test("returns error for BMP on Fortnox", () => {
      const result = resolveMimeType(
        "image/bmp",
        "image.bmp",
        createBmpBuffer(),
        "fortnox",
      );
      expect(result.mimeType).toBe(null);
      expect(result.source).toBe("failed");
      expect(result.error).toContain("not supported by fortnox");
    });

    test("returns error when type cannot be determined", () => {
      const result = resolveMimeType(
        null,
        null,
        createUnknownBuffer(),
        "quickbooks",
      );
      expect(result.mimeType).toBe(null);
      expect(result.source).toBe("failed");
      expect(result.error).toBe("Could not determine file type");
    });
  });

  describe("provider-specific supported types", () => {
    test("fortnox supports PDF, JPEG, PNG only", () => {
      // Supported
      expect(
        resolveMimeType("application/pdf", null, createPdfBuffer(), "fortnox")
          .mimeType,
      ).toBe("application/pdf");
      expect(
        resolveMimeType("image/jpeg", null, createJpegBuffer(), "fortnox")
          .mimeType,
      ).toBe("image/jpeg");
      expect(
        resolveMimeType("image/png", null, createPngBuffer(), "fortnox")
          .mimeType,
      ).toBe("image/png");

      // Not supported
      expect(
        resolveMimeType("image/gif", null, createGifBuffer(), "fortnox")
          .mimeType,
      ).toBe(null);
    });

    test("xero supports PDF, JPEG, PNG, GIF", () => {
      // Supported
      expect(
        resolveMimeType("application/pdf", null, createPdfBuffer(), "xero")
          .mimeType,
      ).toBe("application/pdf");
      expect(
        resolveMimeType("image/jpeg", null, createJpegBuffer(), "xero")
          .mimeType,
      ).toBe("image/jpeg");
      expect(
        resolveMimeType("image/png", null, createPngBuffer(), "xero").mimeType,
      ).toBe("image/png");
      expect(
        resolveMimeType("image/gif", null, createGifBuffer(), "xero").mimeType,
      ).toBe("image/gif");

      // Not supported
      expect(
        resolveMimeType("image/tiff", null, createTiffLeBuffer(), "xero")
          .mimeType,
      ).toBe(null);
    });

    test("quickbooks supports PDF, JPEG, PNG, GIF, TIFF, BMP", () => {
      // All supported
      expect(
        resolveMimeType(
          "application/pdf",
          null,
          createPdfBuffer(),
          "quickbooks",
        ).mimeType,
      ).toBe("application/pdf");
      expect(
        resolveMimeType("image/jpeg", null, createJpegBuffer(), "quickbooks")
          .mimeType,
      ).toBe("image/jpeg");
      expect(
        resolveMimeType("image/png", null, createPngBuffer(), "quickbooks")
          .mimeType,
      ).toBe("image/png");
      expect(
        resolveMimeType("image/gif", null, createGifBuffer(), "quickbooks")
          .mimeType,
      ).toBe("image/gif");
      expect(
        resolveMimeType("image/tiff", null, createTiffLeBuffer(), "quickbooks")
          .mimeType,
      ).toBe("image/tiff");
      expect(
        resolveMimeType("image/bmp", null, createBmpBuffer(), "quickbooks")
          .mimeType,
      ).toBe("image/bmp");
    });
  });

  describe("edge cases", () => {
    test("handles empty buffer", () => {
      const result = resolveMimeType(null, null, Buffer.from([]), "quickbooks");
      expect(result.mimeType).toBe(null);
      expect(result.source).toBe("failed");
    });

    test("handles very small buffer", () => {
      const result = resolveMimeType(null, null, Buffer.from([0x00]), "xero");
      expect(result.mimeType).toBe(null);
      expect(result.source).toBe("failed");
    });

    test("prioritizes stored type over extension", () => {
      // Stored type is valid, should use it even if extension differs
      const result = resolveMimeType(
        "image/png",
        "file.jpg",
        createPngBuffer(),
        "fortnox",
      );
      expect(result.mimeType).toBe("image/png");
      expect(result.source).toBe("stored");
    });

    test("prioritizes extension over buffer when stored type invalid", () => {
      const result = resolveMimeType(
        "application/octet-stream",
        "receipt.pdf",
        createPdfBuffer(),
        "quickbooks",
      );
      expect(result.source).toBe("extension");
    });

    test("handles case-insensitive extensions", () => {
      const result = resolveMimeType(
        null,
        "RECEIPT.PDF",
        createPdfBuffer(),
        "fortnox",
      );
      expect(result.mimeType).toBe("application/pdf");
      expect(result.source).toBe("extension");
    });
  });
});

describe("PROVIDER_ATTACHMENT_CONFIG", () => {
  test("fortnox supports PDF, JPEG, PNG", () => {
    const config = PROVIDER_ATTACHMENT_CONFIG.fortnox;
    expect(config.supportedTypes.has("application/pdf")).toBe(true);
    expect(config.supportedTypes.has("image/jpeg")).toBe(true);
    expect(config.supportedTypes.has("image/png")).toBe(true);
    expect(config.supportedTypes.has("image/gif")).toBe(false);
    expect(config.supportedTypes.has("image/tiff")).toBe(false);
    expect(config.supportedTypes.has("image/bmp")).toBe(false);
  });

  test("xero supports PDF, JPEG, PNG, GIF", () => {
    const config = PROVIDER_ATTACHMENT_CONFIG.xero;
    expect(config.supportedTypes.has("application/pdf")).toBe(true);
    expect(config.supportedTypes.has("image/jpeg")).toBe(true);
    expect(config.supportedTypes.has("image/png")).toBe(true);
    expect(config.supportedTypes.has("image/gif")).toBe(true);
    expect(config.supportedTypes.has("image/tiff")).toBe(false);
    expect(config.supportedTypes.has("image/bmp")).toBe(false);
  });

  test("quickbooks supports PDF, JPEG, PNG, GIF, TIFF, BMP", () => {
    const config = PROVIDER_ATTACHMENT_CONFIG.quickbooks;
    expect(config.supportedTypes.has("application/pdf")).toBe(true);
    expect(config.supportedTypes.has("image/jpeg")).toBe(true);
    expect(config.supportedTypes.has("image/png")).toBe(true);
    expect(config.supportedTypes.has("image/gif")).toBe(true);
    expect(config.supportedTypes.has("image/tiff")).toBe(true);
    expect(config.supportedTypes.has("image/bmp")).toBe(true);
  });

  test("fortnox max size is 10 MB", () => {
    expect(PROVIDER_ATTACHMENT_CONFIG.fortnox.maxSizeBytes).toBe(
      10 * 1024 * 1024,
    );
  });

  test("xero max size is 3 MB", () => {
    expect(PROVIDER_ATTACHMENT_CONFIG.xero.maxSizeBytes).toBe(3 * 1024 * 1024);
  });

  test("quickbooks max size is 20 MB", () => {
    expect(PROVIDER_ATTACHMENT_CONFIG.quickbooks.maxSizeBytes).toBe(
      20 * 1024 * 1024,
    );
  });
});

describe("ensureFileExtension", () => {
  test("returns unchanged if filename has valid extension", () => {
    expect(ensureFileExtension("invoice.pdf", "application/pdf")).toBe(
      "invoice.pdf",
    );
    expect(ensureFileExtension("receipt.jpg", "image/jpeg")).toBe(
      "receipt.jpg",
    );
    expect(ensureFileExtension("scan.png", "image/png")).toBe("scan.png");
  });

  test("adds extension based on MIME type", () => {
    expect(ensureFileExtension("invoice", "application/pdf")).toBe(
      "invoice.pdf",
    );
    expect(ensureFileExtension("receipt", "image/jpeg")).toBe("receipt.jpg");
    expect(ensureFileExtension("scan", "image/png")).toBe("scan.png");
  });

  test("removes trailing dots before adding extension", () => {
    expect(ensureFileExtension("vercel-inc.", "application/pdf")).toBe(
      "vercel-inc.pdf",
    );
    expect(ensureFileExtension("file..", "image/jpeg")).toBe("file.jpg");
    expect(ensureFileExtension("name...", "image/png")).toBe("name.png");
  });

  test("defaults to .pdf for unknown MIME types", () => {
    expect(ensureFileExtension("file", "unknown/type")).toBe("file.pdf");
    expect(ensureFileExtension("document", "application/octet-stream")).toBe(
      "document.pdf",
    );
  });

  test("handles various MIME types correctly", () => {
    expect(ensureFileExtension("doc", "image/gif")).toBe("doc.gif");
    expect(ensureFileExtension("doc", "image/webp")).toBe("doc.webp");
    expect(ensureFileExtension("doc", "text/plain")).toBe("doc.txt");
    expect(ensureFileExtension("doc", "text/csv")).toBe("doc.csv");
  });

  test("handles image/jpg as image/jpeg alias", () => {
    expect(ensureFileExtension("photo", "image/jpg")).toBe("photo.jpg");
  });

  test("preserves existing valid extensions (2-5 chars)", () => {
    expect(ensureFileExtension("file.docx", "application/pdf")).toBe(
      "file.docx",
    );
    expect(ensureFileExtension("file.xlsx", "image/jpeg")).toBe("file.xlsx");
    expect(ensureFileExtension("file.tiff", "image/png")).toBe("file.tiff");
  });
});
