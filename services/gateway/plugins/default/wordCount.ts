import {
  HookEventType,
  PluginContext,
  PluginHandler,
  PluginParameters,
} from '../types';
import { getText } from '../utils';

function countWords(text: string): number {
  return text.split(/\s+/).length;
}

export const handler: PluginHandler = async (
  context: PluginContext,
  parameters: PluginParameters,
  eventType: HookEventType
) => {
  let error = null;
  let verdict = false;
  let data = null;

  try {
    const minCount = parameters.minWords;
    const maxCount = parameters.maxWords;
    let text = getText(context, eventType);

    if (
      Number.isInteger(minCount) &&
      Number.isInteger(maxCount) &&
      text.length >= 0
    ) {
      let count = countWords(text);
      verdict = count >= minCount && count <= maxCount;
    } else {
      error = error || new Error('Missing word count range or text');
    }
  } catch (e) {
    error = e as Error;
  }

  return { error, verdict, data };
};
