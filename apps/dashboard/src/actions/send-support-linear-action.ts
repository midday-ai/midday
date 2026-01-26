"use server";

import { LogEvents } from "@midday/events/events";
import { z } from "zod";
import { authActionClient } from "./safe-action";

const LINEAR_API_ENDPOINT = "/api/support/ticket";

// Map type to Linear type enum
const mapToLinearType = (type: string): "bug" | "feedback" | "support" => {
  switch (type.toLowerCase()) {
    case "bug":
      return "bug";
    case "feedback":
    case "feature":
      return "feedback";
    default:
      return "support";
  }
};

export const sendSupportAction = authActionClient
  .schema(
    z.object({
      subject: z.string(),
      priority: z.string(),
      type: z.string(),
      message: z.string(),
      url: z.string().optional(),
    }),
  )
  .metadata({
    name: "send-support",
    track: {
      event: LogEvents.SupportTicket.name,
      channel: LogEvents.SupportTicket.channel,
    },
  })
  .action(async ({ parsedInput: data, ctx: { user } }) => {
    // Call the Linear support ticket API
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3001";

    const response = await fetch(`${baseUrl}${LINEAR_API_ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: mapToLinearType(data.type),
        title: data.subject,
        description: data.message,
        source: "dashboard",
        userEmail: user.email,
        url: data.url,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to submit support request");
    }

    return response.json();
  });
