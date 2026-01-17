/** @type {import("next").NextConfig} */
const config = {
  poweredByHeader: false,
  reactStrictMode: true,
  trailingSlash: true,
  transpilePackages: ["@midday/ui", "@midday/tailwind", "next-mdx-remote"],
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    inlineCss: true,
    optimizePackageImports: ["react-icons", "framer-motion", "@midday/ui"],
  },
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
  async redirects() {
    return [
      {
        source: "/en/(.*)",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default config;
