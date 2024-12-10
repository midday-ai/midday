import fs from "node:fs/promises";
import path from "node:path";
import { intro, outro, text } from "@clack/prompts";
import chalk from "chalk";
import type { LanguineConfig } from "../types.js";

export async function instructions() {
  intro("Let's customize your translation prompt");

  const customInstructions = await text({
    message: "Enter additional translation instructions",
    placeholder: "e.g. Use formal language, add a tone of voice",
    validate: (value) => {
      if (!value) return "Please enter some instructions";
      return;
    },
  });

  try {
    // Read config file
    const configPath = path.join(process.cwd(), "languine.json");
    let config: LanguineConfig;

    try {
      const configContent = await fs.readFile(configPath, "utf-8");
      config = JSON.parse(configContent);
    } catch (error) {
      outro(
        chalk.red("Could not find languine.json. Run 'languine init' first."),
      );
      process.exit(1);
    }

    // Add custom instructions to config
    config.instructions = customInstructions as string;

    // Write updated config
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");

    outro(chalk.green("Translation prompt updated successfully!"));
  } catch (error) {
    outro(chalk.red("Failed to update config file"));
    process.exit(1);
  }
}
