import { config } from "dotenv";
import OpenAI from "openai";

config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "http://localhost:8787",
  // baseURL: "https://chronark.llm.unkey.io",
});

async function main() {
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: process.argv[2],
      },
    ],
    model: "gpt-4",
  });

  console.info(chatCompletion.choices[0].message.content);
}

main();
