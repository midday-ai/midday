import { PluginContext, PluginHandler, PluginParameters } from "../types";
import { post } from "../utils";

export const handler: PluginHandler = async (
  context: PluginContext,
  parameters: PluginParameters,
) => {
  let error = null;
  let verdict = false;
  let data = null;

  try {
    let url = parameters.logURL;
    let headers: Record<string, string> = parameters?.headers
      ? JSON.parse(parameters.headers)
      : {};

    // log the request
    await post(url, context, { headers }, 3000);

    verdict = true;
    data = { message: `Logged the request to ${url}` };
  } catch (e: any) {
    delete e.stack;
    error = e;
  }

  return { error, verdict, data };
};
