import {
  ANTHROPIC,
  COHERE,
  GOOGLE,
  GOOGLE_VERTEX_AI,
  PERPLEXITY_AI,
  DEEPINFRA,
} from './globals';
import { Params } from './types/requestBody';

export const getStreamModeSplitPattern = (
  proxyProvider: string,
  requestURL: string
) => {
  let splitPattern: SplitPatternType = '\n\n';

  if (proxyProvider === ANTHROPIC && requestURL.endsWith('/complete')) {
    splitPattern = '\r\n\r\n';
  }

  if (proxyProvider === COHERE) {
    splitPattern = '\n';
  }

  if (proxyProvider === GOOGLE) {
    splitPattern = '\r\n';
  }

  // In Vertex Anthropic and LLama have \n\n as the pattern only Gemini has \r\n\r\n
  if (
    proxyProvider === GOOGLE_VERTEX_AI &&
    requestURL.includes('/publishers/google')
  ) {
    splitPattern = '\r\n\r\n';
  }

  if (proxyProvider === PERPLEXITY_AI) {
    splitPattern = '\r\n\r\n';
  }

  if (proxyProvider === DEEPINFRA) {
    splitPattern = '\r\n\r\n';
  }

  return splitPattern;
};
export type SplitPatternType = '\n\n' | '\r\n\r\n' | '\n' | '\r\n';

export const getStreamingMode = (
  reqBody: Params,
  provider: string,
  requestUrl: string
) => {
  if (provider === GOOGLE && requestUrl.indexOf('stream') > -1) {
    return true;
  }
  return reqBody.stream;
};

export function convertKeysToCamelCase(
  obj: Record<string, any>,
  parentKeysToPreserve: string[] = []
): Record<string, any> {
  if (typeof obj !== 'object' || obj === null) {
    return obj; // Return unchanged for non-objects or null
  }

  if (Array.isArray(obj)) {
    // If it's an array, recursively convert each element
    return obj.map((item) =>
      convertKeysToCamelCase(item, parentKeysToPreserve)
    );
  }

  return Object.keys(obj).reduce((result: any, key: string) => {
    const value = obj[key];
    const camelCaseKey = toCamelCase(key);
    const isParentKeyToPreserve = parentKeysToPreserve.includes(key);
    if (typeof value === 'object' && !isParentKeyToPreserve) {
      // Recursively convert child objects
      result[camelCaseKey] = convertKeysToCamelCase(
        value,
        parentKeysToPreserve
      );
    } else {
      // Add key in camelCase to the result
      result[camelCaseKey] = value;
    }

    return result;
  }, {});

  function toCamelCase(snakeCase: string): string {
    return snakeCase.replace(/(_\w)/g, (match) => match[1].toUpperCase());
  }
}
