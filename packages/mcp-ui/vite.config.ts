import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Chart names for building standalone HTML bundles
const chartNames = [
  "spending-chart",
  "cash-flow-chart",
  "burn-rate-chart",
  "revenue-chart",
  "profit-chart",
  "runway-gauge",
  "forecast-chart",
  "growth-rate-chart",
  "profit-margin-chart",
  "invoice-status-chart",
];

// Get the chart to build from environment variable (for building one at a time)
const chartToBuild = process.env.CHART;

// Default config for single-chart builds
export default defineConfig(({ command, mode }) => {
  // Dev server mode - serve the dev playground
  if (command === "serve") {
    return {
      plugins: [react()],
      root: resolve(__dirname, "dev"),
      resolve: {
        alias: {
          "@": resolve(__dirname, "src"),
        },
      },
      server: {
        port: 3333,
        open: true,
      },
      css: {
        postcss: resolve(__dirname, "postcss.config.js"),
      },
    };
  }

  // If building a specific chart bundle
  if (chartToBuild && chartNames.includes(chartToBuild)) {
    return {
      plugins: [react(), viteSingleFile()],
      resolve: {
        alias: {
          "@": resolve(__dirname, "src"),
        },
      },
      build: {
        outDir: `dist/bundles`,
        emptyOutDir: false,
        rollupOptions: {
          input: resolve(__dirname, `src/apps/entries/${chartToBuild}.html`),
          output: {
            entryFileNames: `[name].js`,
            chunkFileNames: `[name].js`,
            assetFileNames: `[name].[ext]`,
          },
        },
        // Inline all assets for single-file output
        assetsInlineLimit: Number.POSITIVE_INFINITY,
        cssCodeSplit: false,
      },
      css: {
        postcss: "./postcss.config.js",
      },
    };
  }

  // Default: library build
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      lib: {
        entry: {
          index: resolve(__dirname, "src/index.ts"),
          apps: resolve(__dirname, "src/apps/index.ts"),
          components: resolve(__dirname, "src/components/index.ts"),
          utils: resolve(__dirname, "src/utils/index.ts"),
        },
        formats: ["es"],
      },
      rollupOptions: {
        external: [
          "react",
          "react-dom",
          "recharts",
          "@mcp-ui/server",
          "@modelcontextprotocol/sdk",
        ],
      },
    },
    css: {
      postcss: "./postcss.config.js",
    },
  };
});
