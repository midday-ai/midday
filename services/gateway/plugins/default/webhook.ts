import { PluginContext, PluginHandler, PluginParameters } from '../types';
import { post } from '../utils';

export const handler: PluginHandler = async (
  context: PluginContext,
  parameters: PluginParameters
) => {
  let error = null;
  let verdict = false;
  let data = null;

  try {
    let url = parameters.webhookURL;
    let headers: Record<string, string> = parameters?.headers
      ? JSON.parse(parameters.headers)
      : {};
    ({ verdict, data } = await post(url, context, { headers }, 3000));
  } catch (e: any) {
    delete e.stack;
    error = e;
  }

  return { error, verdict, data };
};
