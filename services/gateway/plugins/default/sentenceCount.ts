import {
  HookEventType,
  PluginContext,
  PluginHandler,
  PluginParameters,
} from "../types";
import { getText } from "../utils";

function countSentences(text: string): number {
  return text.split(/[.!?]/).length - 1;
}

export const handler: PluginHandler = async (
  context: PluginContext,
  parameters: PluginParameters,
  eventType: HookEventType,
) => {
  let error = null;
  let verdict = false;
  let data = null;

  // The following code is an example of a plugin that uses regex to match a string in the response body.
  // The plugin will return true if the regex matches the string, and false otherwise.
  try {
    const minCount = parameters.minSentences;
    const maxCount = parameters.maxSentences;
    let text = getText(context, eventType);

    if (
      Number.isInteger(minCount) &&
      Number.isInteger(maxCount) &&
      text.length >= 0
    ) {
      let count = countSentences(text);
      verdict = count >= minCount && count <= maxCount;
    } else {
      error = error || new Error("Missing sentence count range or text");
    }
  } catch (e) {
    error = e as Error;
  }

  return { error, verdict, data };
};
