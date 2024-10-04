import { randomUUID } from "node:crypto";
import path from "node:path";
import url from "node:url";
import { build as esbuild } from "esbuild";

const srcPath = path.join(process.cwd(), "src");
const buildPath = path.join(process.cwd(), "build");

async function build() {
	const buildId = randomUUID().replace(/-/g, "");

	return await esbuild({
		platform: "node",
		target: "node21",
		format: "esm",
		nodePaths: [srcPath],
		sourcemap: true,
		external: [],
		bundle: true,
		entryPoints: [path.join(srcPath, "index.ts")],
		banner: {
			js: `
            import { createRequire as createRequire${buildId} } from 'module';
            import { fileURLToPath as fileURLToPath${buildId} } from 'url';
            import { dirname as dirname${buildId} } from 'path';

            // using var here to allow subsequent override by authors of this
            // library that would be using the same ESM trick
            var require = createRequire${buildId}(import.meta.url);
            var __filename = fileURLToPath${buildId}(import.meta.url);
            var __dirname = dirname${buildId}(__filename);
      `,
		},
		outdir: buildPath,
	});
}

if (import.meta.url.startsWith("file:")) {
	if (process.argv[1] === url.fileURLToPath(import.meta.url)) {
		await build();
	}
}
