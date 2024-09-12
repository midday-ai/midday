import { Context } from 'hono';
import {
  fetchProviderOptionsFromConfig,
  tryProvidersInSequence,
} from './handlerUtils';
import { Targets } from '../types/requestBody';

/**
 * @deprecated
 */
export async function embedHandler(c: Context): Promise<Response> {
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

    let providerOptions = fetchProviderOptionsFromConfig(request.config);
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
        'embed'
      );
    } catch (error: any) {
      console.error(`embed error: ${error.message}`);
      const errorArray = JSON.parse(error.message);
      return new Response(errorArray[errorArray.length - 1].errorObj, {
        status: errorArray[errorArray.length - 1].status,
        headers: {
          'content-type': 'application/json',
        },
      });
    }
  } catch (err: any) {
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
