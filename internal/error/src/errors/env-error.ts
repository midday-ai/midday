import { BaseError } from "./base";

/**
 * Env Errors indicate an environment variable was not configured properly
 */
export class EnvError extends BaseError<{
  name: string;
}> {
  public readonly retry = false;
  public readonly name = EnvError.name;
}
