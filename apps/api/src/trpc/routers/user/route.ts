import { getUserInvites } from "@api/db/queries/user-invites";
import { deleteUser, getUserById, updateUser } from "@api/db/queries/users";
import { resend } from "@api/services/resend";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { updateUserSchema } from "./schema";

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx: { db, session } }) => {
    return getUserById(db, session.user.id);
  }),

  update: protectedProcedure
    .input(updateUserSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      return updateUser(db, {
        id: session.user.id,
        ...input,
      });
    }),

  delete: protectedProcedure.mutation(
    async ({ ctx: { supabase, db, session } }) => {
      const [data] = await Promise.all([
        deleteUser(db, session.user.id),
        supabase.auth.admin.deleteUser(session.user.id),
        resend.contacts.remove({
          email: session.user.email!,
          audienceId: process.env.RESEND_AUDIENCE_ID!,
        }),
      ]);

      return data;
    },
  ),

  invites: protectedProcedure.query(async ({ ctx: { db, session } }) => {
    if (!session.user.email) {
      return [];
    }

    return getUserInvites(db, session.user.email);
  }),
});
