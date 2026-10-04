import { z } from "zod";

const bucket = z.enum(["vault", "avatars", "apps"]);
export const createUploadUrlsSchema = z.object({
  bucket,
  files: z
    .array(
      z.object({
        path: z.array(z.string().min(1).max(255)).min(1).max(3),
        filename: z.string().min(1).max(255),
        contentType: z.string().min(1).max(200),
        size: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(25),
});
export const completeUploadsSchema = z.object({
  bucket,
  files: z
    .array(
      z.object({
        key: z.string().min(1).max(1024),
        receipt: z.string().min(1).max(4096),
      }),
    )
    .min(1)
    .max(25),
});
