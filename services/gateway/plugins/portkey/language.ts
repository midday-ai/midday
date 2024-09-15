import {
  HookEventType,
  PluginContext,
  PluginHandler,
  PluginParameters,
} from "../types";
import { getText } from "../utils";
import { PORTKEY_ENDPOINTS, fetchPortkey } from "./globals";

export const handler: PluginHandler = async (
  context: PluginContext,
  parameters: PluginParameters,
  eventType: HookEventType,
) => {
  let error = null;
  let verdict = false;
  let data = null;

  try {
    // Get the text from the request or response
    const text = getText(context, eventType);
    const languages = parameters.language;

    // Find the language of the text
    const result: any = await fetchPortkey(
      PORTKEY_ENDPOINTS.LANGUAGE,
      parameters.credentials,
      { input: text },
    );
    const predictedLanguage = result[0][0].label;

    // Check if the predicted language matches the language set in the parameters
    if (languages.includes(predictedLanguage)) {
      verdict = true;
    } else {
      verdict = false;
    }
    data = result[0];
  } catch (e) {
    error = e as Error;
  }

  return { error, verdict, data };
};
