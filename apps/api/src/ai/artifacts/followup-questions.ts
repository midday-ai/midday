import { artifact } from "@ai-sdk-tools/artifacts";
import { z } from "zod";

export const followupQuestionsArtifact = artifact(
  "followup-questions",
  z.object({
    questions: z.array(z.string()).max(4),
    context: z.string().optional(),
  }),
);
