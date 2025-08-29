import { withSentryConfig } from "@sentry/nextjs";

/** @type {import("next").NextConfig} */
const config = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    loader: "custom",
    loaderFile: "./image-loader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  transpilePackages: [
    "@midday/ui",
    "@midday/tailwind",
    "@midday/invoice",
    "@midday/api",
  ],
  serverExternalPackages: ["@react-pdf/renderer", "pdfjs-dist"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/((?!api/proxy).*)",
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

export default withSentryConfig(config, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  telemetry: false,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload source maps for better stack traces
  widenClientFileUpload: true,

  // Tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
});
