import baseX from "base-x";

const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const base58 = baseX(alphabet);
const SEPARATOR = "_";
/**
 * Version 1 keys are constructed of 3 parts
 * 1. 1 byte for the version
 * 2. 1 byte to let us know the byteLength of the random part
 * 3. LEN bytes of random data
 * [VERSION, LEN, X,X,X,X,X,X,X,X,X,X,X,X,X,X,X,X]
 */
export class KeyV1 {
  public readonly version = 1;
  public readonly prefix: string | undefined;
  public readonly random: Uint8Array;

  constructor(s: string);
  constructor(opts: { byteLength: number; prefix?: string });
  constructor(arg: string | { byteLength: number; prefix?: string }) {
    if (typeof arg === "string") {
      let s = arg;
      const parts = arg.split(SEPARATOR);
      if (parts.length === 2) {
        this.prefix = parts[0];
        s = parts[1];
      }
      const buf = base58.decode(s);
      if (buf[0] !== 1) {
        throw new Error("Only version 1 keys are supported");
      }
      const len = buf[1];
      this.random = buf.slice(2, 2 + len);
      return;
    }

    if (arg.byteLength < 8 || arg.byteLength > 255) {
      throw new Error("v1 keys must be between 8 and 255 bytes long");
    }
    this.prefix = arg.prefix;
    this.random = crypto.getRandomValues(new Uint8Array(arg.byteLength));
  }

  static fromString(s: string): KeyV1 {
    return new KeyV1(s);
  }

  public toString(): string {
    const buf = new Uint8Array(2 + this.random.length);
    buf[0] = this.version;
    buf[1] = this.random.length;
    buf.set(this.random, 2);

    const enc = base58.encode(buf);
    if (this.prefix) {
      return [this.prefix, enc].join(SEPARATOR);
    }
    return enc;
  }
}
