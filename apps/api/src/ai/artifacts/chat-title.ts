import { artifact } from "@ai-sdk-tools/artifacts";
import { z } from "zod";

export const chatTitleArtifact = artifact(
  "chat-title",
  z.object({
    title: z.string(),
  }),
);
