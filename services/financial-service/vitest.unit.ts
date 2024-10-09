import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["./src/**/*.test.ts"],
        exclude: ["./src/integration/**", "./src/routes/**", "./src/benchmarks/**"],
        reporters: ["html", "verbose"],
        outputFile: "./.vitest/html",
        alias: {
            "@/": new URL("./src/", import.meta.url).pathname,
        },
    },
});