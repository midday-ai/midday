import type { MutableAIState } from "@/actions/ai/types";
import { createClient } from "@midday/supabase/server";
import { Dub } from "dub";
// import { getRunway } from "@midday/supabase/cached-queries";
// import { nanoid } from "ai";
import { z } from "zod";
// import { RunwayUI } from "./ui/runway-ui";

const dub = new Dub({ projectSlug: "midday" });

type Args = {
  aiState: MutableAIState;
  userId: string;
  teamId: string;
  currency: string;
  dateFrom: string;
  dateTo: string;
};

export function createReport({
  aiState,
  userId,
  teamId,
  currency,
  dateFrom,
  dateTo,
}: Args) {
  return {
    description: "Create report",
    parameters: z.object({
      startDate: z.coerce
        .date()
        .describe("The start date of the runway, in ISO-8601 format")
        .default(new Date(dateFrom)),
      endDate: z.coerce
        .date()
        .describe("The end date of the runway, in ISO-8601 format")
        .default(new Date(dateTo)),
      type: z
        .enum(["profit", "revenue", "burn_rate"])
        .describe("The report type"),
      currency: z
        .string()
        .default(currency)
        .describe("The currency for the runway"),
    }),
    generate: async (args) => {
      const { currency, startDate, endDate, type, expiresAt } = args;

      const supabase = createClient();

      const { data } = await supabase
        .from("reports")
        .insert({
          team_id: teamId,
          from: startDate,
          to: endDate,
          type,
          expire_at: expiresAt,
          currency,
          created_by: userId,
        })
        .select("*")
        .single();

      const link = await dub.links.create({
        url: `https://app.midday.ai/report/${data.id}`,
        expiresAt,
        rewrite: true,
      });

      const { data: linkData } = await supabase
        .from("reports")
        .update({
          link_id: link.id,
          short_link: link.shortLink,
        })
        .eq("id", data.id)
        .select("*")
        .single();

      console.log(linkData);

      //   const { data } = await getRunway({
      //     currency,
      //     from: startDate.toString(),
      //     to: endDate.toString(),
      //   });
      //   const toolCallId = nanoid();
      //   const props = {
      //     months: data,
      //   };
      //   aiState.done({
      //     ...aiState.get(),
      //     messages: [
      //       ...aiState.get().messages,
      //       {
      //         id: nanoid(),
      //         role: "assistant",
      //         content: [
      //           {
      //             type: "tool-call",
      //             toolName: "getRunway",
      //             toolCallId,
      //             args,
      //           },
      //         ],
      //       },
      //       {
      //         id: nanoid(),
      //         role: "tool",
      //         content: [
      //           {
      //             type: "tool-result",
      //             toolName: "getRunway",
      //             toolCallId,
      //             result: props,
      //           },
      //         ],
      //       },
      //     ],
      //   });
      //   return <RunwayUI {...props} />;
    },
  };
}
