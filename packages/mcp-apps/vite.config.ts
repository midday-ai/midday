import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type PluginOption } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const INPUT = process.env.INPUT;

export default defineConfig(({ command }) => {
  if (command === "serve") {
    return {
      plugins: [react()] as PluginOption[],
      root: resolve(__dirname, "src/dev"),
    };
  }

  if (!INPUT) {
    throw new Error(
      "INPUT environment variable is required (e.g. INPUT=invoice-preview)",
    );
  }

  return {
    plugins: [react(), viteSingleFile()] as PluginOption[],
    build: {
      outDir: "dist",
      emptyOutDir: false,
      rollupOptions: {
        input: resolve(__dirname, `src/views/${INPUT}.html`),
      },
    },
  };
});
