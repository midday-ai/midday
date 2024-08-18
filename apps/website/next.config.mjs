/** @type {import("next").NextConfig} */
const config = {
  poweredByHeader: false,
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
  experimental: {
    ppr: true,
  },
  async redirects() {
    return [
      {
        source: "/en/(.*)",
        destination: "/",
        permanent: true,
      },
      {
        source: "/public-beta",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default config;
