import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { documentClassifierPrompt, imageClassifierPrompt } from "../prompt";
import { documentClassifierSchema, imageClassifierSchema } from "../schema";
import type {
  DocumentClassifierImageRequest,
  DocumentClassifierRequest,
} from "../types";

const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;

const google = createGoogleGenerativeAI({
  apiKey: GOOGLE_API_KEY,
});

export class DocumentClassifier {
  async #processDocument({ content }: DocumentClassifierRequest) {
    const result = await generateObject({
      model: google("gemini-3-flash-preview"),
      schema: documentClassifierSchema,
      temperature: 0.1,
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

    // If title is null, retry with a more explicit prompt
    if (!result.object.title) {
      const retryPrompt = `${documentClassifierPrompt}

CRITICAL: The previous attempt returned a null title, which is not acceptable. You MUST provide a title. Even if the document is unclear, construct a descriptive title from available information. Examples of acceptable titles even for unclear documents:
- "Business Document - [Date if available]"
- "Invoice from [Company Name if visible]"
- "Receipt from [Store Name if visible]"
- "Contract Document - [Date if available]"
Never return null for the title field.`;

      const retryResult = await generateObject({
        model: google("gemini-3-flash-preview"),
        schema: documentClassifierSchema,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content: retryPrompt,
          },
          {
            role: "user",
            content,
          },
        ],
      });

      return retryResult.object;
    }

    return result.object;
  }

  async #processImage(request: DocumentClassifierImageRequest) {
    const result = await generateObject({
      model: google("gemini-3-flash-preview"),
      schema: imageClassifierSchema,
      temperature: 0.1, // Lower temperature for more consistent, deterministic title extraction
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

    // If title is null, retry with a more explicit prompt
    if (!result.object.title) {
      const retryPrompt = `${imageClassifierPrompt}

CRITICAL: The previous attempt returned a null title, which is not acceptable. You MUST provide a title. Even if the image is unclear, construct a descriptive title from visible information. Use OCR to extract text if needed. Examples of acceptable titles even for unclear images:
- "Receipt from [Store Name if visible] - [Date if visible]"
- "Invoice from [Company Name if visible]"
- "Business Document Image - [Date if visible]"
- "Product Photo - [Product Name if visible]"
Never return null for the title field.`;

      const retryResult = await generateObject({
        model: google("gemini-3-flash-preview"),
        schema: imageClassifierSchema,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content: retryPrompt,
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

      return retryResult.object;
    }

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
