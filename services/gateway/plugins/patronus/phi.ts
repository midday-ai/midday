import {
  HookEventType,
  PluginContext,
  PluginHandler,
  PluginParameters,
} from '../types';
import { postPatronus } from './globals';

export const handler: PluginHandler = async (
  context: PluginContext,
  parameters: PluginParameters,
  eventType: HookEventType
) => {
  let error = null;
  let verdict = false;
  let data = null;

  const evaluator = 'phi';

  if (eventType !== 'afterRequestHook') {
    return {
      error: {
        message: 'Patronus guardrails only support after_request_hooks.',
      },
      verdict: true,
      data,
    };
  }

  const evaluationBody: any = {
    input: context.request.text,
    output: context.response.text,
  };

  try {
    const result: any = await postPatronus(
      evaluator,
      parameters.credentials,
      evaluationBody
    );

    const evalResult = result.results[0];
    error = evalResult.error_message;

    // verdict can be true/false
    verdict = evalResult.evaluation_result.pass;

    data = evalResult.evaluation_result.additional_info;
  } catch (e: any) {
    delete e.stack;
    error = e;
  }

  return { error, verdict, data };
};
