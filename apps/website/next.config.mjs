/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ["@midday/ui", "@midday/tailwind"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // NOTE: We only support en language for now so we don't need the middleware for rewrites
  // Remove this once we have more languages, this also enable cached pages
  async rewrites() {
    return [
      {
        source: "/:path*",
        destination: "/en/:path*",
      },
    ];
  },
};

export default config;
