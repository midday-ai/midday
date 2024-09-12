import {
  HookEventType,
  PluginContext,
  PluginHandler,
  PluginParameters,
} from '../types';
import { getText } from '../utils';

function countCharacters(text: string): number {
  return text.length;
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
    const minCount = parameters.minCharacters;
    const maxCount = parameters.maxCharacters;
    let text = getText(context, eventType);

    if (
      Number.isInteger(minCount) &&
      Number.isInteger(maxCount) &&
      text.length >= 0
    ) {
      let count = countCharacters(text);
      verdict = count >= minCount && count <= maxCount;
    } else {
      error = error || new Error('Missing character count range or text');
    }
  } catch (e) {
    error = e as Error;
  }

  return { error, verdict, data };
};
