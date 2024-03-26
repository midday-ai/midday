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
};

export default config;
