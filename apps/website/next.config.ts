/** @type {import("next").NextConfig} */
const config = {
  poweredByHeader: false,
  reactStrictMode: true,
  trailingSlash: true,
  transpilePackages: [
    "@midday/ui",
    "@midday/tailwind",
    "@midday/app-store",
    "next-mdx-remote",
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    inlineCss: true,
    optimizePackageImports: [
      "react-icons",
      "framer-motion",
      "motion",
      "@midday/ui",
      "@radix-ui/react-icons",
      "lucide-react",
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
