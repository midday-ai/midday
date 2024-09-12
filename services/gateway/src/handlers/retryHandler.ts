import retry from 'async-retry';

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const timeoutRequestOptions = {
    ...options,
    signal: controller.signal,
  };

  let response;

  try {
    response = await fetch(url, timeoutRequestOptions);
    clearTimeout(timeoutId);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      response = new Response(
        JSON.stringify({
          error: {
            message: `Request exceeded the timeout sent in the request: ${timeout}ms`,
            type: 'timeout_error',
            param: null,
            code: null,
          },
        }),
        {
          headers: {
            'content-type': 'application/json',
          },
          status: 408,
        }
      );
    } else {
      throw err;
    }
  }

  return response;
}

/**
 * Tries making a fetch request a specified number of times until it succeeds.
 * If the response's status code is included in the statusCodesToRetry array,
 * the request is retried.
 *
 * @param {string} url - The URL to which the request is made.
 * @param {RequestInit} options - The options for the request, such as method, headers, and body.
 * @param {number} retryCount - The maximum number of times to retry the request.
 * @param {number[]} statusCodesToRetry - The HTTP status codes that should trigger a retry.
 * @returns {Promise<[Response, number | undefined]>} - The response from the request and the number of attempts it took to get a successful response.
 *                                                     If all attempts fail, the error message and status code are returned as a Response object, and the number of attempts is undefined.
 * @throws Will throw an error if the request fails after all retry attempts, with the error message and status code in the thrown error.
 */
export const retryRequest = async (
  url: string,
  options: RequestInit,
  retryCount: number,
  statusCodesToRetry: number[],
  timeout: number | null
): Promise<[Response, number | undefined]> => {
  let lastError: any | undefined;
  let lastResponse: Response | undefined;
  let lastAttempt: number | undefined;
  try {
    await retry(
      async (bail: any, attempt: number) => {
        try {
          const response: Response = timeout
            ? await fetchWithTimeout(url, options, timeout)
            : await fetch(url, options);
          if (statusCodesToRetry.includes(response.status)) {
            const errorObj: any = new Error(await response.text());
            errorObj.status = response.status;
            errorObj.headers = Object.fromEntries(response.headers);
            throw errorObj;
          } else if (response.status >= 200 && response.status <= 204) {
            // console.log(
            //   `Returned in Retry Attempt ${attempt}. Status:`,
            //   response.ok,
            //   response.status
            // );
          } else {
            // All error codes that aren't retried need to be propogated up
            const errorObj: any = new Error(await response.clone().text());
            errorObj.status = response.status;
            errorObj.headers = Object.fromEntries(response.headers);
            bail(errorObj);
            return;
          }
          lastResponse = response;
        } catch (error: any) {
          lastError = error;
          if (attempt >= retryCount + 1) {
            bail(error);
            return;
          }
          throw error;
        }
      },
      {
        retries: retryCount,
        onRetry: (error: Error, attempt: number) => {
          lastAttempt = attempt;
          console.warn(`Failed in Retry attempt ${attempt}. Error: ${error}`);
        },
        randomize: false,
      }
    );
  } catch (error: any) {
    if (
      error instanceof TypeError &&
      error.cause instanceof Error &&
      error.cause?.name === 'ConnectTimeoutError'
    ) {
      console.error('ConnectTimeoutError: ', error.cause);
      // This error comes in case the host address is unreachable. Empty status code used to get returned
      // from here hence no retry logic used to get called.
      lastResponse = new Response(error.message, {
        status: 503,
      });
    } else {
      lastResponse = new Response(error.message, {
        status: error.status,
        headers: error.headers,
      });
    }
    console.warn(
      `Tried ${lastAttempt ?? 1} time(s) but failed. Error: ${JSON.stringify(error)}`
    );
  }
  return [lastResponse as Response, lastAttempt];
};
