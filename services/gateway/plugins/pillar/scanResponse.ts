import {
  HookEventType,
  PluginContext,
  PluginHandler,
  PluginParameters,
} from '../types';
import { getText } from '../utils';
import { postPillar } from './globals';

export const handler: PluginHandler = async (
  context: PluginContext,
  parameters: PluginParameters,
  eventType: HookEventType
) => {
  let error = null;
  let verdict = false;
  let data = null;

  if (parameters.scanners.length === 0) {
    return { error: { message: 'No scanners specified' }, verdict: true, data };
  }

  let scannerObject: any = {};
  parameters.scanners.forEach((scanner: string) => {
    scannerObject[scanner] = true;
  });

  try {
    let scanResponseObject: any = {
      message: getText(context, eventType),
      scanners: scannerObject,
    };

    const result: any = await postPillar(
      'scanResponse',
      parameters.credentials,
      scanResponseObject
    );

    // if any of the scanners found something, we will return a verdict of false
    // ignore null values - they're counted as true as well
    // attach the result object as data
    for (const key in result) {
      if (
        result[key] !== null &&
        result[key] !== false &&
        [
          'pii',
          'prompt_injection',
          'secrets',
          'toxic_language',
          'invisible_characters',
        ].includes(key)
      ) {
        verdict = false;
        break;
      }
      verdict = true;
    }

    data = result;
  } catch (e: any) {
    delete e.stack;
    error = e;
  }

  return { error, verdict, data };
};
