import { z } from "zod";

export const updateUserSchema = z.object({
  full_name: z.string().min(2).max(32).optional(),
  avatar_url: z.string().url().optional(),
  locale: z.string().optional(),
  revalidatePath: z.string().optional(),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

export const updateTeamSchema = z.object({
  name: z.string().min(2).max(32).optional(),
  logo_url: z.string().url().optional(),
  revalidatePath: z.string(),
});

export type UpdateTeamFormValues = z.infer<typeof updateTeamSchema>;

export const deleteBankAccountSchema = z.object({
  id: z.string().uuid(),
  revalidatePath: z.string(),
});

export type DeleteBankAccountFormValues = z.infer<
  typeof deleteBankAccountSchema
>;

export const updateSubscriberPreferenceSchema = z.object({
  templateId: z.string(),
  teamId: z.string(),
  revalidatePath: z.string(),
  subscriberId: z.string(),
  type: z.string(),
  enabled: z.boolean(),
});

export const changeSpendingPeriodSchema = z.object({
  id: z.string(),
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export const changeChartTypeSchema = z.enum(["profit_loss", "income"]);
export const changeChartPeriodSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const changeTransactionsPeriodSchema = z.enum([
  "all",
  "income",
  "expense",
]);

export const createAttachmentsSchema = z.array(
  z.object({
    path: z.string(),
    name: z.string(),
    size: z.number(),
    transaction_id: z.string(),
    type: z.string(),
  })
);

export const deleteAttachmentSchema = z.string();

export const exportTransactionsSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});

export const deleteFileSchema = z.object({
  id: z.string(),
  path: z.array(z.string()),
});

export const deleteFolderSchema = z.object({
  path: z.array(z.string()),
});

export const createFolderSchema = z.object({
  path: z.string(),
  name: z.string(),
});

export const unenrollMfaSchema = z.object({
  factorId: z.string(),
});

export const mfaVerifySchema = z.object({
  factorId: z.string(),
  challengeId: z.string(),
  code: z.string(),
});

export const shareFileSchema = z.object({
  filepath: z.string(),
  expireIn: z.number(),
});
