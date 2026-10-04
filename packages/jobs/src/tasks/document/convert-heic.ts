import { getDb } from "@jobs/init";
import { download } from "@midday/storage";
import { assertTeamKey } from "@midday/storage/keys";
import { uploadVaultObject } from "@midday/storage/vault";
import { schemaTask } from "@trigger.dev/sdk";
import convert from "heic-convert";
import sharp from "sharp";
import { z } from "zod";

const MAX_SIZE = 1500;

export const convertHeic = schemaTask({
  id: "convert-heic",
  machine: {
    preset: "large-1x",
  },
  schema: z.object({
    filePath: z.array(z.string()),
  }),
  run: async ({ filePath }) => {
    console.log("Converting HEIC to JPG");

    const teamId = filePath[0];
    if (!teamId || filePath.length < 2)
      throw new Error("Invalid vault file path");
    const key = assertTeamKey(teamId, filePath.join("/"));
    const data = await download("vault", key);

    if (!data) {
      throw new Error("File not found");
    }

    const buffer = await data.arrayBuffer();

    const decodedImage = await convert({
      // @ts-expect-error
      buffer: new Uint8Array(buffer),
      format: "JPEG",
      quality: 1,
    });

    const image = await sharp(decodedImage)
      .rotate()
      .resize({ width: MAX_SIZE })
      .toFormat("jpeg")
      .toBuffer();

    // Upload the converted image with .jpg extension
    const uploadedData = await uploadVaultObject(getDb(), {
      teamId,
      key,
      body: image,
      contentType: "image/jpeg",
    });

    if (!uploadedData) {
      throw new Error("Failed to upload");
    }

    return uploadedData;
  },
});
