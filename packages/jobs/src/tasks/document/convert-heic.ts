import { createClient } from "@midday/supabase/job";
import { schemaTask } from "@trigger.dev/sdk/v3";
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
    file_path: z.array(z.string()),
  }),
  run: async ({ file_path }) => {
    const supabase = createClient();

    console.log("Converting HEIC to JPG");

    const { data } = await supabase.storage
      .from("vault")
      .download(file_path.join("/"));

    if (!data) {
      throw new Error("File not found");
    }

    const buffer = await data.arrayBuffer();

    const decodedImage = await convert({
      // @ts-ignore
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
    const { data: uploadedData } = await supabase.storage
      .from("vault")
      .upload(file_path.join("/"), image, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (!uploadedData) {
      throw new Error("Failed to upload");
    }

    return uploadedData;
  },
});
