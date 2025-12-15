import { z } from "@hono/zod-openapi";

export const disconnectAppSchema = z.object({
  appId: z.string(),
});

export const updateAppSettingsSchema = z.object({
  appId: z.string(),
  option: z.object({
    id: z.string(),
    value: z.union([z.string(), z.number(), z.boolean()]),
  }),
});

export const removeWhatsAppConnectionSchema = z.object({
  phoneNumber: z.string(),
});

export const connectDropboxSchema = z.object({
  code: z.string(),
});

export const getDropboxFoldersSchema = z.object({
  connectionId: z.string().uuid(),
});

export const saveDropboxFoldersSchema = z.object({
  connectionId: z.string().uuid(),
  folders: z.array(z.string()),
});
