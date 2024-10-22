import { defineConfig } from "tsup";
import path from 'path';

export default defineConfig({
  entry: ["src/index.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  format: ["cjs", "esm"],
  external: ["react", "react-dom"],
  esbuildOptions(options) {
    options.alias = {
      '@': path.resolve(__dirname, './src'),
    };
  },
});
