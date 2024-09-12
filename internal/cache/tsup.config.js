import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    middleware: "src/middleware/index.ts",
    stores: "src/stores/index.ts",
  },
  format: ["cjs", "esm"],
  treeshake: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  bundle: true,
  dts: true,
});
