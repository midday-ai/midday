import { BaseError } from "./base";

/**
 * Fetch Errors
 */
export class FetchError extends BaseError<{
  url: string;
  method: string;
  [more: string]: unknown;
}> {
  public readonly retry: boolean;
  public readonly name = FetchError.name;

  constructor(opts: {
    message: string;

    retry: boolean;
    cause?: BaseError;
    context?: {
      url: string;
      method: string;
      [more: string]: unknown;
    };
  }) {
    super(opts);
    this.retry = opts.retry;
  }
}
