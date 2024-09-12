import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: ["default"],
    alias: {
      "@/": new URL("./src/", import.meta.url).pathname,
    },
  },
});
