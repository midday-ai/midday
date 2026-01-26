"use server";

import { actionClient } from "./safe-action";
import { sendSupportSchema } from "./schema";

// Call the dashboard's Linear support ticket API
const DASHBOARD_API_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

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

export const sendSupportAction = actionClient
  .schema(sendSupportSchema)
  .action(async ({ parsedInput: data }) => {
    const response = await fetch(`${DASHBOARD_API_URL}/api/support/ticket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: mapToLinearType(data.type),
        title: data.subject,
        description: data.message,
        source: "website",
        userEmail: data.email,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to submit support request");
    }

    return response.json();
  });
