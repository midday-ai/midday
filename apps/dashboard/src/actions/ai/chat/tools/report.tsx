import type { MutableAIState } from "@/actions/ai/types";
import { dub } from "@/utils/dub";
import { createClient } from "@midday/supabase/server";
import { startOfMonth } from "date-fns";
import { nanoid } from "nanoid";
import { z } from "zod";
import { ReportUI } from "./ui/report-ui";

type Args = {
  aiState: MutableAIState;
  userId: string;
  teamId: string;
  dateFrom: string;
  dateTo: string;
};

export function createReport({
  aiState,
  userId,
  teamId,
  dateFrom,
  dateTo,
}: Args) {
  return {
    description: "Create report",
    parameters: z.object({
      startDate: z.coerce
        .date()
        .describe("The start date of the report, in ISO-8601 format")
        .default(new Date(dateFrom)),
      endDate: z.coerce
        .date()
        .describe("The end date of the report, in ISO-8601 format")
        .default(new Date(dateTo)),
      type: z
        .enum(["profit", "revenue", "burn_rate", "expense"])
        .describe("The report type"),
      currency: z.string().describe("The currency for the report").optional(),
    }),
    generate: async (args) => {
      const { currency, startDate, endDate, type, expiresAt } = args;

      const supabase = createClient();

      const { data } = await supabase
        .from("reports")
        .insert({
          team_id: teamId,
          from: startOfMonth(new Date(startDate)).toISOString(),
          to: new Date(endDate).toISOString(),
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

      const props = {
        startDate: linkData?.from,
        endDate: linkData?.to,
        shortLink: linkData?.short_link,
        type: linkData?.type,
      };

      const toolCallId = nanoid();

      aiState.done({
        ...aiState.get(),
        messages: [
          ...aiState.get().messages,
          {
            id: nanoid(),
            role: "assistant",
            content: [
              {
                type: "tool-call",
                toolName: "createReport",
                toolCallId,
                args,
              },
            ],
          },
          {
            id: nanoid(),
            role: "tool",
            content: [
              {
                type: "tool-result",
                toolName: "createReport",
                toolCallId,
                result: props,
              },
            ],
          },
        ],
      });
      return <ReportUI {...props} />;
    },
  };
}
