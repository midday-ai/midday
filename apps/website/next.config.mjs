/** @type {import("next").NextConfig} */
const config = {
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@midday/ui", "@midday/tailwind", "next-mdx-remote"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
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
      {
        source: "/public-beta",
        destination: "/",
        permanent: true,
      },
      {
        source: "/pitch",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default config;
