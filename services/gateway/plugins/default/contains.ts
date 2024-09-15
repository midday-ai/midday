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

  try {
    const words = parameters.words;
    const operator = parameters.operator;

    let responseText = getText(context, eventType);

    switch (operator) {
      case "any":
        verdict = words.some((word: string) => responseText.includes(word));
        break;
      case "all":
        verdict = words.every((word: string) => responseText.includes(word));
        break;
      case "none":
        verdict = words.every((word: string) => !responseText.includes(word));
        break;
    }
  } catch (e) {
    error = e as Error;
  }

  return { error, verdict };
};
