import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@api": path.resolve(__dirname, "src"),
    },
  },
});
