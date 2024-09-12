import { BaseError } from "@internal/error";

export class CacheError extends BaseError {
  public readonly name = "CacheError";
  public readonly retry = false;

  public readonly tier: string;
  public readonly key: string;

  constructor(opts: { tier: string; key: string; message: string }) {
    super(opts);
    this.name = "CacheError";
    this.tier = opts.tier;
    this.key = opts.key;
  }
}
