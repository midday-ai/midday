/** @type {import("next").NextConfig} */
const config = {
	reactStrictMode: true,
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
