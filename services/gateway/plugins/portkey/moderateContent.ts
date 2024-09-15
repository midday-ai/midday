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
    const categories = parameters.categories;

    // Get data from the relevant tool
    const result: any = await fetchPortkey(
      PORTKEY_ENDPOINTS.MODERATIONS,
      parameters.credentials,
      { input: text },
    );

    // Check if the text is flagged and parameters.categories matches any of the categories set to true in the result
    const categoriesFlagged = Object.keys(result.results[0].categories).filter(
      (category) => result.results[0].categories[category],
    );

    // Find the intersection of the categoriesFlagged and the categories to check
    const intersection = categoriesFlagged.filter((category) =>
      categories.includes(category),
    );

    if (intersection.length > 0) {
      verdict = false;
      data = { flagged_categories: intersection };
    } else {
      verdict = true;
    }
  } catch (e) {
    error = e as Error;
  }

  return { error, verdict, data };
};
