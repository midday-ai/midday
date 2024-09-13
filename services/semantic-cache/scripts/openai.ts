import { config } from "dotenv";
import OpenAI from "openai";

config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "http://localhost:8787",
});

async function main() {
  try {
    const userMessage = process.argv[2];
    if (!userMessage) {
      throw new Error("Please provide a message as a command-line argument.");
    }

    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
      model: "gpt-4",
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    if (responseContent) {
      console.info(responseContent);
    } else {
      console.error("No response content received from the API.");
    }
  } catch (error) {
    console.error(
      "An error occurred:",
      error instanceof Error ? error.message : String(error)
    );
  }
}

main();
