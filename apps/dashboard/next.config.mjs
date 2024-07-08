import "./src/env.mjs";
import fs from "node:fs/promises";
import path from "node:path";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import("next").NextConfig} */
const config = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  transpilePackages: ["@midday/ui", "@midday/jobs", "@midday/tailwind"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    instrumentationHook: process.env.NODE_ENV === "production",
  },
  webpack: (config) => {
    /**
     * Critical: prevents " ⨯ ./node_modules/canvas/build/Release/canvas.node
     * Module parse failed: Unexpected character '�' (1:0)" error
     */
    config.resolve.alias.canvas = false;

    // You may not need this, it's just to support moduleResolution: 'node16'
    config.resolve.extensionAlias = {
      ".js": [".js", ".ts", ".tsx"],
    };

    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(config);

async function copyFiles() {
  try {
    await fs.access("public/");
  } catch {
    await fs.mkdir("public/", { recursive: true });
  }

  const wasmFiles = (
    await fs.readdir("../../node_modules/onnxruntime-web/dist/")
  ).filter((file) => path.extname(file) === ".wasm");

  await Promise.all([
    fs.copyFile(
      "../../node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js",
      "public/vad.worklet.bundle.min.js",
    ),
    fs.copyFile(
      "../../node_modules/@ricky0123/vad-web/dist/silero_vad.onnx",
      "public/silero_vad.onnx",
    ),
    ...wasmFiles.map((file) =>
      fs.copyFile(
        `../../node_modules/onnxruntime-web/dist/${file}`,
        `public/${file}`,
      ),
    ),
  ]);
}

copyFiles();
