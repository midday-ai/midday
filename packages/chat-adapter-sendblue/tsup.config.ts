import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: false,
  clean: true,
  sourcemap: true,
  tsconfig: "tsconfig.build.json",
  external: ["chat", "sendblue"],
});
