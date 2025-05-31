import { mistral } from "@ai-sdk/mistral";
import { generateObject } from "ai";
import { documentClassifierPrompt, imageClassifierPrompt } from "../prompt";
import { documentClassifierSchema, imageClassifierSchema } from "../schema";
import type {
  DocumentClassifierImageRequest,
  DocumentClassifierRequest,
} from "../types";

export class DocumentClassifier {
  async #processDocument({ content }: DocumentClassifierRequest) {
    const result = await generateObject({
      model: mistral("mistral-medium-latest"),
      schema: documentClassifierSchema,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: documentClassifierPrompt,
        },
        {
          role: "user",
          content,
        },
      ],
    });

    return result.object;
  }

  async #processImage(request: DocumentClassifierImageRequest) {
    const result = await generateObject({
      model: mistral("mistral-medium-latest"),
      schema: imageClassifierSchema,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: imageClassifierPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "image",
              image: request.content,
            },
          ],
        },
      ],
    });

    return result.object;
  }

  public async classifyDocument(request: DocumentClassifierRequest) {
    const result = await this.#processDocument(request);

    return result;
  }

  public async classifyImage(request: DocumentClassifierImageRequest) {
    const result = await this.#processImage(request);

    return result;
  }
}
