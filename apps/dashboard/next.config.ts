import { withSentryConfig } from "@sentry/nextjs";

/** @type {import("next").NextConfig} */
const config = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,

  // Use git commit SHA as build ID so all multi-region replicas share the same ID.
  // Without this, each replica generates a different build ID, causing
  // "Failed to find Server Action" errors when requests hit different replicas.
  generateBuildId: () =>
    process.env.RAILWAY_GIT_COMMIT_SHA || crypto.randomUUID(),
  deploymentId: process.env.RAILWAY_GIT_COMMIT_SHA,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "react-icons",
      "date-fns",
      "framer-motion",
      "recharts",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "usehooks-ts",
    ],
  },
  images: {
    loader: "custom",
    loaderFile: "./image-loader.ts",
    qualities: [80, 100],
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
  serverExternalPackages: ["@react-pdf/renderer", "pino"],
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

// Only apply Sentry configuration in production
const isProduction = process.env.NODE_ENV === "production";

// Resolve the release tag: prefer SENTRY_RELEASE, fall back to the Railway git SHA
const sentryRelease =
  process.env.SENTRY_RELEASE || process.env.RAILWAY_GIT_COMMIT_SHA;

export default isProduction
  ? withSentryConfig(config, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,

      // Only print logs for uploading source maps in CI
      silent: !process.env.CI,

      // Upload a larger set of source maps for prettier stack traces (includes app router chunks)
      widenClientFileUpload: true,

      // Tie uploaded source maps to the deploy's git SHA so Debug IDs match at runtime
      release: {
        name: sentryRelease,
      },

      // Delete source maps after upload so they aren't publicly accessible
      sourcemaps: {
        deleteSourcemapsAfterUpload: true,
      },

      // Webpack-specific settings (not supported with Turbopack)
      webpack: {
        // Tree-shake Sentry logger statements to reduce bundle size
        treeshake: {
          removeDebugLogging: true,
        },
        // Annotate React component names for clearer error boundaries in Sentry
        reactComponentAnnotation: {
          enabled: true,
        },
      },
    })
  : config;
