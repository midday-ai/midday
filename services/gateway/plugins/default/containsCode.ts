import {
  HookEventType,
  PluginContext,
  PluginHandler,
  PluginParameters,
} from "../types";
import { getText } from "../utils";

export const handler: PluginHandler = async (
  context: PluginContext,
  parameters: PluginParameters,
  eventType: HookEventType,
) => {
  let error = null;
  let verdict = false;
  let data = null;

  const languageMap: { [key: string]: string } = {
    sql: "SQL",
    py: "Python",
    ts: "TypeScript",
    js: "JavaScript",
    java: "Java",
    cs: "C#",
    cpp: "C++",
    c: "C",
    rb: "Ruby",
    php: "PHP",
    swift: "Swift",
    kt: "Kotlin",
    go: "Go",
    rs: "Rust",
    scala: "Scala",
    r: "R",
    pl: "Perl",
    sh: "Shell",
    html: "HTML",
    css: "CSS",
    xml: "XML",
    json: "JSON",
    yml: "YAML",
    md: "Markdown",
    dockerfile: "Dockerfile",
    // Add more mappings as needed
  };

  try {
    const format = parameters.format;

    let responseText = getText(context, eventType);

    const codeBlockRegex = /```(\w+)\n[\s\S]*?\n```/g;
    let match;
    while ((match = codeBlockRegex.exec(responseText)) !== null) {
      const markdownLanguage = match[1].toLowerCase();
      if (languageMap[markdownLanguage] === format) {
        verdict = true;
        break;
      }
    }

    if (match === null) {
      data = { message: "No code block found in the response text." };
    }
  } catch (e) {
    error = e as Error;
  }

  return { error, verdict, data };
};
