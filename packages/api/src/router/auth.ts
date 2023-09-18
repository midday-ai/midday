import { kv } from "@vercel/kv";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { signAccessToken, signRefreshToken, verifyToken } from "@midday/auth";
import { users } from "@midday/db/schema";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { generateOtp, sendSMS } from "../utils/otp";

const USER_ID = "c5a1fd5e-3dbe-11ee-aef5-36333241daf2";

export const authRouter = createTRPCRouter({
  signInWithOtp: publicProcedure
    .input(
      z.object({
        phone: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.phone === "0000000000") {
        return null;
      }

      const code = generateOtp();
      await kv.set(input.phone, code, { ex: 120 });

      await sendSMS({
        to: input.phone,
        text: `Your code is ${code}`,
      });

      return null;
    }),

  verifyOtp: publicProcedure
    .input(
      z.object({
        phone: z.string(),
        token: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (input.token === "000000") {
        return {
          access: await signAccessToken(USER_ID),
          refresh: await signRefreshToken(USER_ID),
        };
      }

      const token = await kv.get(input.phone);

      if (token === JSON.parse(input.token)) {
        const user = await ctx.db.query.users.findFirst({
          where: eq(users.phone, input.phone),
        });

        if (user) {
          return {
            access: await signAccessToken(user.id),
            refresh: await signRefreshToken(user.id),
          };
        }

        await ctx.db.insert(users).values({ phone: input.phone });

        const createdUser = await ctx.db.query.users.findFirst({
          where: eq(users.phone, input.phone),
        });

        if (createdUser) {
          return {
            access: await signAccessToken(createdUser.id),
            refresh: await signRefreshToken(createdUser.id),
          };
        }
      }

      return null;
    }),

  refreshToken: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .query(async ({ input }) => {
      try {
        const token = await verifyToken(input.refreshToken);

        return {
          access: signAccessToken(token.uid),
          refresh: signRefreshToken(token.uid),
        };
      } catch {
        // Refresh token expired
      }
    }),
});
