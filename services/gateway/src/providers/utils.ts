import { ErrorResponse } from "./types";

export const generateInvalidProviderResponseError: (
  response: Record<string, any>,
  provider: string,
) => ErrorResponse = (response, provider) => {
  return {
    error: {
      message: `Invalid response received from ${provider}: ${JSON.stringify(
        response,
      )}`,
      type: null,
      param: null,
      code: null,
    },
    provider: provider,
  } as ErrorResponse;
};

export const generateErrorResponse: (
  errorDetails: {
    message: string;
    type: string | null;
    param: string | null;
    code: string | null;
  },
  provider: string,
) => ErrorResponse = ({ message, type, param, code }, provider) => {
  return {
    error: {
      message: `${provider} error: ${message}`,
      type: type ?? null,
      param: param ?? null,
      code: code ?? null,
    },
    provider: provider,
  } as ErrorResponse;
};

type SplitResult = {
  before: string;
  after: string;
};

export function splitString(input: string, separator: string): SplitResult {
  const sepIndex = input.indexOf(separator);

  if (sepIndex === -1) {
    return {
      before: input,
      after: "",
    };
  }

  return {
    before: input.substring(0, sepIndex),
    after: input.substring(sepIndex + 1),
  };
}
