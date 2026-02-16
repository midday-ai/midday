/**
 * Quick test: fetch GoCardless institutions and sync 10 logos to R2.
 *
 * Usage:
 *   cd packages/db/src/scripts
 *   bun run test-sync-logos.ts
 */

import { S3Client } from "bun";
import {
  GoCardLessApi,
  getFileExtension,
  getLogoURL,
} from "@midday/banking";

const r2 = new S3Client({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.R2_ACCESS_KEY_ID!,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  bucket: process.env.R2_BUCKET_NAME!,
});

async function main() {
  console.log("Fetching GoCardless institutions...");

  const api = new GoCardLessApi();
  const data = await api.getInstitutions();

  console.log(`Fetched ${data.length} GoCardless institutions.\n`);

  const sample = data.slice(0, 10);

  for (const inst of sample) {
    const ext = getFileExtension(inst.logo);
    const key = `${inst.id}.${ext}`;

    console.log(`${inst.name} (${key}):`);

    try {
      const exists = await r2.exists(key);
      console.log(`  R2 exists: ${exists}`);

      if (!exists) {
        console.log(`  Downloading from: ${inst.logo}`);
        const response = await fetch(inst.logo);
        console.log(`  Download status: ${response.status}`);

        if (response.ok) {
          const buffer = new Uint8Array(await response.arrayBuffer());
          const contentType = ext === "png" ? "image/png" : "image/jpeg";
          console.log(`  Uploading ${buffer.length} bytes as ${contentType}...`);
          await r2.write(key, buffer, { type: contentType });
          console.log(`  Uploaded!`);
        }
      }
    } catch (error) {
      console.error(`  Error:`, error);
    }
    console.log();
  }

  console.log("Done!");
}

main().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
