import "./src/env.mjs";

import bundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";

// const withBundleAnalyzer = bundleAnalyzer({
//   enabled: process.env.ANALYZE === "true",
// });

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
    outputFileTracingExcludes: {
      "*": ["node_modules/canvas*"],
    },
  },
  // webpack: (config, { webpack }) => {
  //   config.plugins.push(
  //     new webpack.DefinePlugin({
  //       __SENTRY_DEBUG__: false,
  //       __SENTRY_TRACING__: false,
  //       __RRWEB_EXCLUDE_IFRAME__: true,
  //       __RRWEB_EXCLUDE_SHADOW_DOM__: true,
  //       __SENTRY_EXCLUDE_REPLAY_WORKER__: true,
  //     }),
  //   );

  //   return config;
  // },
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

export default withSentryConfig(config, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});
