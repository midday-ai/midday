/** @type {import("next").NextConfig} */
const config = {
  poweredByHeader: false,
  reactStrictMode: true,
  trailingSlash: true,
  transpilePackages: ["@midday/ui", "@midday/tailwind", "next-mdx-remote"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    inlineCss: true,
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
        source: "/.well-known/microsoft-identity-association.json",
        destination: "/api/.well-known/microsoft-identity-association",
        permanent: false,
      },
      {
        source: "/.well-known/security.txt",
        destination: "/api/.well-known/security",
        permanent: false,
      },
      {
        source: "/en/(.*)",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default config;
