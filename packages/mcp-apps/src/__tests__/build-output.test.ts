import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST_DIR = join(import.meta.dir, "..", "..", "dist", "src", "views");

const VIEWS = ["invoice-preview.html"];

describe("build output", () => {
  for (const file of VIEWS) {
    const filePath = join(DIST_DIR, file);

    describe(file, () => {
      test("exists in dist", () => {
        expect(existsSync(filePath)).toBe(true);
      });

      test("is not empty", () => {
        if (!existsSync(filePath)) return;
        const stat = statSync(filePath);
        expect(stat.size).toBeGreaterThan(1000);
      });

      test("contains valid HTML structure", () => {
        if (!existsSync(filePath)) return;
        const html = readFileSync(filePath, "utf-8");
        expect(html).toContain("<html");
        expect(html).toContain("<script");
        expect(html).toContain("</html>");
      });

      test("is a self-contained single file (no external src references)", () => {
        if (!existsSync(filePath)) return;
        const html = readFileSync(filePath, "utf-8");
        const externalScripts =
          html.match(/<script[^>]+src=["'][^"']*["']/g) || [];
        const externalLinks =
          html.match(/<link[^>]+href=["'][^"']*\.(?:js|css)["']/g) || [];
        expect(externalScripts).toHaveLength(0);
        expect(externalLinks).toHaveLength(0);
      });
    });
  }
});
