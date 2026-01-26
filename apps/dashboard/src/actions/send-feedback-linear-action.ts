"use server";

import { LogEvents } from "@midday/events/events";
import { z } from "zod";
import { authActionClient } from "./safe-action";

const LINEAR_API_ENDPOINT = "/api/support/ticket";

export const sendFeebackAction = authActionClient
  .schema(
    z.object({
      feedback: z.string(),
    }),
  )
  .metadata({
    name: "send-feedback",
    track: {
      event: LogEvents.SendFeedback.name,
      channel: LogEvents.SendFeedback.channel,
    },
  })
  .action(async ({ parsedInput: { feedback }, ctx: { user } }) => {
    // Call the Linear support ticket API
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3001";

    const response = await fetch(`${baseUrl}${LINEAR_API_ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "feedback",
        title: "Feedback",
        description: feedback,
        source: "dashboard",
        userEmail: user.email,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to submit feedback");
    }

    return response.json();
  });
