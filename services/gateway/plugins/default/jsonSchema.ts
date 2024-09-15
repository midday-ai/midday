import {
  HookEventType,
  PluginContext,
  PluginHandler,
  PluginParameters,
} from "../types";
import { z, ZodSchema } from "zod";
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
    const schema: ZodSchema<any> = parameters.schema;
    let responseText = getText(context, eventType);

    // Check if the text contains JSON inside it.
    // The text can contain JSON along with other text before and after it.
    // The text can also contain multiple JSON objects with text in between, we will return all the matched objects.
    const jsonRegex = /{.*?}/g;
    const jsonMatches = responseText.match(jsonRegex);

    // We will find if there's atleast one valid JSON object in the response
    if (jsonMatches) {
      for (const jsonMatch of jsonMatches) {
        let responseJson;
        try {
          responseJson = JSON.parse(jsonMatch);
        } catch (e) {
          // The check will fail if the response is not valid JSON
          continue;
        }

        const validationResult = schema.safeParse(responseJson);
        if (validationResult.success) {
          verdict = true;
          data = responseJson;
          break;
        }
      }
    }
  } catch (e) {
    error = e as Error;
  }

  return { error, verdict, data };
};
