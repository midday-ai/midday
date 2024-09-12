import SuperJSON from "superjson";

import { Err, Ok, type Result } from "@solomon-ai/error";

import { CacheError } from "../errors";
import type { Entry, Store } from "../stores";
import type { StoreMiddleware } from "./interface";

/**
 * EncryptedStore is a wrapper around a Store that encrypts and decrypts values using the Web Crypto API.
 *
 * The encryption key is stored in memory and a hash is injected into the cache key to allow rolling the key
 * without causing issues with decryption errors.
 *
 * Rolling the encryption key will therefore invalidate all cache entries.
 *
 * @example
 * ```ts
 * let store // some existing store implementation
 *
 * // generate a key with `openssl rand -base64 32` and load it from the environment
 * const encryptionKey = ""
 * store = EncryptedStore.fromBase64Key(store, encryptionKey)
 * ```
 */

export class EncryptedStore<TNamespace extends string, TValue = any>
  implements Store<TNamespace, TValue>
{
  public name: string;
  private readonly encryptionKey: CryptoKey;
  private readonly encryptionKeyHash: string;
  private readonly store: Store<TNamespace, TValue>;

  constructor(opts: {
    store: Store<TNamespace, TValue>;
    encryptionKey: CryptoKey;
    encryptionKeyHash: string;
  }) {
    this.name = opts.store.name;
    this.store = opts.store;
    this.encryptionKey = opts.encryptionKey;
    this.encryptionKeyHash = opts.encryptionKeyHash;
  }

  /**
   *
   */
  private buildCacheKey(key: string): string {
    return [key, this.encryptionKeyHash].join("/");
  }

  public async get(
    namespace: TNamespace,
    key: string,
  ): Promise<Result<Entry<TValue> | undefined, CacheError>> {
    const res = await this.store.get(namespace, this.buildCacheKey(key));

    if (res.err) {
      return res;
    }
    if (!res.val) {
      return res;
    }
    try {
      const { iv, ciphertext } = res.val.value as {
        iv: string;
        ciphertext: string;
      };
      const decrypted = await this.decrypt(iv, ciphertext);

      res.val.value = SuperJSON.parse(decrypted);
    } catch (e) {
      return Err(
        new CacheError({ tier: this.name, key, message: (e as Error).message }),
      );
    }

    return res;
  }

  public async set(
    namespace: TNamespace,
    key: string,
    value: Entry<TValue>,
  ): Promise<Result<void, CacheError>> {
    const { iv, ciphertext } = await this.encrypt(
      SuperJSON.stringify(value.value),
    );
    // @ts-expect-error
    value.value = { iv, ciphertext };

    const res = await this.store.set(namespace, this.buildCacheKey(key), value);

    return res;
  }

  public async remove(
    namespace: TNamespace,
    key: string,
  ): Promise<Result<void, CacheError>> {
    const res = this.store.remove(namespace, this.buildCacheKey(key));

    return res;
  }

  private async encrypt(
    secret: string,
  ): Promise<{ iv: string; ciphertext: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(32));
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      this.encryptionKey,
      new TextEncoder().encode(secret),
    );
    return { iv: encode(iv), ciphertext: encode(ciphertext) };
  }

  private async decrypt(iv: string, ciphertext: string): Promise<string> {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: decode(iv),
      },
      this.encryptionKey,
      decode(ciphertext),
    );

    return new TextDecoder().decode(decryptedBuffer);
  }

  static async fromBase64Key<TNamespace extends string, TValue>(
    base64EncodedKey: string,
  ): Promise<{
    wrap: (store: Store<TNamespace, TValue>) => Store<TNamespace, TValue>;
  }> {
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      decode(base64EncodedKey),
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );

    const hash = encode(
      await crypto.subtle.digest("SHA-256", decode(base64EncodedKey)),
    );

    return {
      wrap: (store) =>
        new EncryptedStore({
          store,
          encryptionKey: cryptoKey,
          encryptionKeyHash: hash,
        }),
    };
  }
}

const base64abc = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "+",
  "/",
];

/**
 * CREDIT: https://gist.github.com/enepomnyaschih/72c423f727d395eeaa09697058238727
 * Encodes a given Uint8Array, ArrayBuffer or string into RFC4648 base64 representation
 * @param data
 */
function encode(data: ArrayBuffer | string | Uint8Array): string {
  const uint8 =
    typeof data === "string"
      ? new TextEncoder().encode(data)
      : data instanceof Uint8Array
        ? data
        : new Uint8Array(data);
  let result = "";
  let i: number;
  const l = uint8.length;
  for (i = 2; i < l; i += 3) {
    result += base64abc[uint8[i - 2] >> 2];
    result += base64abc[((uint8[i - 2] & 0x03) << 4) | (uint8[i - 1] >> 4)];
    result += base64abc[((uint8[i - 1] & 0x0f) << 2) | (uint8[i] >> 6)];
    result += base64abc[uint8[i] & 0x3f];
  }
  if (i === l + 1) {
    // 1 octet yet to write
    result += base64abc[uint8[i - 2] >> 2];
    result += base64abc[(uint8[i - 2] & 0x03) << 4];
    result += "==";
  }
  if (i === l) {
    // 2 octets yet to write
    result += base64abc[uint8[i - 2] >> 2];
    result += base64abc[((uint8[i - 2] & 0x03) << 4) | (uint8[i - 1] >> 4)];
    result += base64abc[(uint8[i - 1] & 0x0f) << 2];
    result += "=";
  }
  return result.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

/**
 * Decodes a given RFC4648 base64 encoded string
 * @param b64
 */
function decode(b64: string): Uint8Array {
  const paddedLength = b64.length + ((4 - (b64.length % 4)) % 4);
  const binString = atob(
    b64.replaceAll("-", "+").replaceAll("_", "/").padEnd(paddedLength, "="),
  );
  const size = binString.length;
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return bytes;
}

export async function withEncryption<TNamespace extends string, TValue = any>(
  base64Key: string,
): Promise<StoreMiddleware<TNamespace, TValue>> {
  return await EncryptedStore.fromBase64Key(base64Key);
}
