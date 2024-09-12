export type ErrorContext = Record<string, unknown>;

export abstract class BaseError<
  TContext extends ErrorContext = ErrorContext,
> extends Error {
  public abstract readonly retry: boolean;
  public readonly cause: BaseError | undefined;
  public readonly context: TContext | undefined;
  public abstract readonly name: string;

  constructor(opts: {
    message: string;
    cause?: BaseError;
    context?: TContext;
  }) {
    super(opts.message);
    this.cause = opts.cause;
    this.context = opts.context;
  }

  public toString(): string {
    return `${this.name}: ${this.message} - ${JSON.stringify(
      this.context,
    )} - caused by ${this.cause?.toString()}`;
  }
}
