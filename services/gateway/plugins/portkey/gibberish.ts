import {
  HookEventType,
  PluginContext,
  PluginHandler,
  PluginParameters,
} from '../types';
import { getText } from '../utils';
import { PORTKEY_ENDPOINTS, fetchPortkey } from './globals';

export const handler: PluginHandler = async (
  context: PluginContext,
  parameters: PluginParameters,
  eventType: HookEventType
) => {
  let error = null;
  let verdict = false;
  let data = null;

  try {
    // Get the text from the request or response
    const text = getText(context, eventType);

    // Check if the text is gibberish
    const response: any = await fetchPortkey(
      PORTKEY_ENDPOINTS.GIBBERISH,
      parameters.credentials,
      { input: text }
    );
    verdict = response[0][0].label === 'clean';
    data = response[0];
  } catch (e) {
    error = e as Error;
  }

  return { error, verdict, data };
};
