import { job } from "@worker/core/job";
import { documentsQueue } from "@worker/queues/queues";
import convert from "heic-convert";
import sharp from "sharp";
import { z } from "zod";

const MAX_SIZE = 1500;

export const convertHeicJob = job(
  "convert-heic",
  z.object({
    filePath: z.array(z.string()),
  }),
  {
    queue: documentsQueue,
    attempts: 2,
    priority: 2, // Higher priority for image conversion
  },
  async ({ filePath }, ctx) => {
    ctx.logger.info("Converting HEIC to JPG", { filePath });

    const { data } = await ctx.supabase.storage
      .from("vault")
      .download(filePath.join("/"));

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
    const { data: uploadedData } = await ctx.supabase.storage
      .from("vault")
      .upload(filePath.join("/"), image, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (!uploadedData) {
      throw new Error("Failed to upload");
    }

    ctx.logger.info("Successfully converted HEIC to JPG", {
      filePath,
      uploadPath: uploadedData.path,
    });

    return {
      originalPath: filePath,
      convertedPath: uploadedData.path,
      size: image.length,
      contentType: "image/jpeg",
    };
  },
);
