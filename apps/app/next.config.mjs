import "./src/env.mjs";

/** @type {import("next").NextConfig} */
const config = {
	reactStrictMode: true,
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "lh3.googleusercontent.com",
			},
		],
	},
	transpilePackages: ["@midday/ui", "@midday/tailwind"],
	experimental: {
		serverActions: true,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
};

export default config;
