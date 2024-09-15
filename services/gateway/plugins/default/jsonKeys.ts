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
    const keys = parameters.keys;
    const operator = parameters.operator;
    let responseText = getText(context, eventType);

    const jsonRegex = /{.*?}/g;
    const jsonMatches = responseText.match(jsonRegex);

    if (jsonMatches) {
      for (const jsonMatch of jsonMatches) {
        let responseJson: any;
        try {
          responseJson = JSON.parse(jsonMatch);
        } catch (e) {
          continue;
        }

        responseJson = responseJson || {};

        // Check if the JSON contains any, all or none of the keys
        switch (operator) {
          case "any":
            verdict = keys.some((key: string) =>
              responseJson.hasOwnProperty(key),
            );
            break;
          case "all":
            verdict = keys.every((key: string) =>
              responseJson.hasOwnProperty(key),
            );
            break;
          case "none":
            verdict = keys.every(
              (key: string) => !responseJson.hasOwnProperty(key),
            );
            break;
        }

        if (verdict) {
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
