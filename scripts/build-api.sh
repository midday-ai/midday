#!/bin/bash
bun build api/index.ts --outdir=.vercel/output/functions/api/index.func --target=node --minify
echo '{"runtime":"nodejs20.x","handler":"index.js","launcherType":"Nodejs"}' > .vercel/output/functions/api/index.func/.vc-config.json
mkdir -p .vercel/output/static
echo '{"version":3,"routes":[{"src":"/(.*)", "dest":"/api/index"}]}' > .vercel/output/config.json