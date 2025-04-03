import { resend } from "@/utils/resend";
import { deleteUser, updateUser } from "@midday/supabase/mutations";
import { getUserInvitesQuery, getUserQuery } from "@midday/supabase/queries";
import { z } from "zod";
import { protectedProcedure } from "../init";
import { createTRPCRouter } from "../init";

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx: { supabase, session } }) => {
    const { data } = await getUserQuery(supabase, session.user.id);

    return data;
  }),

  update: protectedProcedure
    .input(
      z.object({
        full_name: z.string().min(2).max(32).optional(),
        email: z.string().email().optional(),
        avatar_url: z.string().url().optional(),
        locale: z.string().optional(),
        week_starts_on_monday: z.boolean().optional(),
        timezone: z.string().optional(),
        time_format: z.number().optional(),
        date_format: z
          .enum(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"])
          .optional(),
      }),
    )
    .mutation(async ({ ctx: { supabase, session }, input }) => {
      const { data } = await updateUser(supabase, {
        id: session.user.id,
        ...input,
      });

      return data;
    }),

  delete: protectedProcedure.mutation(
    async ({ ctx: { supabase, session } }) => {
      await deleteUser(supabase, {
        id: session.user.id,
      });

      // Remove user from resend audience
      await resend.contacts.remove({
        email: session.user.email!,
        audienceId: process.env.RESEND_AUDIENCE_ID!,
      });
    },
  ),

  invites: protectedProcedure.query(async ({ ctx: { supabase, session } }) => {
    if (!session.user.email) {
      return [];
    }

    const { data } = await getUserInvitesQuery(supabase, session.user.email);

    return data;
  }),
});
