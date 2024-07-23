"use server";

import { LogEvents } from "@midday/events/events";
import { nanoid } from "nanoid";
import { revalidateTag } from "next/cache";
import { authActionClient } from "./safe-action";
import { createBankAccountSchema } from "./schema";

export const createBankAccountAction = authActionClient
  .schema(createBankAccountSchema)
  .metadata({
    name: "create-bank-account",
    track: {
      event: LogEvents.BankAccountCreate.name,
      channel: LogEvents.BankAccountCreate.channel,
    },
  })
  .action(
    async ({ parsedInput: { name, currency }, ctx: { user, supabase } }) => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .insert({
          name,
          currency,
          team_id: user.team_id,
          created_by: user.id,
          enabled: true,
          account_id: nanoid(),
          manual: true,
        })
        .select("id, name")
        .single();

      if (error) {
        throw Error(error.message);
      }

      revalidateTag(`bank_accounts_${user.team_id}`);
      revalidateTag(`bank_accounts_currencies_${user.team_id}`);

      return data;
    },
  );
