import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["bin/midday.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist/bin",
  clean: true,
  splitting: false,
  sourcemap: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
