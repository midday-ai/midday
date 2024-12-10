import fs from "node:fs/promises";
import path from "node:path";
import { intro, outro, select, text } from "@clack/prompts";

export async function init() {
  intro("Let's set up your i18n configuration");

  const sourceLanguage = await select({
    message: "What is your source language?",
    options: [
      { value: "en", label: "English" },
      { value: "es", label: "Spanish" },
      { value: "fr", label: "French" },
      { value: "de", label: "German" },
    ],
  });

  const targetLanguages = await text({
    message: "What languages do you want to translate to?",
    placeholder: "es,fr,de,zh,ja,pt",
    validate: (value) => {
      if (!value) return "Please enter at least one language";

      const codes = value.split(",").map((code) => code.trim().toLowerCase());
      const validCodes = new Set([
        "es",
        "fr",
        "de",
        "it",
        "pt",
        "ru",
        "zh",
        "ja",
        "ko",
        "ar",
        "hi",
        "af",
        "bg",
        "bn",
        "ca",
        "cs",
        "cy",
        "da",
        "el",
        "en",
        "et",
        "fa",
        "fi",
        "ga",
        "gu",
        "he",
        "hr",
        "hu",
        "id",
        "kn",
        "lt",
        "lv",
        "mk",
        "ml",
        "mr",
        "ms",
        "mt",
        "nl",
        "no",
        "pa",
        "pl",
        "ro",
        "sk",
        "sl",
        "sq",
        "sr",
        "sv",
        "sw",
        "ta",
        "te",
        "th",
        "tr",
        "uk",
        "ur",
        "vi",
      ]);

      const invalidCodes = codes.filter((code) => !validCodes.has(code));
      if (invalidCodes.length > 0) {
        return `Invalid language code(s): ${invalidCodes.join(", ")}`;
      }
      return;
    },
  });

  const fileFormat = await select({
    message: "What format should language files use?",
    options: [
      { value: "ts", label: "TypeScript (.ts)" },
      { value: "json", label: "JSON (.json)" },
      { value: "yaml", label: "YAML (.yaml)" },
      { value: "md", label: "Markdown (.md)" },
      { value: "xml", label: "Android (.xml)" },
      { value: "arb", label: "Flutter (.arb)" },
      { value: "stringsdict", label: "iOS Dictionary (.stringsdict)" },
      { value: "strings", label: "iOS Strings (.strings)" },
      { value: "xcstrings", label: "iOS XCStrings (.xcstrings)" },
    ],
  });

  const model = await select({
    message: "Which OpenAI model should be used for translations?",
    options: [
      { value: "gpt-4", label: "GPT-4 (Default)" },
      { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4o-mini", label: "GPT-4o mini" },
      { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    ],
    initialValue: "gpt-4",
  });

  const config = {
    version: require("@midday/i18n/package.json").version,
    locale: {
      source: sourceLanguage,
      targets: targetLanguages.split(",").map((l) => l.trim()),
    },
    files: {
      [fileFormat]: {
        include: [`locales/[locale].${fileFormat}`],
      },
    },
    openai: {
      model: model,
    },
  };

  try {
    // Create locales directory if it doesn't exist
    await fs.mkdir(path.join(process.cwd(), "locales"), { recursive: true });

    // Create source language file if it doesn't exist
    const sourceFile = path.join(
      process.cwd(),
      `locales/${String(sourceLanguage)}.${String(fileFormat)}`,
    );
    if (
      !(await fs
        .access(sourceFile)
        .then(() => true)
        .catch(() => false))
    ) {
      await fs.writeFile(sourceFile, "", "utf-8");
    }

    // Create target language files if they don't exist
    const targetLangs =
      typeof targetLanguages === "string" ? targetLanguages.split(",") : [];
    for (const targetLang of targetLangs.map((l: string) => l.trim())) {
      const targetFile = path.join(
        process.cwd(),
        `locales/${String(targetLang)}.${String(fileFormat)}`,
      );
      if (
        !(await fs
          .access(targetFile)
          .then(() => true)
          .catch(() => false))
      ) {
        await fs.writeFile(targetFile, "", "utf-8");
      }
    }

    // Write config file
    await fs.writeFile(
      path.join(process.cwd(), "languine.config.json"),
      JSON.stringify(config, null, 2),
    );
    outro("Configuration file and language files created successfully!");
  } catch (error) {
    outro("Failed to create config and language files");
    process.exit(1);
  }
}
