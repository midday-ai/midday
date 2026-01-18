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
      "motion",
      "@midday/ui",
      "@radix-ui/react-icons",
      "lucide-react",
    ],
  },
  images: {
    loader: "custom",
    loaderFile: "./image-loader.ts",
    // Limit max image size to 1200px (displayed size is ~1248px)
    // Default: [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
    deviceSizes: [640, 750, 828, 1080, 1200],
    qualities: [50, 80],
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
