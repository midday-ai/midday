import {
  HookEventType,
  PluginContext,
  PluginHandler,
  PluginParameters,
} from "../types";
import { getText } from "../utils";
import { PORTKEY_ENDPOINTS, fetchPortkey } from "./globals";

async function detectPII(text: string, credentials: any) {
  const result = await fetchPortkey(PORTKEY_ENDPOINTS.PII, credentials, {
    input: text,
  });

  // Identify all the PII categories in the text
  let detectedPIICategories = result[0].entities
    .map((entity: any) => {
      return Object.keys(entity.labels);
    })
    .flat()
    .filter((value: any, index: any, self: string | any[]) => {
      return self.indexOf(value) === index;
    });

  // Generate the detailed data to be sent along with detectedPIICategories
  let detailedData = result[0].entities.map((entity: any) => {
    return {
      text: entity.text,
      labels: entity.labels,
    };
  });

  return { detectedPIICategories, PIIData: detailedData };
}

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
    const categoriesToCheck = parameters.categories;

    let { detectedPIICategories, PIIData } = await detectPII(
      text,
      parameters.credentials,
    );

    // Filter the detected categories based on the categories to check
    let filteredCategories = detectedPIICategories.filter(
      (category: string) => {
        return categoriesToCheck.includes(category);
      },
    );

    if (filteredCategories.length > 0) {
      verdict = false;
      data = PIIData;
    } else {
      verdict = true;
    }
  } catch (e) {
    error = e as Error;
  }

  return { error, verdict, data };
};
