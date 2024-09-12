import { Targets } from '../types/requestBody';
import {
  fetchProviderOptionsFromConfig,
  tryProvidersInSequence,
} from './handlerUtils';
import { Context } from 'hono';

/**
 * @deprecated
 * Handles the 'complete' API request by selecting the appropriate provider(s) and making the request to them.
 * If a provider is specified in the request config, that provider is used. Otherwise, the provider options are determined based on the mode in the request config.
 * If no provider options can be determined, an error is thrown. If the request to the provider(s) fails, an error is also thrown.
 *
 * @returns {Promise<CResponse>} - The response from the provider.
 * @throws Will throw an error if no provider options can be determined or if the request to the provider(s) fails.
 */
export async function completeHandler(c: Context): Promise<Response> {
  try {
    const request = await c.req.json();
    const requestHeaders = Object.fromEntries(c.req.raw.headers);
    if (
      request.config?.targets &&
      request.config?.targets?.filter((t: Targets) => t.targets).length > 0
    ) {
      return new Response(
        JSON.stringify({
          status: 'failure',
          message:
            'Please use the latest routes or SDK to use this version of config.',
        }),
        {
          status: 400,
          headers: {
            'content-type': 'application/json',
          },
        }
      );
    }

    const providerOptions = fetchProviderOptionsFromConfig(request.config);

    if (!providerOptions) {
      return new Response(
        JSON.stringify({
          status: 'failure',
          message: 'Could not find a provider option.',
        }),
        {
          status: 400,
          headers: {
            'content-type': 'application/json',
          },
        }
      );
    }

    try {
      return await tryProvidersInSequence(
        c,
        providerOptions,
        request.params,
        requestHeaders,
        'complete'
      );
    } catch (error: any) {
      const errorArray = JSON.parse(error.message);
      return new Response(errorArray[errorArray.length - 1].errorObj, {
        status: errorArray[errorArray.length - 1].status,
        headers: {
          'content-type': 'application/json',
        },
      });
    }
  } catch (err: any) {
    console.log('complete error', err.message);
    return new Response(
      JSON.stringify({
        status: 'failure',
        message: 'Something went wrong',
      }),
      {
        status: 500,
        headers: {
          'content-type': 'application/json',
        },
      }
    );
  }
}
