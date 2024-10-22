import { NextApiRequest, NextApiResponse } from "next";
import { getAppsMap } from "@midday/app-store";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query;
  const appsMap = getAppsMap();
  const app = appsMap[id as string];

  if (!app || typeof app.onInitialize !== "function") {
    return res
      .status(404)
      .json({ message: "App not found or initialization not supported" });
  }

  try {
    await app.onInitialize();
    res.status(200).json({ message: "App initialized successfully" });
  } catch (error) {
    console.error("Error initializing app:", error);
    res.status(500).json({ message: "Failed to initialize app" });
  }
}
