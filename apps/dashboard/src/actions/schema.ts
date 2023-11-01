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
