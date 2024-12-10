import fs from "node:fs/promises";
import path from "node:path";
import { createOpenAI } from "@ai-sdk/openai";
import { intro, outro, spinner } from "@clack/prompts";
import { generateText } from "ai";
import chalk from "chalk";
import dedent from "dedent";
import { prompt as defaultPrompt } from "../prompt.js";
import type { LanguineConfig } from "../types.js";
import { getApiKey } from "../utils.js";

export async function translate(targetLocale?: string) {
  intro("Starting translation process...");

  // Read config file
  let config: LanguineConfig;
  try {
    const configFile = await fs.readFile(
      path.join(process.cwd(), "languine.json"),
      "utf-8",
    );
    config = JSON.parse(configFile);
  } catch (error) {
    outro(
      chalk.red("Could not find languine.json. Run 'languine init' first."),
    );
    process.exit(1);
  }

  const { source, targets } = config.locale;
  const locales = targetLocale ? [targetLocale] : targets;

  // Validate target locale if specified
  if (targetLocale && !targets.includes(targetLocale)) {
    outro(
      chalk.red(
        `Invalid target locale: ${targetLocale}. Available locales: ${targets.join(", ")}`,
      ),
    );
    process.exit(1);
  }

  // Initialize OpenAI
  const openai = createOpenAI({
    apiKey: await getApiKey("OpenAI", "OPENAI_API_KEY"),
  });

  const s = spinner();

  for (const locale of locales) {
    s.start(`Translating to ${locale}...`);

    // Process each file type defined in config
    for (const [format, { include }] of Object.entries(config.files)) {
      for (const pattern of include) {
        const sourcePath = pattern.replace("[locale]", source);
        const targetPath = pattern.replace("[locale]", locale);

        try {
          // Read source file
          let sourceContent = "";
          try {
            sourceContent = await fs.readFile(
              path.join(process.cwd(), sourcePath),
              "utf-8",
            );
          } catch (error) {
            // Create source file if it doesn't exist
            const sourceDir = path.dirname(
              path.join(process.cwd(), sourcePath),
            );
            await fs.mkdir(sourceDir, { recursive: true });
            await fs.writeFile(
              path.join(process.cwd(), sourcePath),
              "",
              "utf-8",
            );
          }

          // Prepare translation prompt
          const prompt = dedent`
            You are a professional translator working with ${format.toUpperCase()} files.
            
            Task: Translate the content below from ${source} to ${locale}.

            ${defaultPrompt}

            ${config.instructions ?? ""}

            Source content:
            ${sourceContent}

            Return only the translated content with identical structure.
          `;

          // Get translation from OpenAI
          const { text } = await generateText({
            model: openai(config.openai.model),
            prompt,
          });

          // Ensure translation is a string
          const translation = text;

          // Ensure target directory exists
          const targetDir = path.dirname(path.join(process.cwd(), targetPath));
          await fs.mkdir(targetDir, { recursive: true });

          // Write translated content
          await fs.writeFile(
            path.join(process.cwd(), targetPath),
            translation,
            "utf-8",
          );
        } catch (error) {
          s.stop(`Error translating ${sourcePath} to ${locale}`);
          console.error(error);
        }
      }
    }

    s.stop(`Successfully translated to ${locale}`);
  }

  outro(chalk.green("Translation completed successfully!"));
}
