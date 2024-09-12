import {
  constructConfigFromRequestHeaders,
  tryTargetsRecursively,
} from './handlerUtils';
import { Context } from 'hono';

/**
 * Handles the '/audio/translations' API request by selecting the appropriate provider(s) and making the request to them.
 *
 * @param {Context} c - The Cloudflare Worker context.
 * @returns {Promise<Response>} - The response from the provider.
 * @throws Will throw an error if no provider options can be determined or if the request to the provider(s) fails.
 * @throws Will throw an 500 error if the handler fails due to some reasons
 */
export async function createTranslationHandler(c: Context): Promise<Response> {
  try {
    let request = await c.req.raw.formData();
    let requestHeaders = Object.fromEntries(c.req.raw.headers);
    const camelCaseConfig = constructConfigFromRequestHeaders(requestHeaders);
    const tryTargetsResponse = await tryTargetsRecursively(
      c,
      camelCaseConfig ?? {},
      request,
      requestHeaders,
      'createTranslation',
      'POST',
      'config'
    );

    return tryTargetsResponse;
  } catch (err: any) {
    console.log('createTranslation error', err.message);
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
