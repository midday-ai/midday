import { Typewriter } from "@/components/typewriter";
import { getMetrics, getUser } from "@midday/supabase/cached-queries";
import { format, startOfMonth, startOfYear, subMonths } from "date-fns";
import { unstable_cache } from "next/cache";
import OpenAI from "openai";

const openai = new OpenAI();

export async function InsightsWidget() {
  const userData = await getUser();
  const teamId = userData?.data.team_id;

  const type = "revenue";

  const result = await unstable_cache(
    async () => {
      const metrics = await getMetrics({
        type: type,
        from: subMonths(startOfMonth(new Date()), 12).toISOString(),
        to: new Date().toISOString(),
        period: "monthly",
      });

      if (metrics?.summary.currentTotal > 0) {
        const content = metrics.result.map(
          (period) =>
            `${format(new Date(period.current.date), "MMMM")} ${Math.round(
              period.current.value
            )} ${period.current.currency}`
        );

        const chatCompletion = await openai.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `
                ${content.join("\n")} \n
                You are a forecast bot that forecasts this months ${type} based on the last 12 months of ${type}, only return the forecast result, also tell if the bussiness is doing well. But keep it around 250 characters`,
            },
          ],
          temperature: 1,
          max_tokens: 100,
          model: "gpt-3.5-turbo",
        });

        return chatCompletion.choices.at(0)?.message?.content;
      }

      return `We currently lack sufficient data to accurately forecast your ${type}. As you continue to get more transactions, we will be able to provide more precise insights and updates.`;
    },
    ["insights", teamId],
    {
      revalidate: 86400, // NOTE: 1d
      tags: [`insights_${teamId}`],
    }
  )(type, teamId);

  return <Typewriter text={result} />;
}
